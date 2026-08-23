// ゲームの状態遷移(タイトル/発射待ち/プレイ中/ステージクリア/ゲームオーバー/勝利)を
// 管理する。物理は physics.js、描画は renderer.js に委譲する。
import { PADDLE, BALL, GAME, STAGE_COUNT, SCORE, CX } from './config.js';
import { Ball } from './ball.js';
import { updateMotion, stepBall } from './physics.js';
import { createStage1 } from './stages/stage1.js';
import { createStage2 } from './stages/stage2.js';
import { createStage3 } from './stages/stage3.js';
import { loadHighScore, saveHighScore } from './highscore.js';
import { Fireworks } from './fireworks.js';
import { clamp, randInt } from './mathutils.js';

const DEMO_PADDLE_FOLLOW_SPEED = 260; // px/s。デモプレイAIがボールを追う速度
const DEMO_TILT_GAIN = PADDLE.maxTiltDeg / DEMO_PADDLE_FOLLOW_SPEED; // 横移動速度→傾き角への変換係数
const FIREWORKS_BURST_RATE = 3.2; // 1秒あたりの平均打ち上げ回数(オールクリア/隠しコマンド共通)

const STAGE_BUILDERS = [createStage1, createStage2, createStage3];

function scoreValueFor(target) {
  if (target.isCore) return SCORE.ringCoreHit;
  if (target.isSquare) return SCORE.bastionSquareHit;
  if (target.dense) return SCORE.hardBlockHit;
  if (target.shape === 'circle') return SCORE.bastionCircleHit;
  return SCORE.normalBlock;
}

export class Game {
  constructor(paddleInput) {
    this.paddleInput = paddleInput;
    this.state = 'title'; // title | serve | playing | stageClear | gameOver | win | demo
    this.stageIndex = 0;
    this.lives = GAME.livesStart;
    this.score = 0;
    this.highScore = loadHighScore();
    this.timeRemaining = GAME.timeLimitSec;
    this.sequentialClearEligible = true; // Config のステージ選択で飛ばした場合は false になる
    this.allClear = false; // 1→2→3を通しでクリアした場合のみ true(オールクリア演出の対象)
    this.overReason = null; // 'time' | 'lives' | null
    this.paused = false; // Config パネルを開いている間 true(物理・タイマーを止める)
    this.stageData = { targets: [], jammers: [], rings: null };
    this.ball = new Ball(0, 0);
    this.fireworks = new Fireworks();
    this.onHudChange = null;
    // 隠しコマンド(メンテナンス合言葉)による花火演出のみの再現。実際のオールクリア記録には一切関与しない。
    this.easterEgg = { active: false };
    // アイドル時のデモプレイ。実プレイの state/stageData/ball/score/lives とは完全に独立させ、
    // デモの進行が本当の記録(スコア/ハイスコア/ステージクリア状態)へ影響しないようにする。
    this.demo = null;
  }

  _hud() {
    if (this.onHudChange) this.onHudChange(this);
  }

  // タイトル/ゲームオーバーから新しい通しプレイを開始する
  _startRun() {
    this.lives = GAME.livesStart;
    this.score = 0;
    this.timeRemaining = GAME.timeLimitSec;
    this.sequentialClearEligible = true;
    this.allClear = false;
    this.overReason = null;
    this.fireworks.clear();
    this._loadStage(0);
    this.state = 'serve';
  }

  // Config画面のステージ選択から直接ジャンプする(通しクリアではないためオールクリア対象外にする)
  jumpToStage(index) {
    this.sequentialClearEligible = false;
    this._loadStage(index);
    this.state = 'serve';
    this._hud();
  }

  handleTap() {
    if (this.easterEgg.active) {
      // 演出中のタップは実操作へ波及させず、演出を静かに終わらせるだけにする
      this.easterEgg.active = false;
      this.fireworks.clear();
      this._hud();
      return;
    }
    if (this.state === 'demo') {
      this.stopDemo();
      return;
    }
    if (this.state === 'title') {
      this._startRun();
    } else if (this.state === 'serve' || (this.state === 'playing' && this.ball.stuck)) {
      this._launchFromPaddle();
      this.state = 'playing';
    } else if (this.state === 'stageClear') {
      if (this.stageIndex + 1 >= STAGE_COUNT) {
        this.allClear = this.sequentialClearEligible;
        this.state = 'win';
        this._finalizeRun();
      } else {
        this._loadStage(this.stageIndex + 1);
        this.state = 'serve';
      }
    } else if (this.state === 'gameOver') {
      this._startRun();
    } else if (this.state === 'win') {
      this.state = 'title';
    }
    this._hud();
  }

  _launchFromPaddle() {
    // 発射角はパドルの傾きを反映しつつ、常に上方向へ飛ぶよう基準角(-90°=真上)から
    // 左右に振る。BALL.launchAngleDeg は真上からの最大振れ幅として使う。
    const spread = 90 + BALL.launchAngleDeg; // 例: -68 なら 22°
    const angleDeg = -90 + Math.max(-1, Math.min(1, this.paddleInput.tilt / PADDLE.maxTiltDeg)) * spread;
    this.ball.launch(angleDeg);
  }

  _loadStage(index) {
    this.stageIndex = index;
    this.stageData = STAGE_BUILDERS[index]();
    this._restickBall();
  }

  _restickBall() {
    this.ball = new Ball(this.paddleInput.x, this.paddleInput.y - this.paddleInput.halfH - BALL.radius - 1);
  }

  _finalizeRun() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveHighScore(this.highScore);
    }
  }

  // 隠しコマンド用: 既存のオールクリア花火演出だけを再現する(state/score/highScore/allClear には触れない)。
  // 本番のオールクリア演出と同様、時間では終わらせず何か操作(タップ等)されるまで続ける。
  playEasterEggDemo() {
    this.fireworks.clear();
    this.easterEgg.active = true;
    this._hud();
  }

  // タイトル画面が一定時間操作されなかった際のアトラクトモード。
  // 実プレイの state/stageData/ball/score/lives/timeRemaining には一切触れず、
  // 専用の this.demo オブジェクトだけで完結させる。
  startDemo() {
    if (this.state !== 'title') return;
    const stageIndex = randInt(0, STAGE_COUNT - 1);
    const paddle = { x: CX, y: PADDLE.yMax, tilt: 0, halfW: PADDLE.halfW, halfH: PADDLE.halfH, vx: 0, vy: 0 };
    this.demo = {
      stageIndex,
      stageData: STAGE_BUILDERS[stageIndex](),
      paddle,
      ball: new Ball(paddle.x, paddle.y - paddle.halfH - BALL.radius - 1),
    };
    this._launchDemoBall();
    this.state = 'demo';
    this._hud();
  }

  stopDemo() {
    if (this.state !== 'demo') return;
    this.demo = null;
    this.state = 'title';
    this._hud();
  }

  _launchDemoBall() {
    const spread = 90 + BALL.launchAngleDeg;
    const angleDeg = -90 + (Math.random() * 2 - 1) * spread;
    this.demo.ball.launch(angleDeg);
  }

  _updateDemo(dt, elapsed) {
    const { stageData, paddle, ball } = this.demo;
    updateMotion(stageData.jammers, elapsed, dt);
    if (stageData.rings) updateMotion(stageData.rings, elapsed, dt);

    // 簡易AI: ボールのx座標を追いかけるだけのスクリプトされた動き
    const targetX = clamp(ball.x, PADDLE.xMin, PADDLE.xMax);
    const maxStep = DEMO_PADDLE_FOLLOW_SPEED * dt;
    const dx = clamp(targetX - paddle.x, -maxStep, maxStep);
    paddle.x = clamp(paddle.x + dx, PADDLE.xMin, PADDLE.xMax);
    paddle.vx = dt > 0 ? dx / dt : 0;

    // 縦方向: 普段は緩やかに上下へ揺れ、ボールが近づいて落下中は迎えに上がる
    const nearX = Math.abs(ball.x - paddle.x) < paddle.halfW * 3;
    const falling = ball.vy > 0;
    const idleY = PADDLE.yMax - 16 + Math.sin(elapsed * 0.8) * 16;
    const targetY = (nearX && falling) ? clamp(ball.y - 36, PADDLE.yMin, PADDLE.yMax) : clamp(idleY, PADDLE.yMin, PADDLE.yMax);
    const maxStepY = DEMO_PADDLE_FOLLOW_SPEED * 0.6 * dt;
    const dy = clamp(targetY - paddle.y, -maxStepY, maxStepY);
    paddle.y = clamp(paddle.y + dy, PADDLE.yMin, PADDLE.yMax);
    paddle.vy = dt > 0 ? dy / dt : 0;

    // 傾き: 移動方向へわずかに傾ける(見た目のアクセント)
    paddle.tilt = clamp(paddle.vx * DEMO_TILT_GAIN, -PADDLE.maxTiltDeg, PADDLE.maxTiltDeg);

    if (ball.stuck) {
      ball.x = paddle.x;
      ball.y = paddle.y - paddle.halfH - ball.radius - 1;
      this._launchDemoBall();
      return;
    }

    const events = stepBall(ball, dt, paddle, stageData.targets, stageData.jammers, stageData.rings);
    for (const ev of events) {
      if (ev.type === 'ballLost') {
        this.demo.ball = new Ball(paddle.x, paddle.y - paddle.halfH - BALL.radius - 1);
        this._launchDemoBall();
        return;
      }
    }

    if (stageData.targets.every((t) => t.destroyed)) {
      this.startDemo(); // 次のランダムなステージへ続ける
    }
  }

  update(dt, elapsed) {
    if (this.paused) return;

    if (this.easterEgg.active) {
      this.fireworks.update(dt);
      if (Math.random() < dt * FIREWORKS_BURST_RATE) {
        this.fireworks.spawnBurst(40 + Math.random() * 320, 80 + Math.random() * 220);
      }
    }

    if (this.state === 'demo') {
      this._updateDemo(dt, elapsed);
      return;
    }

    const paddle = this.paddleInput.getPaddle();

    if (this.state === 'win' && this.allClear) {
      this.fireworks.update(dt);
      if (Math.random() < dt * FIREWORKS_BURST_RATE) {
        this.fireworks.spawnBurst(40 + Math.random() * 320, 80 + Math.random() * 220);
      }
    }

    if (this.state === 'serve') {
      this.ball.x = paddle.x;
      this.ball.y = paddle.y - paddle.halfH - this.ball.radius - 1;
      return;
    }
    if (this.state !== 'playing') return;

    // 制限時間はキャッチ中も止めずに進行させる
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.overReason = 'time';
      this.state = 'gameOver';
      this._finalizeRun();
      this._hud();
      return;
    }

    updateMotion(this.stageData.jammers, elapsed, dt);
    if (this.stageData.rings) updateMotion(this.stageData.rings, elapsed, dt);

    if (this.ball.stuck) {
      // キャッチ中の玉はパドルに追従する(ジャマー/リングは上で動かし済み)
      this.ball.x = paddle.x;
      this.ball.y = paddle.y - paddle.halfH - this.ball.radius - 1;
      return;
    }

    const events = stepBall(this.ball, dt, paddle, this.stageData.targets, this.stageData.jammers, this.stageData.rings);
    for (const ev of events) {
      if (ev.type === 'brickHit') {
        this.score += scoreValueFor(ev.target);
      } else if (ev.type === 'ballLost') {
        this.lives -= 1;
        if (this.lives <= 0) {
          this.overReason = 'lives';
          this.state = 'gameOver';
          this._finalizeRun();
        } else {
          this._restickBall();
          this.state = 'serve';
        }
        this._hud();
        return;
      }
    }

    const cleared = this.stageData.targets.every((t) => t.destroyed);
    if (cleared) {
      this.state = 'stageClear';
      this._hud();
    }
  }

  getRenderState() {
    if (this.state === 'demo') {
      return {
        targets: this.demo.stageData.targets,
        jammers: this.demo.stageData.jammers,
        rings: this.demo.stageData.rings,
        paddle: this.demo.paddle,
        ball: this.demo.ball,
        fireworks: this.fireworks.particles,
      };
    }
    return {
      targets: this.stageData.targets,
      jammers: this.stageData.jammers,
      rings: this.stageData.rings,
      paddle: this.paddleInput.getPaddle(),
      ball: this.ball,
      fireworks: this.fireworks.particles,
    };
  }
}
