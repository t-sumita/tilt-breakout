// ステージ2: 固定障害物面(非リング面)
// 座標・寸法は docs/reference/stage-mock.html のブラケット/クロス/三角/丸/下段配置を
// そのまま踏襲する(特に凹ブラケットと回転十字ジャマーの位置関係は変更しないこと)。
import { CX, BALL } from '../config.js';

const CB_X = CX;      // ブラケット構造の中心 x
const CB_Y = 210;      // ブラケット構造の中心 y(モックの cyB)

export function createStage2() {
  const targets = [];
  const jammers = [];

  // 中央の正方形(傾きなし、初期「?」、最初のヒットで確定した大きめの耐久値)
  targets.push({
    shape: 'rect', x: CB_X, y: CB_Y - 100, angle: 0, halfW: 35, halfH: 35,
    hp: 24, maxHp: 24, revealOnHit: true, revealed: false, isSquare: true,
  });

  // 凹ブラケット(上下キャップ+側面の脚。中央42pxの帯だけが唯一の横穴)
  // 脚の長さは片側6pxずつ短縮(20→14)し、穴の高さを玉1個分(直径12px)広げた(30→42px)。
  const BR_LT = 16, BR_CAP = 16, BR_LEG = 14;
  const rectFromCorners = (x0, y0, x1, y1) => ({
    shape: 'rect', angle: 0,
    x: CB_X + (x0 + x1) / 2, y: CB_Y + (y0 + y1) / 2,
    halfW: (x1 - x0) / 2, halfH: (y1 - y0) / 2,
  });
  jammers.push(
    rectFromCorners(-35 - BR_LT, -135 - BR_CAP, 35 + BR_LT, -135),       // 上キャップ
    rectFromCorners(35, -135, 35 + BR_LT, -135 + BR_LEG),                // 上・右脚
    rectFromCorners(-35 - BR_LT, -135, -35, -135 + BR_LEG),              // 上・左脚
    rectFromCorners(-35 - BR_LT, -65, 35 + BR_LT, -65 + BR_CAP),         // 下キャップ
    rectFromCorners(35, -65 - BR_LEG, 35 + BR_LT, -65),                  // 下・右脚
    rectFromCorners(-35 - BR_LT, -65 - BR_LEG, -35, -65),                // 下・左脚
  );

  // 穴の外側、中央の正方形からさらに玉1個分(直径 BALL.radius*2)離した位置の回転十字ジャマー
  const CROSS_OFFSET = 75 + BALL.radius * 2;
  jammers.push(
    { shape: 'cross', x: CB_X - CROSS_OFFSET, y: CB_Y - 100, size: 34, armThick: 34 / 3.2, angle: 0, motion: { type: 'rotate', speed: 1.3 } },
    { shape: 'cross', x: CB_X + CROSS_OFFSET, y: CB_Y - 100, size: 34, armThick: 34 / 3.2, angle: 0, motion: { type: 'rotate', speed: -1.3 } },
  );

  // 穴の外にある三角ジャマー(中心寄りの位置で回転)
  const tri = (size) => [
    { x: 0, y: -size / 2 }, { x: size / 2, y: size / 2 }, { x: -size / 2, y: size / 2 },
  ];
  jammers.push(
    { shape: 'triangle', x: CB_X - 148, y: CB_Y + 70, verts: tri(42), angle: (200 * Math.PI) / 180, motion: { type: 'rotate', speed: 0.7 } },
    { shape: 'triangle', x: CB_X + 148, y: CB_Y + 70, verts: tri(42), angle: (-20 * Math.PI) / 180, motion: { type: 'rotate', speed: -0.7 } },
  );

  // 左右対称の丸ブロック(消せる、大きめの耐久値)
  targets.push(
    { shape: 'circle', x: CB_X - 150, y: CB_Y - 55, r: 22, hp: 13, maxHp: 13 },
    { shape: 'circle', x: CB_X + 150, y: CB_Y - 55, r: 22, hp: 13, maxHp: 13 },
  );

  // 横に往復する棒ジャマー
  jammers.push(
    { shape: 'rect', angle: 0, x: CB_X - 70, y: CB_Y + 130, baseX: CB_X - 70, baseY: CB_Y + 130, halfW: 35, halfH: 6, motion: { type: 'slide', axis: 'x', amplitude: 40, speed: 0.9, phase: 0 } },
    { shape: 'rect', angle: 0, x: CB_X + 70, y: CB_Y + 130, baseX: CB_X + 70, baseY: CB_Y + 130, halfW: 35, halfH: 6, motion: { type: 'slide', axis: 'x', amplitude: 40, speed: 0.9, phase: Math.PI } },
  );

  // 下部: 通常ブロックとジャマーが交互混在する横列2段(段ごとにチェッカー柄反転)
  // 各段6列にしてプレイフィールド中央に配置する(中心揃えの計算式のため列数を減らすだけで自動的に中央に揃う)。
  const cols = 6, bw = 34, bh = 14, gap = 6;
  const rowW = cols * bw + (cols - 1) * gap;
  const startX = -rowW / 2 + bw / 2;
  [160, 186].forEach((y, ri) => {
    for (let c = 0; c < cols; c++) {
      const rect = { shape: 'rect', angle: 0, x: CB_X + startX + c * (bw + gap), y: CB_Y + y, halfW: bw / 2, halfH: bh / 2 };
      const isTarget = ri === 0 ? c % 2 === 0 : c % 2 !== 0;
      if (isTarget) targets.push({ ...rect, hp: 1, maxHp: 1 });
      else jammers.push(rect);
    }
  });

  return { targets, jammers, rings: null };
}
