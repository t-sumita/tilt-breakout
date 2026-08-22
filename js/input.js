// パドルの2次元移動・傾き操作を担当するモジュール。
// 1本指スワイプ=移動、2本指タッチ=傾き、キーボードは移動+傾きの両方に対応する。
import { CANVAS_W, PADDLE } from './config.js';
import { clamp } from './mathutils.js';

export class PaddleInput {
  constructor(canvasEl, opts = {}) {
    this.canvasEl = canvasEl;
    this.x = CANVAS_W / 2;
    this.y = PADDLE.yMax;
    this.tilt = 0;
    this.halfW = PADDLE.halfW;
    this.halfH = PADDLE.halfH;
    this.onTap = opts.onTap || (() => {});
    this.pointers = new Map();
    this.keys = new Set();
    this._bind();
  }

  _toCanvasPoint(clientX, clientY) {
    const r = this.canvasEl.getBoundingClientRect();
    const scale = CANVAS_W / r.width;
    return { x: (clientX - r.left) * scale, y: (clientY - r.top) * scale };
  }

  _speedFactor(y) {
    const t = (PADDLE.yMax - y) / (PADDLE.yMax - PADDLE.yMin);
    return 1 - clamp(t, 0, 1) * (1 - PADDLE.minSpeedFactor);
  }

  _bind() {
    const el = this.canvasEl;
    el.addEventListener('pointerdown', (e) => {
      const pt = this._toCanvasPoint(e.clientX, e.clientY);
      el.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, pt);
      if (this.pointers.size === 1) this.onTap();
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      const prev = this.pointers.get(e.pointerId);
      const cur = this._toCanvasPoint(e.clientX, e.clientY);
      this.pointers.set(e.pointerId, cur);
      if (this.pointers.size === 1) {
        const dx = cur.x - prev.x, dy = cur.y - prev.y;
        const f = this._speedFactor(this.y);
        this.x = clamp(this.x + dx * f, PADDLE.xMin, PADDLE.xMax);
        this.y = clamp(this.y + dy * f, PADDLE.yMin, PADDLE.yMax);
      } else if (this.pointers.size >= 2) {
        const pts = [...this.pointers.values()].sort((a, b) => a.x - b.x);
        const left = pts[0], right = pts[pts.length - 1];
        this.tilt = clamp((right.y - left.y) * PADDLE.tiltGestureGain, -PADDLE.maxTiltDeg, PADDLE.maxTiltDeg);
      }
    });
    const release = (e) => this.pointers.delete(e.pointerId);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space' || e.code === 'Enter') this.onTap();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  // キーボードでの連続移動・傾き変化を dt 分だけ適用する
  update(dt) {
    const f = this._speedFactor(this.y);
    const moveSpeed = 260 * f; // px/s
    if (this.keys.has('ArrowLeft')) this.x -= moveSpeed * dt;
    if (this.keys.has('ArrowRight')) this.x += moveSpeed * dt;
    if (this.keys.has('ArrowUp')) this.y -= moveSpeed * dt;
    if (this.keys.has('ArrowDown')) this.y += moveSpeed * dt;
    this.x = clamp(this.x, PADDLE.xMin, PADDLE.xMax);
    this.y = clamp(this.y, PADDLE.yMin, PADDLE.yMax);

    const tiltStep = PADDLE.tiltKeyRateDegPerSec * dt;
    if (this.keys.has('KeyQ') || this.keys.has('Comma')) this.tilt -= tiltStep;
    if (this.keys.has('KeyE') || this.keys.has('Period')) this.tilt += tiltStep;
    this.tilt = clamp(this.tilt, -PADDLE.maxTiltDeg, PADDLE.maxTiltDeg);
  }

  getPaddle() {
    return { x: this.x, y: this.y, tilt: this.tilt, halfW: this.halfW, halfH: this.halfH };
  }
}
