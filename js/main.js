import { APP_VERSION, STAGE_COUNT, GAME } from './config.js';
import { PaddleInput } from './input.js';
import { Game } from './game.js';
import { render } from './renderer.js';
import { initConfigPanel } from './configPanel.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

const game = new Game(null);
const paddleInput = new PaddleInput(canvas, { onTap: () => game.handleTap() });
game.paddleInput = paddleInput;

const hudLives = document.getElementById('hud-lives');
const hudScore = document.getElementById('hud-score');
const hudStage = document.getElementById('hud-stage');
const hudHighscore = document.getElementById('hud-highscore');
const hudTime = document.getElementById('hud-time');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');
const configPanelEl = document.getElementById('config-panel');

const MESSAGES = {
  title: 'TAP / SPACE で開始',
  serve: 'TAP / SPACE で発射',
  stageClear: 'STAGE CLEAR — TAP で次へ',
  gameOver: 'GAME OVER — TAP でリトライ',
  demo: 'DEMO PLAY — 操作で終了',
};

function formatTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function overlayMessage() {
  if (game.easterEgg.active) {
    return 'CONGRATULATIONS!';
  }
  if (game.state === 'win') {
    return game.allClear ? 'CONGRATULATIONS! — TAP でタイトルへ' : 'GAME CLEAR — TAP でタイトルへ';
  }
  return MESSAGES[game.state] || null;
}

function updateHud() {
  hudLives.textContent = String(game.lives);
  hudScore.textContent = String(game.score).padStart(4, '0');
  hudStage.textContent = `${game.stageIndex + 1}/${STAGE_COUNT}`;
  hudHighscore.textContent = String(game.highScore).padStart(4, '0');
  hudTime.textContent = formatTime(game.timeRemaining);
  const msg = overlayMessage();
  if (msg) {
    overlay.style.display = 'flex';
    overlayText.textContent = msg;
  } else {
    overlay.style.display = 'none';
  }
}
game.onHudChange = updateHud;
updateHud();

initConfigPanel({
  onOpen: () => { game.paused = true; },
  onClose: () => { game.paused = false; },
  onStageSelect: (index) => {
    game.jumpToStage(index);
    configPanelEl.hidden = true;
    game.paused = false;
  },
  onMaintenanceUnlock: () => {
    configPanelEl.hidden = true;
    game.paused = false;
    game.playEasterEggDemo();
  },
});

// ── アイドル時のデモプレイ(アトラクトモード)── タイトル画面で無操作の時間を計測し、
// 一定秒数(GAME.idleDemoDelaySec)経過したら game.startDemo() を呼ぶ。
// PaddleInput の onTap は Space/Enter・単一ポインタのみを拾うため、矢印キー等も含めた
// 「何らかの操作」を検知する専用のグローバルリスナーをここで別途持つ。
let idleSeconds = 0;
function markInteraction() {
  idleSeconds = 0;
  if (game.state === 'demo') game.stopDemo();
}
window.addEventListener('pointerdown', markInteraction);
window.addEventListener('keydown', markInteraction);

let lastT = 0;
function loop(t) {
  const dt = lastT ? Math.min((t - lastT) / 1000, 1 / 30) : 0;
  lastT = t;
  const elapsed = t / 1000;

  if (game.state === 'title' && !game.paused) {
    idleSeconds += dt;
    if (idleSeconds >= GAME.idleDemoDelaySec) {
      idleSeconds = 0;
      game.startDemo();
    }
  } else {
    idleSeconds = 0;
  }

  paddleInput.update(dt);
  game.update(dt, elapsed);
  render(ctx, game.getRenderState());
  updateHud();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ── フッター版表示(© の右隣に (vX.Y.Z) を注入。badge.js 本体は改変しない)──
(function initFooterVersion() {
  function injectBadgeVersion() {
    const badge = document.querySelector('.su-badge');
    if (!badge) return false;
    if (badge.querySelector('.footer-ver')) return true;
    const ver = document.createElement('span');
    ver.className = 'footer-ver';
    ver.textContent = `(v${APP_VERSION})`;
    badge.appendChild(ver);
    return true;
  }
  if (!injectBadgeVersion()) {
    let tries = 0;
    const timer = setInterval(() => {
      if (injectBadgeVersion() || ++tries > 40) clearInterval(timer);
    }, 50);
  }
})();
