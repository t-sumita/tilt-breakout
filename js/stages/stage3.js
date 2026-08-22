// ステージ3: 回転リング面
// 中心コアが唯一の破壊対象。3枚の回転リングは破壊不能のジャマーとして
// ボールを弾き、リング同士の隙間(常にどこかは開いている)を狙って通す。
import { CX } from '../config.js';

const RING_CX = CX;
const RING_CY = 190;
const CORE_RADIUS = 24;

export function createStage3() {
  const targets = [
    {
      shape: 'circle', x: RING_CX, y: RING_CY, r: CORE_RADIUS,
      hp: 1, maxHp: 1, revealOnHit: true, revealed: false, randomHp: [1, 9], isCore: true,
    },
  ];

  // 穴(空き角度)を1.5倍に拡大し、最内周はコア外周に接触する半径まで縮小、
  // リング間隔(半径差)も1.5倍に拡大した(1枚ずつ独立に再計算。STATUS.md 判断ログ参照)。
  const ringDefs = [
    { radius: 29, segments: 6, arcDeg: 33, vel: 0.5 },
    { radius: 68, segments: 8, arcDeg: 28.5, vel: -0.38 },
    { radius: 107, segments: 10, arcDeg: 24, vel: 0.26 },
  ];
  const rings = ringDefs.map((r) => ({
    cx: RING_CX, cy: RING_CY, radius: r.radius, halfThickness: 5,
    segments: r.segments, arcRad: (r.arcDeg * Math.PI) / 180,
    angle: 0, motion: { type: 'rotate', speed: r.vel },
  }));

  return { targets, jammers: [], rings };
}
