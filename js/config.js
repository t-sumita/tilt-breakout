// Tilt Breakout — アプリケーション設定(版の単一の源)
// このファイルの APP_VERSION が唯一の版定義。他ファイルへの版の直書きは禁止。

export const APP_VERSION = '0.9.0';

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

// ── ボール(重力+空気抵抗モデル。速度は固定せず、毎フレーム変化する)────
export const BALL = {
  radius: 6,
  maxBounceAngleDeg: 65,          // パドル反射の最大角度(端に当たるほど鋭角)
  launchAngleDeg: -68,            // 発射時の基準角度(上方向、パドル傾き最大時)
  launchSpeed: 400,                // px/s。発射時の基準速度
  gravity: 120,                    // px/s^2。下方向への重力加速度
  drag: 0.4,                       // 1秒あたりの速度比例減衰係数(空気抵抗)
  // 壁/ブロック/ジャマー/パドル通常反発の直後に保証する最低速度。
  // launchSpeed と同値にすることで、画面のどの位置で反発しても
  // 重力に負けず最上部まで届く勢いを維持できるようにしている。
  minBounceSpeed: 400,
  paddleRestitutionNormal: 1.0,   // パドル通常反発時の反発係数
  paddleRestitutionCatch: 0.25,   // パドル「受け」動作時の反発係数(大きく減速させる)
  catchSpeedThreshold: 100,        // この速度未満でパドルに接触するとキャッチされる(px/s)
};

// ── ゲーム全体設定(Config画面から実行時に変更可能) ──────────────────
export const GAME = {
  livesStart: 3,     // 残機の初期値
  timeLimitSec: 180,  // 制限時間(秒)
  idleDemoDelaySec: 60, // タイトル画面で操作がないままこの秒数が経過したらデモプレイを開始する
};

export const STAGE_COUNT = 3;

export const SCORE = {
  normalBlock: 10,
  hardBlockHit: 15,
  bastionSquareHit: 20,
  bastionCircleHit: 15,
  ringCoreHit: 25,
};

// ── Config画面のスライダー範囲(min/max/step) ─────────────────────────
export const CONFIG_LIMITS = {
  paddleMoveSpeedMultiplier: { min: 1, max: 6, step: 0.5 },
  gravity: { min: 0, max: 400, step: 10 },
  drag: { min: 0, max: 1, step: 0.05 },
  timeLimitSec: { min: 10, max: 300, step: 10 },
  livesStart: { min: 1, max: 9, step: 1 },
  catchSpeedThreshold: { min: 0, max: 300, step: 10 },
};
