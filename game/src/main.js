// Starfall Salvage — the game loop and wiring. Owns the canvas, the frame
// clock, the screen transitions and the screenshot demo states (?shot=).
// The rules live in state.js, the falling world in world.js, the drawing in
// render.js and the sound in audio.js.

import { VIEW, SKIFF, SCORING, waveTable } from './config.js';
import { createInput } from './input.js';
import { createState, SCREENS, resetRun, catchShard, missShard, hitDebris, finishRun, waveCleared } from './state.js';
import { createWorld, initStars, moveSkiff, updateWorld, clearEntities, makeRng } from './world.js';
import { createParticles } from './particles.js';
import { createAudio } from './audio.js';
import {
  drawBackground, drawEntities, drawParticles, drawHud, drawSkiff,
  drawTitle, drawWaveBanner, drawPaused, drawGameOver, drawVictory,
} from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const state = createState();
const world = createWorld();
const particles = createParticles();
const audio = createAudio();
initStars(world);

let t = 0; // seconds of animation time, for twinkles and bobs
let last = performance.now();

// Fit the 16:9 canvas into the window without stretching it.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const input = createInput(canvas, (clientX) => {
  const rect = canvas.getBoundingClientRect();
  return ((clientX - rect.left) / rect.width) * VIEW.width;
});

// --- demo states for the screenshots: ?shot=start | play | end -------------
function applyShot(shot) {
  if (shot === 'start') {
    state.screen = SCREENS.title;
    seedDemoField(11, true);
    return;
  }
  if (shot === 'end') {
    state.screen = SCREENS.gameOver;
    state.score = 2450;
    state.best = 2450;
    state.wave = 4;
    state.hull = 0;
    return;
  }
  if (shot === 'play') {
    state.screen = SCREENS.playing;
    state.score = 1250;
    state.best = 2450;
    state.wave = 3;
    state.waveCaught = 9;
    state.combo = 3;
    state.hull = 3;
    state.magnetSeconds = 4;
    world.skiffX = VIEW.width * 0.42;
    seedDemoField(7);
  }
}

// A fixed little sky of shards, debris and one power-up, so the play and
// title screenshots show the game mid-flight instead of an empty sky.
// On the title screen the entities stay in the side bands, clear of the
// centred title text.
function seedDemoField(seed, sideBands = false) {
  const rng = makeRng(seed);
  clearEntities(world);
  const kinds = ['shard', 'shard', 'debris', 'shard', 'magnet', 'shard', 'debris', 'shard'];
  kinds.forEach((kind, i) => {
    let x = 90 + rng() * (VIEW.width - 180);
    if (sideBands) {
      const left = rng() < 0.5;
      x = left ? 70 + rng() * 280 : VIEW.width - 350 + rng() * 280;
    }
    world.entities.push({
      kind,
      x,
      y: 90 + i * 62 + rng() * 30,
      vy: 150 + rng() * 60,
      size: kind === 'debris' ? 22 : 15,
      rot: rng() * Math.PI * 2,
      rotV: (rng() - 0.5) * 2,
      sway: kind === 'shard' ? 24 : 0,
      swayPhase: rng() * Math.PI * 2,
      power: kind === 'magnet' ? 'magnet' : null,
    });
  });
}

const params = new URLSearchParams(window.location.search);
applyShot(params.get('shot'));

// --- actions ---------------------------------------------------------------
function startRun() {
  audio.unlock();
  audio.click();
  resetRun(state);
  clearEntities(world);
  particles.clear();
  world.skiffX = VIEW.width / 2;
  world.skiffVx = 0;
  world.spawnTimer = 0.7;
}

function handleWorldEvent(event) {
  if (event.type === 'catch') {
    const gained = catchShard(state);
    audio.catch(state.combo);
    const x = event.entity.x;
    const y = event.entity.y;
    particles.burst(x, y, '#ffd75e', 14, 200);
    if (state.waveCaught >= waveTable(state.wave).quota) {
      const bonus = waveCleared(state);
      void bonus;
      audio.waveClear();
      particles.burst(VIEW.width / 2, 300, '#ffd75e', 40, 320, 4, 0.9);
      if (state.wave >= SCORING.victoryWave) {
        finishRun(state);
        state.screen = SCREENS.victory;
        audio.victory();
      }
    }
  } else if (event.type === 'hit') {
    const result = hitDebris(state);
    const x = event.entity.x;
    const y = event.entity.y;
    if (result === 'shield') {
      audio.shieldBreak();
      particles.burst(x, y, '#59e3ff', 18, 220);
    } else {
      audio.hit();
      particles.burst(world.skiffX, SKIFF.y, '#e0574f', 26, 300, 4, 0.7);
      if (result === 'dead') {
        finishRun(state);
        state.screen = SCREENS.gameOver;
        audio.gameOver();
      }
    }
  } else if (event.type === 'power') {
    audio.powerup();
    const power = event.power;
    if (power === 'shield') state.shield = true;
    if (power === 'magnet') state.magnetSeconds = 7;
    if (power === 'slowmo') state.slowmoSeconds = 6;
    particles.burst(event.entity.x, event.entity.y, '#ffffff', 12, 160);
  } else if (event.type === 'miss') {
    missShard(state);
  }
}

// --- the loop --------------------------------------------------------------
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  t += dt;
  const shot = params.get('shot');

  // Menu keys, handled on every screen.
  if (input.justPressed('KeyM')) audio.toggleMute();

  if (state.screen === SCREENS.title) {
    updateWorld(world, state, dt, false); // demo field drifts, nothing new spawns over the title
    if (input.justPressed('Enter') || input.justPressed('Space') || input.clicked) startRun();
  } else if (state.screen === SCREENS.playing) {
    state.elapsed += dt;
    if (state.magnetSeconds > 0) state.magnetSeconds -= dt;
    if (state.slowmoSeconds > 0) state.slowmoSeconds -= dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 1.8);
    moveSkiff(world, input, dt);
    if (Math.abs(world.skiffVx) > 60 && Math.random() < 0.5) {
      particles.trail(world.skiffX, SKIFF.y + 16);
    }
    const events = updateWorld(world, state, dt);
    for (const event of events) handleWorldEvent(event);
    if (input.justPressed('KeyP') || input.justPressed('Escape')) state.screen = SCREENS.paused;
  } else if (state.screen === SCREENS.waveClear) {
    state.waveTimer += dt;
    updateWorld(world, state, dt);
    if (state.waveTimer > 2.2) {
      state.wave += 1;
      state.waveCaught = 0;
      state.screen = SCREENS.playing;
    }
  } else if (state.screen === SCREENS.paused) {
    if (input.justPressed('KeyP') || input.justPressed('Escape') || input.clicked) state.screen = SCREENS.playing;
  } else if (state.screen === SCREENS.gameOver) {
    if (input.justPressed('KeyR') || input.justPressed('Enter') || input.clicked) startRun();
  } else if (state.screen === SCREENS.victory) {
    if (input.justPressed('Enter')) {
      audio.click();
      state.screen = SCREENS.playing; // endless: the belt keeps falling
    } else if (input.justPressed('KeyR') || input.clicked) {
      startRun();
    }
  }

  // --- draw ---------------------------------------------------------------
  ctx.save();
  if (state.shake > 0) {
    const mag = state.shake * 9;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }
  drawBackground(ctx, world, t);
  particles.update(dt);
  drawEntities(ctx, world, t);
  if (state.screen === SCREENS.playing || state.screen === SCREENS.waveClear || state.screen === SCREENS.paused) {
    drawSkiff(ctx, world, state, t);
  }
  drawParticles(ctx, particles);
  if (state.screen === SCREENS.playing || state.screen === SCREENS.waveClear || state.screen === SCREENS.paused) {
    drawHud(ctx, state);
  }
  if (state.screen === SCREENS.title) drawTitle(ctx, state, t);
  if (state.screen === SCREENS.waveClear) drawWaveBanner(ctx, state);
  if (state.screen === SCREENS.paused) drawPaused(ctx);
  if (state.screen === SCREENS.gameOver) drawGameOver(ctx, state);
  if (state.screen === SCREENS.victory) drawVictory(ctx, state);
  ctx.restore();

  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
