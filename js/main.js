import { APP_VERSION, STAGE_COUNT } from './config.js';
import { PaddleInput } from './input.js';
import { Game } from './game.js';
import { render } from './renderer.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

const game = new Game(null);
const paddleInput = new PaddleInput(canvas, { onTap: () => game.handleTap() });
game.paddleInput = paddleInput;

const hudLives = document.getElementById('hud-lives');
const hudScore = document.getElementById('hud-score');
const hudStage = document.getElementById('hud-stage');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');

const MESSAGES = {
  title: 'TAP / SPACE で開始',
  serve: 'TAP / SPACE で発射',
  stageClear: 'STAGE CLEAR — TAP で次へ',
  gameOver: 'GAME OVER — TAP でリトライ',
  win: 'ALL CLEAR! — TAP でタイトルへ',
};

function updateHud() {
  hudLives.textContent = String(game.lives);
  hudScore.textContent = String(game.score).padStart(4, '0');
  hudStage.textContent = `${game.stageIndex + 1}/${STAGE_COUNT}`;
  const msg = MESSAGES[game.state];
  if (msg) {
    overlay.style.display = 'flex';
    overlayText.textContent = msg;
  } else {
    overlay.style.display = 'none';
  }
}
game.onHudChange = updateHud;
updateHud();

let lastT = 0;
function loop(t) {
  const dt = lastT ? Math.min((t - lastT) / 1000, 1 / 30) : 0;
  lastT = t;
  const elapsed = t / 1000;

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
