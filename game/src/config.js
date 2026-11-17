// Starfall Salvage — tuning constants and palette. Every number that shapes
// how the game feels lives here, so a playtest can retune the game by editing
// this one file.

export const VIEW = {
  width: 1280,
  height: 720,
  groundY: 692, // shards that cross this line are lost
};

export const SKIFF = {
  width: 118,
  height: 30,
  y: 648,
  accel: 4200, // px/s^2 while a direction key is held
  maxSpeed: 640, // px/s
  friction: 6.5, // exponential damping when no key is held
  catchPad: 10, // extra catch width beyond the hull, feels generous
};

export const PALETTE = {
  skyTop: '#0b1030',
  skyMid: '#131a3d',
  skyBottom: '#070a1c',
  star: '#dfe8ff',
  shard: '#ffd75e',
  shardCore: '#fff3c4',
  debris: '#e0574f',
  debrisDark: '#7e2a26',
  shield: '#59e3ff',
  magnet: '#ff7ad9',
  slowmo: '#8f9bff',
  hullFull: '#ff5d73',
  hullEmpty: '#3a415c',
  text: '#eef2ff',
  textDim: '#9aa5c8',
  gold: '#ffd75e',
  panel: 'rgba(8, 12, 32, 0.72)',
};

export const SCORING = {
  shardBase: 10, // points per shard before the combo multiplier
  comboMax: 5, // multiplier caps at x5
  waveClearBonus: 50, // points per wave cleared, times the wave number
  victoryWave: 10, // clearing this wave wins the run
};

export const HULL = {
  max: 3,
};

export const POWERUPS = {
  shield: { key: 'shield', label: 'SHIELD', color: PALETTE.shield, chance: 0.028 },
  magnet: { key: 'magnet', label: 'MAGNET', color: PALETTE.magnet, chance: 0.026, seconds: 7 },
  slowmo: { key: 'slowmo', label: 'SLOW-TIME', color: PALETTE.slowmo, chance: 0.026, seconds: 6 },
};

// One row per wave. speed and interval shape the fall; debrisChance is the
// share of spawns that are debris instead of shards; quota is how many shards
// must be caught to clear the wave.
export function waveTable(wave) {
  const w = Math.max(1, wave);
  return {
    fallSpeed: 150 + w * 20, // base px/s, each entity varies around it
    spawnInterval: Math.max(0.5, 1.02 - w * 0.06), // seconds between spawns
    debrisChance: Math.min(0.46, 0.16 + w * 0.03),
    quota: 6 + w * 2,
  };
}
