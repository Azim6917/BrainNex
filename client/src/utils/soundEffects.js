/**
 * soundEffects.js
 * All sounds generated with Web Audio API — no files, no cost.
 * Sounds respect the user's preference toggle in localStorage.
 */

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function isEnabled() {
  try {
    const prefs = JSON.parse(localStorage.getItem('brainnex-prefs') || '{}');
    return prefs.soundEffects !== false; // default ON
  } catch { return true; }
}

function playTone({ freq = 440, type = 'sine', duration = 0.15, gain = 0.18, delay = 0, decay = true } = {}) {
  if (!isEnabled()) return;
  try {
    const ac  = getCtx();
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.connect(g);
    g.connect(ac.destination);
    osc.type      = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
    g.gain.setValueAtTime(gain, ac.currentTime + delay);
    if (decay) g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + duration);
  } catch { /* AudioContext blocked by browser policy — silent fail */ }
}

/** Correct answer — bright ascending chime */
export function playCorrect() {
  playTone({ freq: 523.25, type: 'sine', duration: 0.12, gain: 0.15 });
  playTone({ freq: 659.25, type: 'sine', duration: 0.12, gain: 0.15, delay: 0.08 });
  playTone({ freq: 783.99, type: 'sine', duration: 0.18, gain: 0.18, delay: 0.16 });
}

/** Wrong answer — low dull thud */
export function playWrong() {
  playTone({ freq: 180, type: 'sawtooth', duration: 0.2, gain: 0.12 });
  playTone({ freq: 140, type: 'sawtooth', duration: 0.18, gain: 0.08, delay: 0.12 });
}

/** XP earned — cheerful pop */
export function playXP() {
  playTone({ freq: 880,  type: 'sine', duration: 0.1,  gain: 0.12 });
  playTone({ freq: 1046, type: 'sine', duration: 0.1,  gain: 0.12, delay: 0.07 });
  playTone({ freq: 1318, type: 'sine', duration: 0.15, gain: 0.15, delay: 0.14 });
}

/** Perfect score — victory fanfare */
export function playPerfect() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => playTone({ freq: f, type: 'sine', duration: 0.18, gain: 0.14, delay: i * 0.1 }));
}

/** Card advance — subtle click */
export function playClick() {
  playTone({ freq: 600, type: 'sine', duration: 0.06, gain: 0.08 });
}

/** Session complete — warm chord */
export function playComplete() {
  [523, 659, 784].forEach(f => playTone({ freq: f, type: 'sine', duration: 0.6, gain: 0.1 }));
}
