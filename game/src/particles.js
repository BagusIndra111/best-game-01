// Starfall Salvage — short-lived particles: gold bursts on a catch, red
// debris on a hit, a soft trail behind the skiff's thrusters. Each particle
// is a point with a velocity, a life and a colour; the world spawns them and
// render.js draws them.

export function createParticles() {
  const list = [];
  return {
    list,
    burst(x, y, color, count, speed = 180, size = 3, life = 0.55) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const v = speed * (0.35 + Math.random() * 0.65);
        list.push({
          x,
          y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v - 40,
          life: life * (0.6 + Math.random() * 0.7),
          maxLife: life,
          size: size * (0.6 + Math.random() * 0.8),
          color,
        });
      }
    },
    trail(x, y) {
      list.push({
        x: x + (Math.random() - 0.5) * 14,
        y,
        vx: (Math.random() - 0.5) * 30,
        vy: 90 + Math.random() * 60,
        life: 0.35,
        maxLife: 0.35,
        size: 2.5,
        color: '#7fb4ff',
      });
    },
    update(dt) {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life -= dt;
        if (p.life <= 0) {
          list.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 60 * dt;
      }
    },
    clear() {
      list.length = 0;
    },
  };
}
