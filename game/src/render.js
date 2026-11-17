// Starfall Salvage — everything the player sees, drawn on one canvas.
// The palette comes from config.js; every shape is vector art drawn in code,
// so the game ships no image files at all.

import { VIEW, SKIFF, PALETTE } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStar(ctx, x, y, r, points = 4) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.38;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function drawBackground(ctx, world, t) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  grad.addColorStop(0, PALETTE.skyTop);
  grad.addColorStop(0.55, PALETTE.skyMid);
  grad.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // Two slow nebulae, fixed in the sky so the scene reads as deep space.
  const nebula = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  nebula(240, 170, 260, 'rgba(64, 84, 180, 0.20)');
  nebula(1050, 420, 300, 'rgba(140, 60, 140, 0.13)');

  // Parallax starfield with a gentle twinkle.
  for (const star of world.stars) {
    const tw = 0.55 + 0.45 * Math.sin(t * 1.6 + star.twinkle);
    ctx.globalAlpha = tw * (0.45 + star.layer * 0.25);
    ctx.fillStyle = PALETTE.star;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  ctx.globalAlpha = 1;

  if (world.shooting) {
    const s = world.shooting;
    const tail = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.25, s.y - s.vy * 0.25);
    tail.addColorStop(0, `rgba(255,255,255,${0.9 * s.life})`);
    tail.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = tail;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * 0.25, s.y - s.vy * 0.25);
    ctx.stroke();
  }

  // The salvage yard floor: a dark ridge the skiff hovers above.
  ctx.fillStyle = '#0d1330';
  ctx.fillRect(0, VIEW.groundY, VIEW.width, VIEW.height - VIEW.groundY);
  ctx.fillStyle = 'rgba(255, 215, 94, 0.16)';
  ctx.fillRect(0, VIEW.groundY, VIEW.width, 2);
}

export function drawSkiff(ctx, world, state, t) {
  const x = world.skiffX;
  const y = SKIFF.y;
  const tilt = Math.max(-0.14, Math.min(0.14, world.skiffVx * 0.00022));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  // Thruster glow, stronger while moving.
  const thrust = 0.5 + Math.min(0.5, Math.abs(world.skiffVx) / SKIFF.maxSpeed);
  const glow = ctx.createRadialGradient(0, 18, 0, 0, 18, 34 * thrust);
  glow.addColorStop(0, 'rgba(127, 180, 255, 0.55)');
  glow.addColorStop(1, 'rgba(127, 180, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 18, 34 * thrust, 0, Math.PI * 2);
  ctx.fill();

  // Hull: a flat salvage skiff with a gold canopy and a cargo claw.
  ctx.fillStyle = '#2c3a5e';
  ctx.beginPath();
  ctx.moveTo(-SKIFF.width / 2, 6);
  ctx.lineTo(-SKIFF.width / 2 + 14, -12);
  ctx.lineTo(SKIFF.width / 2 - 14, -12);
  ctx.lineTo(SKIFF.width / 2, 6);
  ctx.lineTo(SKIFF.width / 2 - 10, 12);
  ctx.lineTo(-SKIFF.width / 2 + 10, 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5d74a8';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = PALETTE.shard;
  ctx.beginPath();
  ctx.moveTo(-22, -10);
  ctx.lineTo(0, -22);
  ctx.lineTo(22, -10);
  ctx.lineTo(14, -6);
  ctx.lineTo(-14, -6);
  ctx.closePath();
  ctx.fill();

  // Catch net: the open claw above the deck.
  ctx.strokeStyle = '#9fb4e8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-SKIFF.width / 2 + 4, -8);
  ctx.lineTo(-SKIFF.width / 2 - 8, -26);
  ctx.moveTo(SKIFF.width / 2 - 4, -8);
  ctx.lineTo(SKIFF.width / 2 + 8, -26);
  ctx.stroke();

  if (state.shield) {
    ctx.strokeStyle = PALETTE.shield;
    ctx.globalAlpha = 0.65 + 0.25 * Math.sin(t * 5);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -2, SKIFF.width / 2 + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (state.magnetSeconds > 0) {
    ctx.strokeStyle = PALETTE.magnet;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.arc(0, -2, SKIFF.width / 2 + 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawShard(ctx, e) {
  const x = e.x + Math.sin(e.swayPhase) * e.sway * 0.4;
  const y = e.y;
  const pulse = 1 + 0.08 * Math.sin(e.swayPhase * 2);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(e.rot * 0.15);
  ctx.scale(pulse, pulse);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, e.size * 2.1);
  glow.addColorStop(0, 'rgba(255, 215, 94, 0.5)');
  glow.addColorStop(1, 'rgba(255, 215, 94, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, e.size * 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.shard;
  drawStar(ctx, 0, 0, e.size, 4);
  ctx.fill();
  ctx.fillStyle = PALETTE.shardCore;
  drawStar(ctx, 0, 0, e.size * 0.45, 4);
  ctx.fill();
  ctx.restore();
}

function drawDebris(ctx, e) {
  const x = e.x + Math.sin(e.swayPhase) * e.sway * 0.4;
  ctx.save();
  ctx.translate(x, e.y);
  ctx.rotate(e.rot);
  ctx.fillStyle = PALETTE.debrisDark;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const r = e.size * (0.75 + ((i * 37) % 10) / 28);
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.debris;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(224, 87, 79, 0.75)';
  ctx.beginPath();
  ctx.arc(-e.size * 0.25, -e.size * 0.2, e.size * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPowerup(ctx, e, t) {
  const x = e.x;
  const y = e.y;
  const color = e.kind === 'shield' ? PALETTE.shield : e.kind === 'magnet' ? PALETTE.magnet : PALETTE.slowmo;
  const bob = Math.sin(t * 3 + e.swayPhase) * 4;
  ctx.save();
  ctx.translate(x, y + bob);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 34);
  glow.addColorStop(0, color);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(8, 12, 32, 0.85)';
  ctx.beginPath();
  ctx.arc(0, 0, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(e.kind === 'shield' ? 'S' : e.kind === 'magnet' ? 'M' : 'T', 0, 1);
  ctx.restore();
}

export function drawEntities(ctx, world, t) {
  for (const e of world.entities) {
    if (e.kind === 'shard') drawShard(ctx, e);
    else if (e.kind === 'debris') drawDebris(ctx, e);
    else drawPowerup(ctx, e, t);
  }
}

export function drawParticles(ctx, particles) {
  for (const p of particles.list) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function heart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -3, -6, -11, 0, -5);
  ctx.bezierCurveTo(6, -11, 9, -3, 0, 5);
  ctx.closePath();
  ctx.fillStyle = filled ? PALETTE.hullFull : PALETTE.hullEmpty;
  ctx.fill();
  ctx.restore();
}

export function drawHud(ctx, state) {
  ctx.save();
  ctx.textBaseline = 'top';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${state.score}`, 24, 18);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText(`BEST ${state.best}`, 24, 50);

  if (state.combo >= 2) {
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(`COMBO x${state.combo}`, 24, 76);
    ctx.fillStyle = 'rgba(255, 215, 94, 0.35)';
    ctx.fillRect(24, 104, 110, 6);
    ctx.fillStyle = PALETTE.gold;
    ctx.fillRect(24, 104, (110 * state.combo) / 5, 6);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText(`WAVE ${state.wave}`, VIEW.width / 2, 18);
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText('catch the shards · dodge the debris', VIEW.width / 2, 48);

  for (let i = 0; i < 3; i++) {
    heart(ctx, VIEW.width - 40 - i * 36, 34, 18, i < state.hull);
  }

  let badgeX = VIEW.width - 24;
  const badges = [];
  if (state.shield) badges.push({ label: 'SHIELD', color: PALETTE.shield });
  if (state.magnetSeconds > 0) badges.push({ label: `MAGNET ${Math.ceil(state.magnetSeconds)}s`, color: PALETTE.magnet });
  if (state.slowmoSeconds > 0) badges.push({ label: `SLOW ${Math.ceil(state.slowmoSeconds)}s`, color: PALETTE.slowmo });
  ctx.font = 'bold 14px system-ui, sans-serif';
  for (const badge of badges) {
    const w = ctx.measureText(badge.label).width + 18;
    badgeX -= w;
    ctx.fillStyle = 'rgba(8, 12, 32, 0.72)';
    roundRect(ctx, badgeX, 58, w, 26, 13);
    ctx.fill();
    ctx.strokeStyle = badge.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = badge.color;
    ctx.textAlign = 'center';
    ctx.fillText(badge.label, badgeX + w / 2, 64);
    badgeX -= 8;
  }
  ctx.restore();
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(159, 180, 232, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function centered(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, VIEW.width / 2, y);
}

export function drawTitle(ctx, state, t) {
  const bob = Math.sin(t * 1.4) * 6;
  centered(ctx, 'STARFALL', 218 + bob, 'bold 84px system-ui, sans-serif', PALETTE.gold);
  centered(ctx, 'SALVAGE', 296 + bob, 'bold 84px system-ui, sans-serif', PALETTE.text);
  centered(ctx, 'Catch the star-shards. Dodge the debris. Keep your hull in one piece.', 368, '20px system-ui, sans-serif', PALETTE.textDim);
  panel(ctx, VIEW.width / 2 - 330, 408, 660, 132);
  centered(ctx, 'MOVE  ← →  or  A D  ·  or move the mouse', 440, '19px system-ui, sans-serif', PALETTE.text);
  centered(ctx, 'P pause   ·   M mute   ·   ENTER start', 472, '19px system-ui, sans-serif', PALETTE.text);
  centered(ctx, '3 hull · combo multiplies your catch · clear wave 10 to win', 508, '17px system-ui, sans-serif', PALETTE.textDim);
  const pulse = 0.75 + 0.25 * Math.sin(t * 3.2);
  ctx.globalAlpha = pulse;
  centered(ctx, 'PRESS ENTER OR CLICK TO LAUNCH', 592, 'bold 24px system-ui, sans-serif', PALETTE.gold);
  ctx.globalAlpha = 1;
  if (state.best > 0) {
    centered(ctx, `BEST SALVAGE ${state.best}`, 640, '18px system-ui, sans-serif', PALETTE.textDim);
  }
}

export function drawWaveBanner(ctx, state) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, state.waveTimer * 3);
  panel(ctx, VIEW.width / 2 - 300, 250, 600, 120);
  centered(ctx, `WAVE ${state.wave - 1} CLEAR`, 292, 'bold 40px system-ui, sans-serif', PALETTE.gold);
  centered(ctx, `salvage bonus +${50 * (state.wave - 1)}`, 336, '20px system-ui, sans-serif', PALETTE.text);
  ctx.restore();
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(4, 6, 18, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, VIEW.width / 2 - 260, 270, 520, 150);
  centered(ctx, 'PAUSED', 322, 'bold 44px system-ui, sans-serif', PALETTE.text);
  centered(ctx, 'press P or Esc to keep salvaging', 372, '19px system-ui, sans-serif', PALETTE.textDim);
}

export function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(4, 6, 18, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, VIEW.width / 2 - 330, 190, 660, 300);
  centered(ctx, 'HULL BREACH', 250, 'bold 56px system-ui, sans-serif', PALETTE.debris);
  centered(ctx, 'The skiff is scrap. The shards keep falling.', 306, '20px system-ui, sans-serif', PALETTE.textDim);
  centered(ctx, `SCORE  ${state.score}`, 366, 'bold 34px system-ui, sans-serif', PALETTE.text);
  centered(ctx, state.newBest ? 'NEW BEST!' : `BEST  ${state.best}`, 408, '20px system-ui, sans-serif', state.newBest ? PALETTE.gold : PALETTE.textDim);
  centered(ctx, `reached wave ${state.wave}`, 440, '18px system-ui, sans-serif', PALETTE.textDim);
  const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 300);
  ctx.globalAlpha = pulse;
  centered(ctx, 'PRESS R OR CLICK TO SALVAGE AGAIN', 470, 'bold 22px system-ui, sans-serif', PALETTE.gold);
  ctx.globalAlpha = 1;
}

export function drawVictory(ctx, state) {
  ctx.fillStyle = 'rgba(4, 6, 18, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, VIEW.width / 2 - 340, 180, 680, 320);
  centered(ctx, 'SALVAGE COMPLETE!', 244, 'bold 52px system-ui, sans-serif', PALETTE.gold);
  centered(ctx, 'Ten waves cleared. The belt is yours, captain.', 300, '20px system-ui, sans-serif', PALETTE.textDim);
  centered(ctx, `SCORE  ${state.score}`, 360, 'bold 34px system-ui, sans-serif', PALETTE.text);
  centered(ctx, `BEST  ${state.best}`, 402, '20px system-ui, sans-serif', PALETTE.textDim);
  centered(ctx, 'ENTER — keep salvaging, endless', 452, '20px system-ui, sans-serif', PALETTE.text);
  centered(ctx, 'R — start a fresh run', 482, '20px system-ui, sans-serif', PALETTE.textDim);
}
