// Starfall Salvage — the run's state: which screen is showing, the score,
// hull, combo, wave progress and the active power-ups. Pure data plus the
// small transitions that change it; drawing lives in render.js.

import { HULL, SCORING } from './config.js';

export const SCREENS = {
  title: 'title',
  playing: 'playing',
  waveClear: 'waveClear',
  paused: 'paused',
  gameOver: 'gameOver',
  victory: 'victory',
};

const BEST_KEY = 'starfall-salvage-best';

export function loadBest() {
  try {
    const value = Number(window.localStorage.getItem(BEST_KEY));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function saveBest(score) {
  try {
    window.localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // storage unavailable (private mode, sandbox): the best score just
    // does not persist, the game plays on.
  }
}

export function createState() {
  return {
    screen: SCREENS.title,
    score: 0,
    best: loadBest(),
    newBest: false,
    hull: HULL.max,
    combo: 0, // consecutive shard catches; 0 means no multiplier yet
    wave: 1,
    waveCaught: 0, // shards caught toward this wave's quota
    waveTimer: 0, // seconds spent in the wave-clear banner
    shield: false, // one free hit, then gone
    magnetSeconds: 0,
    slowmoSeconds: 0,
    shake: 0, // screen-shake trauma, decays to 0
    elapsed: 0, // seconds since the run started (playing only)
  };
}

export function resetRun(state) {
  state.score = 0;
  state.newBest = false;
  state.hull = HULL.max;
  state.combo = 0;
  state.wave = 1;
  state.waveCaught = 0;
  state.waveTimer = 0;
  state.shield = false;
  state.magnetSeconds = 0;
  state.slowmoSeconds = 0;
  state.shake = 0;
  state.elapsed = 0;
  state.screen = SCREENS.playing;
}

// A shard is caught: the combo climbs (capped), the score pays base points
// times the multiplier, and the wave progress moves one step.
export function catchShard(state) {
  state.combo = Math.min(SCORING.comboMax, state.combo + 1);
  const gained = SCORING.shardBase * state.combo;
  state.score += gained;
  state.waveCaught += 1;
  return gained;
}

// A shard hits the ground uncaught: the combo is lost, nothing else.
export function missShard(state) {
  state.combo = 0;
}

// Debris hits the skiff. A shield absorbs it; otherwise a hull is lost and
// the combo breaks. Returns 'shield' | 'hit' | 'dead'.
export function hitDebris(state) {
  state.combo = 0;
  if (state.shield) {
    state.shield = false;
    return 'shield';
  }
  state.hull -= 1;
  state.shake = 1;
  return state.hull <= 0 ? 'dead' : 'hit';
}

export function finishRun(state) {
  if (state.score > state.best) {
    state.best = state.score;
    state.newBest = true;
    saveBest(state.score);
  }
}

export function waveCleared(state) {
  const bonus = SCORING.waveClearBonus * state.wave;
  state.score += bonus;
  state.waveTimer = 0;
  state.screen = SCREENS.waveClear;
  return bonus;
}
