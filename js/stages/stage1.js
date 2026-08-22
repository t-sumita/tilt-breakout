// ステージ1: シンプルな王道ブロック崩し配置(全体を上寄せ)
// 座標は docs/reference/stage-mock.html の buildClassic() をそのまま踏襲する。
import { CX } from '../config.js';

export function createStage1() {
  const targets = [];
  const jammers = [];
  const cols = 8, bw = 38, bh = 16, gap = 6;
  const rowW = cols * bw + (cols - 1) * gap;
  const startX = -rowW / 2 + bw / 2;
  const rowStep = bh + gap;
  const anchorY = 90;
  const colX = (c) => CX + startX + c * (bw + gap);

  // 1列目: ハードブロック(3ヒットで破壊、ドット密度を濃く)
  for (let c = 0; c < cols; c++) {
    targets.push({ shape: 'rect', x: colX(c), y: anchorY, angle: 0, halfW: bw / 2, halfH: bh / 2, hp: 3, maxHp: 3, dense: true });
  }

  // 2列目: 空

  // 3列目: 通常ブロックと破壊不能ジャマーを左右対称に均等混在配置
  const y2 = anchorY + 2 * rowStep;
  for (let c = 0; c < cols; c++) {
    const bucket = Math.floor(Math.abs(c - (cols - 1) / 2));
    const isTarget = bucket % 2 === 0;
    const rect = { shape: 'rect', x: colX(c), y: y2, angle: 0, halfW: bw / 2, halfH: bh / 2 };
    if (isTarget) targets.push({ ...rect, hp: 1, maxHp: 1, dense: false });
    else jammers.push(rect);
  }

  // 4列目: 空

  // 5〜7列目: 通常ブロック(1ヒットで破壊)
  [4, 5, 6].forEach((r) => {
    const y = anchorY + r * rowStep;
    for (let c = 0; c < cols; c++) {
      targets.push({ shape: 'rect', x: colX(c), y, angle: 0, halfW: bw / 2, halfH: bh / 2, hp: 1, maxHp: 1, dense: false });
    }
  });

  return { targets, jammers, rings: null };
}
