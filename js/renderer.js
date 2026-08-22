// Canvas への描画のみを担当するモジュール。ゲーム状態やルールは持たない。
import { CANVAS_W, CANVAS_H, COLORS, PADDLE } from './config.js';

export function clear(ctx) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

// L字コーナー + 目盛り刻みの直線的な枠装飾
export function drawFrame(ctx) {
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(6, 6, CANVAS_W - 12, CANVAS_H - 12);
  const L = 26;
  const corners = [[6, 6, 1, 1], [CANVAS_W - 6, 6, -1, 1], [6, CANVAS_H - 6, 1, -1], [CANVAS_W - 6, CANVAS_H - 6, -1, -1]];
  corners.forEach(([x, y, sx, sy]) => {
    ctx.beginPath(); ctx.moveTo(x, y + L * sy); ctx.lineTo(x, y); ctx.lineTo(x + L * sx, y); ctx.stroke();
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(x + i * 7 * sx, y); ctx.lineTo(x + i * 7 * sx, y + 5 * sy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + i * 7 * sy); ctx.lineTo(x + 5 * sx, y + i * 7 * sy); ctx.stroke();
    }
  });
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = 'rgba(127,227,212,0.3)';
  ctx.beginPath(); ctx.moveTo(10, PADDLE.yMin); ctx.lineTo(CANVAS_W - 10, PADDLE.yMin); ctx.stroke();
  ctx.restore();
}

function dotFill(ctx, w, h, spacing) {
  ctx.fillStyle = COLORS.fillDot;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = COLORS.line;
  for (let dy = -h / 2 + 3; dy < h / 2; dy += spacing) {
    for (let dx = -w / 2 + 3; dx < w / 2; dx += spacing) {
      ctx.beginPath(); ctx.arc(dx, dy, 1, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function solidStyle(ctx) {
  ctx.fillStyle = COLORS.fillSolid;
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1.5;
}

function drawHpLabel(ctx, text) {
  ctx.fillStyle = COLORS.text;
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
}

export function drawTargets(ctx, targets) {
  for (const t of targets) {
    if (t.destroyed) continue;
    ctx.save();
    ctx.translate(t.x, t.y);
    if (t.shape === 'circle') {
      dotFill(ctx, t.r * 2, t.r * 2, t.dense ? 4 : 7);
      ctx.beginPath(); ctx.arc(0, 0, t.r, 0, Math.PI * 2);
    } else {
      dotFill(ctx, t.halfW * 2, t.halfH * 2, t.dense ? 4 : 7);
      ctx.beginPath(); ctx.rect(-t.halfW, -t.halfH, t.halfW * 2, t.halfH * 2);
    }
    ctx.strokeStyle = COLORS.line; ctx.lineWidth = 1.2; ctx.stroke();
    if (t.revealOnHit) {
      drawHpLabel(ctx, t.revealed ? String(t.hp) : '?');
    } else if (t.maxHp >= 2) {
      drawHpLabel(ctx, String(t.hp));
    }
    ctx.restore();
  }
}

export function drawJammers(ctx, jammers) {
  for (const j of jammers) {
    ctx.save();
    ctx.translate(j.x, j.y);
    ctx.rotate(j.angle || 0);
    solidStyle(ctx);
    if (j.shape === 'cross') {
      const a = j.armThick;
      ctx.beginPath();
      ctx.rect(-j.size / 2, -a / 2, j.size, a);
      ctx.rect(-a / 2, -j.size / 2, a, j.size);
    } else if (j.shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(j.verts[0].x, j.verts[0].y);
      ctx.lineTo(j.verts[1].x, j.verts[1].y);
      ctx.lineTo(j.verts[2].x, j.verts[2].y);
      ctx.closePath();
    } else {
      ctx.beginPath();
      ctx.rect(-j.halfW, -j.halfH, j.halfW * 2, j.halfH * 2);
    }
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

export function drawRings(ctx, rings) {
  ctx.strokeStyle = COLORS.line;
  for (const ring of rings) {
    const step = (Math.PI * 2) / ring.segments;
    ctx.lineWidth = ring.halfThickness * 2;
    for (let s = 0; s < ring.segments; s++) {
      const a0 = ring.angle + s * step, a1 = a0 + ring.arcRad;
      ctx.beginPath(); ctx.arc(ring.cx, ring.cy, ring.radius, a0, a1); ctx.stroke();
    }
  }
}

export function drawPaddle(ctx, paddle) {
  ctx.save();
  ctx.translate(paddle.x, paddle.y);
  ctx.rotate((paddle.tilt * Math.PI) / 180);
  ctx.fillStyle = COLORS.text;
  ctx.fillRect(-paddle.halfW, -paddle.halfH, paddle.halfW * 2, paddle.halfH * 2);
  ctx.restore();
}

export function drawBall(ctx, ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.text;
  ctx.fill();
}

export function render(ctx, state) {
  clear(ctx);
  drawFrame(ctx);
  if (state.rings && state.rings.length) drawRings(ctx, state.rings);
  drawJammers(ctx, state.jammers);
  drawTargets(ctx, state.targets);
  drawPaddle(ctx, state.paddle);
  if (state.ball) drawBall(ctx, state.ball);
}
