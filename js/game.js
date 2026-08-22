// ゲームの状態遷移(タイトル/発射待ち/プレイ中/ステージクリア/ゲームオーバー/勝利)を
// 管理する。物理は physics.js、描画は renderer.js に委譲する。
import { PADDLE, BALL, GAME, STAGE_COUNT, SCORE } from './config.js';
import { Ball } from './ball.js';
import { updateMotion, stepBall } from './physics.js';
import { createStage1 } from './stages/stage1.js';
import { createStage2 } from './stages/stage2.js';
import { createStage3 } from './stages/stage3.js';
import { loadHighScore, saveHighScore } from './highscore.js';
import { Fireworks } from './fireworks.js';

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
    this.state = 'title'; // title | serve | playing | stageClear | gameOver | win
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

  update(dt, elapsed) {
    if (this.paused) return;
    const paddle = this.paddleInput.getPaddle();

    if (this.state === 'win' && this.allClear) {
      this.fireworks.update(dt);
      if (Math.random() < dt * 1.5) {
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
