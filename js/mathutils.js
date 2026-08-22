export function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ワールド座標 (px,py) を、中心 (cx,cy)・角度 angleRad の局所座標系へ変換する
export function toLocal(px, py, cx, cy, angleRad) {
  const dx = px - cx, dy = py - cy;
  const cos = Math.cos(-angleRad), sin = Math.sin(-angleRad);
  return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
}

// 局所座標系のベクトル (lx,ly) を、角度 angleRad だけ回してワールド座標系へ戻す
export function toWorldDir(lx, ly, angleRad) {
  const cos = Math.cos(angleRad), sin = Math.sin(angleRad);
  return { x: lx * cos - ly * sin, y: lx * sin + ly * cos };
}

export function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
