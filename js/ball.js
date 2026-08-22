import { BALL } from './config.js';

export class Ball {
  constructor(x, y) {
    this.radius = BALL.radius;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.stuck = true; // パドルに乗っている(発射前、またはパドルにキャッチされた状態)
  }

  launch(angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    this.vx = Math.cos(rad) * BALL.launchSpeed;
    this.vy = Math.sin(rad) * BALL.launchSpeed;
    this.stuck = false;
  }
}
