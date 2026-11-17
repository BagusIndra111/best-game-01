// Starfall Salvage — the falling world: spawning, waves, movement and
// collisions. The world owns the skiff's position and every falling entity;
// it reports what happened each frame as events so main.js can score them,
// play sounds and spawn particles.

import { VIEW, SKIFF, POWERUPS, waveTable } from './config.js';

// A tiny seeded RNG so the ?shot=play screenshot state is reproducible.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickSpawn(rng, table) {
  const roll = rng();
  if (roll < POWERUPS.shield.chance) return 'shield';
  if (roll < POWERUPS.shield.chance + POWERUPS.magnet.chance) return 'magnet';
  if (roll < POWERUPS.shield.chance + POWERUPS.magnet.chance + POWERUPS.slowmo.chance) return 'slowmo';
  if (roll < POWERUPS.slowmo.chance + POWERUPS.shield.chance + POWERUPS.magnet.chance + table.debrisChance) return 'debris';
  return 'shard';
}

export function createWorld(seed = 20261117) {
  const rng = makeRng(seed);
  return {
    rng,
    skiffX: VIEW.width / 2, // centre of the skiff
    skiffVx: 0,
    entities: [], // { kind, x, y, vy, size, rot, rotV, sway, swayPhase, power }
    spawnTimer: 0.6,
    stars: [], // background starfield { x, y, layer, size, twinkle }
    shooting: null, // a rare shooting star { x, y, vx, vy, life }
    shootTimer: 6,
  };
}

export function initStars(world) {
  world.stars = [];
  for (let layer = 0; layer < 3; layer++) {
    const count = 46 - layer * 10;
    for (let i = 0; i < count; i++) {
      world.stars.push({
        x: world.rng() * VIEW.width,
        y: world.rng() * VIEW.height,
        layer,
        size: 0.8 + layer * 0.7 + world.rng() * 0.8,
        twinkle: world.rng() * Math.PI * 2,
      });
    }
  }
}

function spawnEntity(world, table) {
  const kind = pickSpawn(world.rng, table);
  const margin = 30;
  const x = margin + world.rng() * (VIEW.width - margin * 2);
  const base = table.fallSpeed * (0.85 + world.rng() * 0.35);
  const entity = {
    kind,
    x,
    y: -30,
    vy: base,
    size: kind === 'debris' ? 15 + world.rng() * 13 : 13 + world.rng() * 6,
    rot: world.rng() * Math.PI * 2,
    rotV: (world.rng() - 0.5) * 2.4,
    sway: kind === 'shard' ? 18 + world.rng() * 26 : 0,
    swayPhase: world.rng() * Math.PI * 2,
    power: kind === 'shield' || kind === 'magnet' || kind === 'slowmo' ? kind : null,
  };
  if (entity.power) entity.vy = base * 0.55; // power-ups drift down gently
  world.entities.push(entity);
}

// Move the skiff. Keyboard steers with acceleration and damping; the mouse
// sets a target the skiff eases toward. Returns nothing; the position and
// velocity live on the world.
export function moveSkiff(world, input, dt) {
  const accel = SKIFF.accel;
  if (input.left) world.skiffVx -= accel * dt;
  if (input.right) world.skiffVx += accel * dt;
  if (!input.left && !input.right) {
    world.skiffVx *= Math.exp(-SKIFF.friction * dt);
    if (Math.abs(world.skiffVx) < 4) world.skiffVx = 0;
  }
  if (input.mouseX !== null && !input.left && !input.right) {
    const target = input.mouseX;
    const diff = target - world.skiffX;
    world.skiffVx += diff * 14 * dt;
    world.skiffVx *= Math.exp(-6 * dt);
  }
  world.skiffVx = Math.max(-SKIFF.maxSpeed, Math.min(SKIFF.maxSpeed, world.skiffVx));
  world.skiffX += world.skiffVx * dt;
  const half = SKIFF.width / 2;
  if (world.skiffX < half) {
    world.skiffX = half;
    world.skiffVx = 0;
  }
  if (world.skiffX > VIEW.width - half) {
    world.skiffX = VIEW.width - half;
    world.skiffVx = 0;
  }
}

// Advance the world one frame. Returns the events that happened, in order:
// { type: 'catch', entity, gained }, { type: 'hit', entity, result },
// { type: 'power', entity, power }, { type: 'miss', entity }.
// allowSpawn is false on the title screen: only the seeded demo field
// drifts there, so no fresh entity can wander over the title text.
export function updateWorld(world, state, dt, allowSpawn = true) {
  const events = [];
  const table = waveTable(state.wave);
  const slowFactor = state.slowmoSeconds > 0 ? 0.45 : 1;

  if (allowSpawn) {
    world.spawnTimer -= dt;
    if (world.spawnTimer <= 0) {
      spawnEntity(world, table);
      world.spawnTimer = table.spawnInterval * (0.75 + world.rng() * 0.5);
    }
  }

  const skiffTop = SKIFF.y - SKIFF.height / 2;
  const skiffLeft = world.skiffX - SKIFF.width / 2 - SKIFF.catchPad;
  const skiffRight = world.skiffX + SKIFF.width / 2 + SKIFF.catchPad;

  for (let i = world.entities.length - 1; i >= 0; i--) {
    const e = world.entities[i];
    e.y += e.vy * slowFactor * dt;
    e.rot += e.rotV * dt;
    e.swayPhase += dt * 2.2;

    // The magnet bends nearby shards toward the skiff.
    if (state.magnetSeconds > 0 && e.kind === 'shard') {
      const dx = world.skiffX - e.x;
      const dy = SKIFF.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 320 && dist > 1) {
        e.x += (dx / dist) * 260 * dt;
      }
    }

    const drawX = e.x + Math.sin(e.swayPhase) * e.sway * 0.4;
    const inSkiffBand = e.y + e.size > skiffTop && e.y - e.size < SKIFF.y + SKIFF.height / 2;
    const overSkiff = drawX > skiffLeft && drawX < skiffRight;

    if (inSkiffBand && overSkiff) {
      if (e.kind === 'shard') {
        world.entities.splice(i, 1);
        events.push({ type: 'catch', entity: e });
      } else if (e.kind === 'debris') {
        world.entities.splice(i, 1);
        events.push({ type: 'hit', entity: e });
      } else {
        world.entities.splice(i, 1);
        events.push({ type: 'power', entity: e, power: e.power });
      }
      continue;
    }
    if (e.y - e.size > VIEW.groundY) {
      world.entities.splice(i, 1);
      if (e.kind === 'shard') events.push({ type: 'miss', entity: e });
    }
  }

  // Background life: stars drift down slowly, a shooting star now and then.
  for (const star of world.stars) {
    star.y += (4 + star.layer * 7) * dt;
    if (star.y > VIEW.height + 2) {
      star.y = -2;
      star.x = world.rng() * VIEW.width;
    }
  }
  world.shootTimer -= dt;
  if (world.shootTimer <= 0 && !world.shooting) {
    world.shooting = {
      x: 200 + world.rng() * (VIEW.width - 400),
      y: 40 + world.rng() * 120,
      vx: -(260 + world.rng() * 160),
      vy: 120 + world.rng() * 80,
      life: 1,
    };
    world.shootTimer = 7 + world.rng() * 9;
  }
  if (world.shooting) {
    world.shooting.x += world.shooting.vx * dt;
    world.shooting.y += world.shooting.vy * dt;
    world.shooting.life -= dt * 0.8;
    if (world.shooting.life <= 0 || world.shooting.x < -60) world.shooting = null;
  }

  return events;
}

export function clearEntities(world) {
  world.entities.length = 0;
}
