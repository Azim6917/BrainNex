/** Read soundEffects pref from localStorage (default ON) */
function isSoundEnabled() {
  try { return JSON.parse(localStorage.getItem('brainnex-prefs') || '{}').soundEffects !== false; }
  catch { return true; }
}

/** Read notificationSounds pref from localStorage (default ON) */
function isNotificationSoundEnabled() {
  try { return JSON.parse(localStorage.getItem('brainnex-prefs') || '{}').notificationSounds !== false; }
  catch { return true; }
}

class AudioSystem {
  constructor() {
    this.ctx = null;
  }

  /**
   * Master gate — returns false (and skips init) when soundEffects is OFF.
   * All play methods check this return value before proceeding.
   */
  init() {
    if (!isSoundEnabled()) return false;
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  playTone(freq, type, duration, vol = 0.1, startTime = 0) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
  }

  // ── UI / Navigation sounds (gated by soundEffects only) ──────────────────

  playClick() {
    if (!this.init()) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.02);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.02);
  }

  playCorrect() {
    if (!this.init()) return;
    this.playTone(523.25, 'sine', 0.1, 0.1, 0);
    this.playTone(659.25, 'sine', 0.1, 0.1, 0.1);
    this.playTone(783.99, 'sine', 0.3, 0.1, 0.2);
  }

  playWrong() {
    if (!this.init()) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playCreate() {
    if (!this.init()) return;
    this.playTone(440, 'sine', 0.07, 0.1, 0);
    this.playTone(550, 'sine', 0.1,  0.1, 0.06);
  }

  playDelete() {
    if (!this.init()) return;
    this.playTone(300, 'sawtooth', 0.1, 0.08, 0);
  }

  playRoomJoin() {
    if (!this.init()) return;
    this.playTone(523, 'sine', 0.1,  0.1,  0);
    this.playTone(659, 'sine', 0.1,  0.1,  0.08);
    this.playTone(784, 'sine', 0.15, 0.12, 0.16);
  }

  playMessageSend() {
    if (!this.init()) return;
    this.playTone(700, 'sine', 0.06, 0.07, 0);
  }

  playCardFlip() {
    if (!this.init()) return;
    this.playTone(400, 'sine', 0.08, 0.08, 0);
    this.playTone(600, 'sine', 0.06, 0.06, 0.06);
  }

  playFlashcardFlip() {
    if (!this.init()) return;
    this.playTone(350, 'sine', 0.06, 0.08, 0);
    this.playTone(500, 'sine', 0.04, 0.06, 0.06);
  }

  playTimerWarning() {
    if (!this.init()) return;
    this.playTone(440, 'square', 0.06, 0.06, 0);
  }

  playOnboardingStep() {
    if (!this.init()) return;
    this.playTone(523, 'sine', 0.08, 0.1,  0);
    this.playTone(659, 'sine', 0.1,  0.12, 0.07);
  }

  // ── Notification / achievement sounds (gated by both toggles) ────────────

  playXP() {
    if (!this.init()) return;
    if (!isNotificationSoundEnabled()) return;
    this.playTone(880, 'sine', 0.05, 0.05, 0);
    this.playTone(1108.73, 'sine', 0.05, 0.05, 0.05);
    this.playTone(1318.51, 'sine', 0.2, 0.05, 0.1);
  }

  playPerfect() {
    if (!this.init()) return;
    if (!isNotificationSoundEnabled()) return;
    [523.25, 587.33, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      this.playTone(freq, 'triangle', 0.15, 0.1, i * 0.1);
    });
  }

  playBadge() {
    if (!this.init()) return;
    if (!isNotificationSoundEnabled()) return;
    for (let i = 0; i < 8; i++) {
      this.playTone(400 + i * 150, 'sine', 0.1, 0.05, i * 0.05);
    }
  }

  playLevelUp() {
    if (!this.init()) return;
    if (!isNotificationSoundEnabled()) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  playQuizComplete() {
    if (!this.init()) return;
    if (!isNotificationSoundEnabled()) return;
    this.playTone(659, 'sine', 0.15, 0.14, 0);
    this.playTone(784, 'sine', 0.2,  0.16, 0.12);
  }

  playGoalComplete() {
    if (!this.init()) return;
    if (!isNotificationSoundEnabled()) return;
    this.playTone(659, 'sine', 0.15, 0.14, 0);
    this.playTone(988, 'sine', 0.25, 0.18, 0.15);
  }

  playCheckpointPass() {
    if (!this.init()) return;
    if (!isNotificationSoundEnabled()) return;
    this.playTone(659, 'sine', 0.08, 0.12, 0);
    this.playTone(784, 'sine', 0.1,  0.14, 0.07);
  }

  playStreak() {
    if (!this.init()) return;
    if (!isNotificationSoundEnabled()) return;
    [300, 350, 280, 400, 320].forEach((freq, i) =>
      this.playTone(freq, 'square', 0.05, 0.05, i * 0.04)
    );
  }

  playSessionComplete() {
    if (!this.init()) return;
    if (!isNotificationSoundEnabled()) return;
    [523, 659, 784, 1047].forEach(freq =>
      this.playTone(freq, 'sine', 0.7, 0.09, 0)
    );
  }
}

export const audioSystem = new AudioSystem();
