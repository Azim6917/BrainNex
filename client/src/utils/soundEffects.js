/**
 * soundEffects.js — BrainNex
 * All sounds via Web Audio API. Zero cost, no files, no npm.
 * Every sound is unique and contextually appropriate.
 */

let _ctx = null;
function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume if suspended (browser policy)
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function isEnabled() {
  try { return JSON.parse(localStorage.getItem('brainnex-prefs') || '{}').soundEffects !== false; }
  catch { return true; }
}

function tone({ freq=440, type='sine', dur=0.15, gain=0.15, delay=0, endFreq=null, endGain=0.001 } = {}) {
  if (!isEnabled()) return;
  try {
    const ac  = ctx();
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    const now = ac.currentTime + delay;
    osc.connect(g); g.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(endGain, now + dur);
    osc.start(now); osc.stop(now + dur + 0.05);
  } catch { /* blocked by browser policy */ }
}

// ── Navigation / UI click ─────────────────────────────────────────────────
export function playClick() {
  tone({ freq:600, type:'sine', dur:0.05, gain:0.07 });
}

// ── Correct answer — bright ascending arpeggio ────────────────────────────
export function playCorrect() {
  tone({ freq:523, dur:0.1,  gain:0.14, delay:0    });
  tone({ freq:659, dur:0.1,  gain:0.14, delay:0.07 });
  tone({ freq:784, dur:0.15, gain:0.16, delay:0.14 });
}

// ── Wrong answer — descending low thud ───────────────────────────────────
export function playWrong() {
  tone({ freq:280, type:'sawtooth', dur:0.12, gain:0.1,  endFreq:180 });
  tone({ freq:200, type:'sawtooth', dur:0.1,  gain:0.07, delay:0.1   });
}

// ── XP earned — cheerful bubbly pop ──────────────────────────────────────
export function playXP() {
  tone({ freq:880,  dur:0.08, gain:0.12, delay:0    });
  tone({ freq:1047, dur:0.08, gain:0.12, delay:0.06 });
  tone({ freq:1319, dur:0.12, gain:0.15, delay:0.12 });
}

// ── Perfect score 100% — victory fanfare ─────────────────────────────────
export function playPerfect() {
  [523, 659, 784, 1047, 1319].forEach((f, i) =>
    tone({ freq:f, dur:0.2, gain:0.15, delay:i*0.09 })
  );
}

// ── Quiz complete (not perfect) — satisfying ding ────────────────────────
// export function playQuizComplete() {
//   tone({ freq:659, dur:0.15, gain:0.14, delay:0    });
//   tone({ freq:784, dur:0.2,  gain:0.16, delay:0.12 });
// }
export function playQuizComplete() {
  tone({ freq:659, dur:0.15, gain:0.14, delay:0    });
  tone({ freq:784, dur:0.2,  gain:0.16, delay:0.12 });
}

export function playComplete() {
  playQuizComplete();
}

// ── Badge earned — sparkle fanfare ───────────────────────────────────────
export function playBadge() {
  const notes = [784, 988, 1175, 1319, 1568];
  notes.forEach((f, i) => tone({ freq:f, type:'sine', dur:0.15, gain:0.14, delay:i*0.06 }));
  // Extra shimmer
  tone({ freq:2093, dur:0.3, gain:0.06, delay:0.35, endFreq:1047 });
}

// ── Level up — dramatic ascending sweep ──────────────────────────────────
export function playLevelUp() {
  [392, 494, 587, 740, 988].forEach((f,i) =>
    tone({ freq:f, type:'sine', dur:0.18, gain:0.16, delay:i*0.1 })
  );
}

// ── Session complete — warm chord resolution ─────────────────────────────
export function playSessionComplete() {
  [523, 659, 784, 1047].forEach(f =>
    tone({ freq:f, type:'sine', dur:0.7, gain:0.09 })
  );
}

// ── Card advance — soft swoosh ────────────────────────────────────────────
export function playCardFlip() {
  tone({ freq:400, type:'sine', dur:0.08, gain:0.08, endFreq:600 });
}

// ── Checkpoint passed — affirmative beep ─────────────────────────────────
export function playCheckpointPass() {
  tone({ freq:659, dur:0.08, gain:0.12, delay:0    });
  tone({ freq:784, dur:0.1,  gain:0.14, delay:0.07 });
}

// ── Streak milestone — fire crackle ──────────────────────────────────────
export function playStreak() {
  [300, 350, 280, 400, 320].forEach((f, i) =>
    tone({ freq:f, type:'square', dur:0.05, gain:0.05, delay:i*0.04 })
  );
}

// ── Goal completed — triumphant double ───────────────────────────────────
export function playGoalComplete() {
  tone({ freq:659, dur:0.15, gain:0.14, delay:0    });
  tone({ freq:988, dur:0.25, gain:0.18, delay:0.15 });
}

// ── Create / save — soft confirm ─────────────────────────────────────────
export function playCreate() {
  tone({ freq:440, dur:0.07, gain:0.1, delay:0    });
  tone({ freq:550, dur:0.1,  gain:0.1, delay:0.06 });
}

// ── Delete / error ────────────────────────────────────────────────────────
export function playDelete() {
  tone({ freq:300, type:'sawtooth', dur:0.1, gain:0.08, endFreq:200 });
}

// ── Room join — soft chime ────────────────────────────────────────────────
export function playRoomJoin() {
  tone({ freq:523, dur:0.1, gain:0.1, delay:0    });
  tone({ freq:659, dur:0.1, gain:0.1, delay:0.08 });
  tone({ freq:784, dur:0.15,gain:0.12,delay:0.16 });
}

// ── Message send ─────────────────────────────────────────────────────────
export function playMessageSend() {
  tone({ freq:700, type:'sine', dur:0.06, gain:0.07, endFreq:500 });
}

// ── Flashcard flip ────────────────────────────────────────────────────────
export function playFlashcardFlip() {
  tone({ freq:350, dur:0.06, gain:0.08, endFreq:500 });
  tone({ freq:500, dur:0.04, gain:0.06, delay:0.06 });
}

// ── Timer warning (last 10s) ──────────────────────────────────────────────
export function playTimerWarning() {
  tone({ freq:440, type:'square', dur:0.06, gain:0.06 });
}

// ── Onboarding next step ──────────────────────────────────────────────────
export function playOnboardingStep() {
  tone({ freq:523, dur:0.08, gain:0.1, delay:0    });
  tone({ freq:659, dur:0.1,  gain:0.12,delay:0.07 });
}
