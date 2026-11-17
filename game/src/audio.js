// Starfall Salvage — all sound is synthesized with WebAudio, no audio files.
// The context is created lazily on the first user gesture (browsers block
// audio before one), and every effect is a short envelope over an oscillator
// or a filtered noise burst.

export function createAudio() {
  let context = null;
  let master = null;
  const audio = {
    muted: false,
    toggleMute() {
      audio.muted = !audio.muted;
      if (master) master.gain.value = audio.muted ? 0 : 0.5;
      return audio.muted;
    },
    // Call from a click / key handler so the context is allowed to start.
    unlock() {
      if (!context) {
        try {
          const Ctor = window.AudioContext || window.webkitAudioContext;
          if (!Ctor) return;
          context = new Ctor();
          master = context.createGain();
          master.gain.value = audio.muted ? 0 : 0.5;
          master.connect(context.destination);
        } catch {
          context = null;
        }
      }
      if (context && context.state === 'suspended') {
        context.resume().catch(() => {});
      }
    },
    tone(freq, dur, type = 'sine', vol = 0.2, when = 0, slideTo = null) {
      if (!context || audio.muted) return;
      const t0 = context.currentTime + when;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    },
    noise(dur, vol = 0.25, when = 0, lowpass = 1200) {
      if (!context || audio.muted) return;
      const t0 = context.currentTime + when;
      const length = Math.max(1, Math.floor(context.sampleRate * dur));
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = context.createBufferSource();
      source.buffer = buffer;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      const gain = context.createGain();
      gain.gain.value = vol;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start(t0);
    },
    // A catch chimes higher as the combo climbs.
    catch(combo) {
      const base = 520 + Math.min(combo, 5) * 60;
      audio.tone(base, 0.12, 'sine', 0.22);
      audio.tone(base * 1.5, 0.16, 'sine', 0.16, 0.05);
    },
    hit() {
      audio.tone(140, 0.25, 'sawtooth', 0.25, 0, 60);
      audio.noise(0.22, 0.3, 0, 900);
    },
    shieldBreak() {
      audio.tone(880, 0.1, 'triangle', 0.2);
      audio.tone(660, 0.14, 'triangle', 0.18, 0.07);
      audio.noise(0.12, 0.12, 0, 2400);
    },
    powerup() {
      [523, 659, 784].forEach((freq, i) => audio.tone(freq, 0.14, 'triangle', 0.2, i * 0.07));
    },
    waveClear() {
      [392, 523, 659, 784].forEach((freq, i) => audio.tone(freq, 0.18, 'triangle', 0.2, i * 0.09));
    },
    gameOver() {
      [392, 330, 262, 196].forEach((freq, i) => audio.tone(freq, 0.28, 'sawtooth', 0.16, i * 0.16));
    },
    victory() {
      [523, 659, 784, 1047, 1319].forEach((freq, i) => audio.tone(freq, 0.22, 'triangle', 0.2, i * 0.1));
    },
    click() {
      audio.tone(700, 0.06, 'square', 0.1);
    },
  };
  return audio;
}
