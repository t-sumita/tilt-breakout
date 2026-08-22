// 当たり判定・反射・ジャマーの運動更新を担当するモジュール。
// レンダラー(renderer.js)や状態管理(game.js)には依存しない。
import { CANVAS_W, CANVAS_H, BALL } from './config.js';
import { clamp, toLocal, toWorldDir, randInt } from './mathutils.js';

const WALL_MARGIN = 10;

// ── ジャマーの運動(回転・スライド)を進める ──────────────────────────
export function updateMotion(objects, elapsed, dt) {
  for (const o of objects) {
    if (!o.motion) continue;
    if (o.motion.type === 'rotate') {
      o.angle = (o.angle || 0) + o.motion.speed * dt;
    } else if (o.motion.type === 'slide') {
      const off = Math.sin(elapsed * o.motion.speed + (o.motion.phase || 0)) * o.motion.amplitude;
      if (o.motion.axis === 'x') o.x = o.baseX + off;
      else o.y = o.baseY + off;
    }
  }
}

// ── 図形ごとの円との衝突判定。ワールド座標系の法線と貫通量を返す ──────
function circleRect(bx, by, br, rx, ry, angle, halfW, halfH) {
  const local = toLocal(bx, by, rx, ry, angle || 0);
  const cx = clamp(local.x, -halfW, halfW);
  const cy = clamp(local.y, -halfH, halfH);
  const dx = local.x - cx, dy = local.y - cy;
  const dist = Math.hypot(dx, dy);
  let nlx, nly, penetration;
  if (dist > 1e-6) {
    if (dist >= br) return null;
    nlx = dx / dist; nly = dy / dist;
    penetration = br - dist;
  } else {
    // 中心がめり込んでいる場合は最も浅い面へ押し出す
    const px = halfW - Math.abs(local.x);
    const py = halfH - Math.abs(local.y);
    if (px < py) { nlx = local.x >= 0 ? 1 : -1; nly = 0; penetration = px + br; }
    else { nlx = 0; nly = local.y >= 0 ? 1 : -1; penetration = py + br; }
  }
  const n = toWorldDir(nlx, nly, angle || 0);
  return { normal: n, penetration };
}

function circleCircle(bx, by, br, cx, cy, r) {
  const dx = bx - cx, dy = by - cy;
  const dist = Math.hypot(dx, dy);
  if (dist >= br + r || dist < 1e-6) return null;
  return { normal: { x: dx / dist, y: dy / dist }, penetration: br + r - dist };
}

function closestOnSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby || 1), 0, 1);
  return { x: ax + abx * t, y: ay + aby * t };
}

function pointInTriangle(px, py, verts) {
  let sign = 0;
  for (let i = 0; i < 3; i++) {
    const a = verts[i], b = verts[(i + 1) % 3];
    const cross = (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x);
    const s = Math.sign(cross);
    if (s !== 0) {
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
  }
  return true;
}

function circleTriangle(bx, by, br, tx, ty, angle, verts) {
  const local = toLocal(bx, by, tx, ty, angle || 0);
  const inside = pointInTriangle(local.x, local.y, verts);
  let best = null;
  for (let i = 0; i < 3; i++) {
    const a = verts[i], b = verts[(i + 1) % 3];
    const cp = closestOnSegment(local.x, local.y, a.x, a.y, b.x, b.y);
    const dx = local.x - cp.x, dy = local.y - cp.y;
    const dist = Math.hypot(dx, dy);
    if (!best || dist < best.dist) best = { dist, dx, dy };
  }
  if (inside) {
    if (best.dist < 1e-6) return null;
    const nlx = -best.dx / best.dist, nly = -best.dy / best.dist;
    const n = toWorldDir(nlx, nly, angle || 0);
    return { normal: n, penetration: br + best.dist };
  }
  if (best.dist >= br || best.dist < 1e-6) return null;
  const nlx = best.dx / best.dist, nly = best.dy / best.dist;
  const n = toWorldDir(nlx, nly, angle || 0);
  return { normal: n, penetration: br - best.dist };
}

// 回転する円弧(リング)との衝突。normal は半径方向。
function circleArcRing(bx, by, br, ring) {
  const dx = bx - ring.cx, dy = by - ring.cy;
  const dist = Math.hypot(dx, dy) || 1e-6;
  const inner = ring.radius - ring.halfThickness;
  const outer = ring.radius + ring.halfThickness;
  if (dist < inner - br || dist > outer + br) return null;
  const step = (Math.PI * 2) / ring.segments;
  let rel = (Math.atan2(dy, dx) - ring.angle) % step;
  if (rel < 0) rel += step;
  if (rel > ring.arcRad) return null; // 弧の隙間 → 衝突なし
  const sign = dist >= ring.radius ? 1 : -1;
  return {
    normal: { x: sign * dx / dist, y: sign * dy / dist },
    penetration: sign > 0 ? (br - (dist - outer)) : (br - (inner - dist)),
  };
}

function collide(ball, obj) {
  if (obj.shape === 'rect') {
    return circleRect(ball.x, ball.y, ball.radius, obj.x, obj.y, obj.angle, obj.halfW, obj.halfH);
  }
  if (obj.shape === 'circle') {
    return circleCircle(ball.x, ball.y, ball.radius, obj.x, obj.y, obj.r);
  }
  if (obj.shape === 'cross') {
    const a = obj.armThick / 2;
    return circleRect(ball.x, ball.y, ball.radius, obj.x, obj.y, obj.angle, obj.size / 2, a)
      || circleRect(ball.x, ball.y, ball.radius, obj.x, obj.y, obj.angle, a, obj.size / 2);
  }
  if (obj.shape === 'triangle') {
    return circleTriangle(ball.x, ball.y, ball.radius, obj.x, obj.y, obj.angle, obj.verts);
  }
  return null;
}

function reflect(ball, normal) {
  const dot = ball.vx * normal.x + ball.vy * normal.y;
  if (dot >= 0) return; // すでに離れていく向きなら反射しない(二重反射防止)
  ball.vx -= 2 * dot * normal.x;
  ball.vy -= 2 * dot * normal.y;
}

function pushOut(ball, normal, penetration) {
  ball.x += normal.x * penetration;
  ball.y += normal.y * penetration;
}

// ── パドルとの衝突。当たった位置と傾きで反射角を作る(古典ブロック崩し方式)──
function collidePaddle(ball, paddle) {
  const angleRad = (paddle.tilt * Math.PI) / 180;
  const hit = circleRect(ball.x, ball.y, ball.radius, paddle.x, paddle.y, angleRad, paddle.halfW, paddle.halfH);
  if (!hit) return false;
  if (ball.vy < 0) return false; // 下向きに移動中でなければ無視(すり抜け防止の誤反射回避)
  const local = toLocal(ball.x, ball.y, paddle.x, paddle.y, angleRad);
  const ratio = clamp(local.x / paddle.halfW, -1, 1);
  const outAngleDeg = -90 + ratio * BALL.maxBounceAngleDeg;
  const rad = (outAngleDeg * Math.PI) / 180;
  const dir = toWorldDir(Math.cos(rad), Math.sin(rad), angleRad);
  ball.vx = dir.x * BALL.speed;
  ball.vy = dir.y * BALL.speed;
  pushOut(ball, hit.normal, hit.penetration + 0.5);
  return true;
}

// ── 1フレーム分のボール更新。発生イベントを配列で返す ────────────────
export function stepBall(ball, dt, paddle, targets, jammers, rings) {
  const events = [];
  if (ball.stuck) return events;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // 壁(左右・上)
  if (ball.x - ball.radius < WALL_MARGIN) {
    ball.x = WALL_MARGIN + ball.radius;
    ball.vx = Math.abs(ball.vx);
    events.push({ type: 'wallBounce' });
  } else if (ball.x + ball.radius > CANVAS_W - WALL_MARGIN) {
    ball.x = CANVAS_W - WALL_MARGIN - ball.radius;
    ball.vx = -Math.abs(ball.vx);
    events.push({ type: 'wallBounce' });
  }
  if (ball.y - ball.radius < WALL_MARGIN) {
    ball.y = WALL_MARGIN + ball.radius;
    ball.vy = Math.abs(ball.vy);
    events.push({ type: 'wallBounce' });
  }

  // 場外(下に落ちた)
  if (ball.y - ball.radius > CANVAS_H) {
    events.push({ type: 'ballLost' });
    return events;
  }

  // パドル
  if (collidePaddle(ball, paddle)) {
    events.push({ type: 'paddleBounce' });
  }

  // 破壊可能なターゲット
  for (const t of targets) {
    if (t.destroyed) continue;
    const hit = collide(ball, t);
    if (!hit) continue;
    reflect(ball, hit.normal);
    pushOut(ball, hit.normal, hit.penetration + 0.5);
    if (t.revealOnHit && !t.revealed) {
      t.revealed = true;
      if (t.randomHp) t.hp = randInt(t.randomHp[0], t.randomHp[1]);
      events.push({ type: 'revealed', target: t });
    }
    t.hp -= 1;
    events.push({ type: 'brickHit', target: t });
    if (t.hp <= 0) {
      t.destroyed = true;
      events.push({ type: 'brickDestroyed', target: t });
    }
    break; // 1フレームにつき1オブジェクトのみ処理(安定性のため)
  }

  // 破壊不能なジャマー(通常形状)
  for (const j of jammers) {
    const hit = collide(ball, j);
    if (!hit) continue;
    reflect(ball, hit.normal);
    pushOut(ball, hit.normal, hit.penetration + 0.5);
    events.push({ type: 'jammerBounce', jammer: j });
    break;
  }

  // 回転リング(弧)
  if (rings) {
    for (const ring of rings) {
      const hit = circleArcRing(ball.x, ball.y, ball.radius, ring);
      if (!hit) continue;
      reflect(ball, hit.normal);
      pushOut(ball, hit.normal, hit.penetration + 0.5);
      events.push({ type: 'jammerBounce', jammer: ring });
      break;
    }
  }

  ball.normalizeSpeed();
  return events;
}
