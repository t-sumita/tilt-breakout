// Config画面(パネル)の配線。DOM要素を掴み、config.js の各定数を実行時に読み書きする。
// ゲームの状態遷移そのものには関与せず、開閉/ステージジャンプはコールバックで通知する。
import { PADDLE, BALL, GAME, CONFIG_LIMITS } from './config.js';

const RAW_FIELDS = [
  {
    id: 'paddleMoveSpeedMultiplier',
    limits: CONFIG_LIMITS.paddleMoveSpeedMultiplier,
    get: () => PADDLE.moveSpeedMultiplier,
    set: (v) => { PADDLE.moveSpeedMultiplier = v; },
    format: (v) => v.toFixed(1),
  },
  {
    id: 'gravity',
    limits: CONFIG_LIMITS.gravity,
    get: () => BALL.gravity,
    set: (v) => { BALL.gravity = v; },
    format: (v) => String(Math.round(v)),
  },
  {
    id: 'drag',
    limits: CONFIG_LIMITS.drag,
    get: () => BALL.drag,
    set: (v) => { BALL.drag = v; },
    format: (v) => v.toFixed(2),
  },
  {
    id: 'timeLimitSec',
    limits: CONFIG_LIMITS.timeLimitSec,
    get: () => GAME.timeLimitSec,
    set: (v) => { GAME.timeLimitSec = v; },
    format: (v) => String(Math.round(v)),
  },
  {
    id: 'livesStart',
    limits: CONFIG_LIMITS.livesStart,
    get: () => GAME.livesStart,
    set: (v) => { GAME.livesStart = v; },
    format: (v) => String(Math.round(v)),
  },
  {
    id: 'catchSpeedThreshold',
    limits: CONFIG_LIMITS.catchSpeedThreshold,
    get: () => BALL.catchSpeedThreshold,
    set: (v) => { BALL.catchSpeedThreshold = v; },
    format: (v) => String(Math.round(v)),
  },
];

// モジュール読み込み直後(=ユーザー操作が発生する前)の値を config.js の既定値として固定する。
const FIELDS = RAW_FIELDS.map((f) => ({ ...f, defaultValue: f.get() }));

export function initConfigPanel({ onOpen, onClose, onStageSelect } = {}) {
  const btn = document.getElementById('config-btn');
  const panel = document.getElementById('config-panel');
  const closeBtn = document.getElementById('config-close');
  const resetBtn = document.getElementById('config-reset');
  const stageSelect = document.getElementById('cfg-stageSelect');

  function renderLabel(f) {
    f.label.textContent = `${f.format(f.get())} (既定値: ${f.format(f.defaultValue)})`;
  }

  const boundFields = FIELDS.map((f) => {
    const input = document.getElementById(`cfg-${f.id}`);
    const label = document.getElementById(`val-${f.id}`);
    input.min = String(f.limits.min);
    input.max = String(f.limits.max);
    input.step = String(f.limits.step);
    const bound = { ...f, input, label };
    input.addEventListener('input', () => {
      f.set(Number(input.value));
      renderLabel(bound);
    });
    return bound;
  });

  function syncFromConfig() {
    for (const f of boundFields) {
      f.input.value = String(f.get());
      renderLabel(f);
    }
  }

  btn.addEventListener('click', () => {
    syncFromConfig();
    panel.hidden = false;
    if (onOpen) onOpen();
  });
  closeBtn.addEventListener('click', () => {
    panel.hidden = true;
    if (onClose) onClose();
  });
  resetBtn.addEventListener('click', () => {
    for (const f of boundFields) {
      f.set(f.defaultValue);
      f.input.value = String(f.defaultValue);
      renderLabel(f);
    }
  });
  stageSelect.addEventListener('change', () => {
    if (onStageSelect) onStageSelect(Number(stageSelect.value));
  });
}
