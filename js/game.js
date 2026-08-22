// ゲームの状態遷移(タイトル/発射待ち/プレイ中/ステージクリア/ゲームオーバー/勝利)を
// 管理する。物理は physics.js、描画は renderer.js に委譲する。
import { PADDLE, BALL, LIVES_START, STAGE_COUNT, SCORE } from './config.js';
import { Ball } from './ball.js';
import { updateMotion, stepBall } from './physics.js';
import { createStage1 } from './stages/stage1.js';
import { createStage2 } from './stages/stage2.js';
import { createStage3 } from './stages/stage3.js';

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
    this.lives = LIVES_START;
    this.score = 0;
    this.stageData = { targets: [], jammers: [], rings: null };
    this.ball = new Ball(0, 0);
    this.onHudChange = null;
  }

  _hud() {
    if (this.onHudChange) this.onHudChange(this);
  }

  handleTap() {
    if (this.state === 'title') {
      this._loadStage(0);
      this.state = 'serve';
    } else if (this.state === 'serve') {
      this._launchFromPaddle();
      this.state = 'playing';
    } else if (this.state === 'stageClear') {
      if (this.stageIndex + 1 >= STAGE_COUNT) {
        this.state = 'win';
      } else {
        this._loadStage(this.stageIndex + 1);
        this.state = 'serve';
      }
    } else if (this.state === 'gameOver' || this.state === 'win') {
      this.lives = LIVES_START;
      this.score = 0;
      this._loadStage(0);
      this.state = 'serve';
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
    this.ball = new Ball(this.paddleInput.x, this.paddleInput.y - this.paddleInput.halfH - BALL.radius - 1);
  }

  _restickBall() {
    this.ball = new Ball(this.paddleInput.x, this.paddleInput.y - this.paddleInput.halfH - BALL.radius - 1);
  }

  update(dt, elapsed) {
    const paddle = this.paddleInput.getPaddle();

    if (this.state === 'serve') {
      this.ball.x = paddle.x;
      this.ball.y = paddle.y - paddle.halfH - this.ball.radius - 1;
      return;
    }
    if (this.state !== 'playing') return;

    updateMotion(this.stageData.jammers, elapsed, dt);
    if (this.stageData.rings) updateMotion(this.stageData.rings, elapsed, dt);

    const events = stepBall(this.ball, dt, paddle, this.stageData.targets, this.stageData.jammers, this.stageData.rings);
    for (const ev of events) {
      if (ev.type === 'brickHit') {
        this.score += scoreValueFor(ev.target);
      } else if (ev.type === 'ballLost') {
        this.lives -= 1;
        if (this.lives <= 0) {
          this.state = 'gameOver';
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
    };
  }
}
