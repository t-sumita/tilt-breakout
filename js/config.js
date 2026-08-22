// Tilt Breakout — アプリケーション設定(版の単一の源)
// このファイルの APP_VERSION が唯一の版定義。他ファイルへの版の直書きは禁止。

export const APP_VERSION = '0.4.0';

export const CANVAS_W = 400;
export const CANVAS_H = 560;
export const CX = CANVAS_W / 2;

export const COLORS = {
  bg: '#0b1020',
  panel: '#0f1630',
  line: '#7fe3d4',
  lineDim: 'rgba(127,227,212,0.35)',
  fillSolid: 'rgba(127,227,212,0.16)',
  fillDot: 'rgba(127,227,212,0.10)',
  text: '#dff7f2',
};

// ── パドル ──────────────────────────────────────────────────────────
export const PADDLE = {
  halfW: 30,
  halfH: 6,
  yMax: CANVAS_H - 50,      // 可動域の下限(等速)
  yMin: CANVAS_H / 3,       // 可動域の上限(最も減速)
  xMin: 30 + 5,
  xMax: CANVAS_W - 30 - 5,
  minSpeedFactor: 0.4,      // 上限付近での速度係数(下限=1.0)
  moveSpeedMultiplier: 3,   // 移動速度の倍率(ポインタ/タッチのドラッグ量・キーボード移動速度の両方に適用)
  keyMoveSpeedBase: 260,    // px/s(キーボード移動速度の基準値。実速度は上の倍率を掛けた値)
  maxTiltDeg: 20,
  tiltGestureGain: 0.15,    // 2本指の高さ差 → 傾き角の係数
  tiltKeyRateDegPerSec: 60, // キーボードでの傾き変化速度
};

// ── ボール ──────────────────────────────────────────────────────────
export const BALL = {
  radius: 6,
  speed: 230,               // px/s(一定速度を維持し、方向のみ変化)
  maxBounceAngleDeg: 65,    // パドル反射の最大角度(端に当たるほど鋭角)
  launchAngleDeg: -68,      // 発射時の基準角度(上方向)
};

export const LIVES_START = 3;
export const STAGE_COUNT = 3;

export const SCORE = {
  normalBlock: 10,
  hardBlockHit: 15,
  bastionSquareHit: 20,
  bastionCircleHit: 15,
  ringCoreHit: 25,
};
