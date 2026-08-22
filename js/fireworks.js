// オールクリア演出用の花火パーティクル。状態を持つが描画自体は renderer.js が担う。
const COLORS = ['#7fe3d4', '#ffd166', '#ef476f', '#06d6a0', '#a78bfa'];
const GRAVITY = 120;
const PARTICLES_PER_BURST = 26;

export class Fireworks {
  constructor() {
    this.particles = [];
  }

  spawnBurst(x, y) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    for (let i = 0; i < PARTICLES_PER_BURST; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLES_PER_BURST + Math.random() * 0.2;
      const speed = 60 + Math.random() * 80;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.1 + Math.random() * 0.4,
        maxLife: 1.5,
        color,
      });
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  clear() {
    this.particles = [];
  }
}
