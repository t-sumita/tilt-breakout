// ハイスコアの永続化(localStorage)。qed-arcade 系と同じく、失敗時は静かに諦める。
const STORAGE_KEY = 'tilt_high_score';

export function loadHighScore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    const score = Number(data && data.score);
    return Number.isFinite(score) ? score : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ score, date: new Date().toISOString() }));
  } catch {
    /* quota exceeded 等は無視(qed-arcade と同様) */
  }
}
