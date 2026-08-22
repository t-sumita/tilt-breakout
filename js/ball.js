import { BALL } from './config.js';

export class Ball {
  constructor(x, y) {
    this.radius = BALL.radius;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.stuck = true; // パドルに乗っている(発射前)
  }

  launch(angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    this.vx = Math.cos(rad) * BALL.speed;
    this.vy = Math.sin(rad) * BALL.speed;
    this.stuck = false;
  }

  // 速度の向きを保ったまま、大きさ(速さ)を一定値に正規化する
  normalizeSpeed() {
    const s = Math.hypot(this.vx, this.vy) || 1;
    const scale = BALL.speed / s;
    this.vx *= scale;
    this.vy *= scale;
  }
}
