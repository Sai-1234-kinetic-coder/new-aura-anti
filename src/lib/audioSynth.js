/**
 * AuraFit Web Audio API Synthesizer
 * Zero-asset, zero-latency audio engine for chimes, beeps, countdowns, and alerts.
 */

class AudioSynthEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Play crystal hydration chime (peaceful high harmonic ring)
   */
  playHydrationChime() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.4); // D6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  /**
   * Play short timer tick / countdown beep
   * @param {boolean} isHigh - high pitch for start/finish, low for 3-2-1 countdown
   */
  playBeep(isHigh = false) {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isHigh ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(isHigh ? 880 : 440, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Play celebration fanfare chord (for workout completed / rep milestones)
   */
  playFanfare() {
    this.init();
    if (!this.ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.50]; // C Major
    const now = this.ctx.currentTime;

    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.6);
    });
  }

  /**
   * Play soothing singing bowl tone (for meditation & Pranayama breath cues)
   */
  playSingingBowl(freq = 432, duration = 3) {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Voice synthesis helper for workout & posture coaching
   */
  speakVoice(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Start 6Hz Theta binaural beat (432Hz fundamental + 438Hz carrier)
   */
  startBinauralTheta() {
    this.init();
    this.stopAmbient();
    if (!this.ctx) return;

    const merger = this.ctx.createChannelMerger(2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 2);

    const oscLeft = this.ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(432, this.ctx.currentTime);

    const oscRight = this.ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(438, this.ctx.currentTime); // 6Hz beat difference (Theta)

    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);
    merger.connect(gain);
    gain.connect(this.ctx.destination);

    oscLeft.start();
    oscRight.start();

    this.activeAmbient = {
      stop: () => {
        try {
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1);
          setTimeout(() => {
            oscLeft.stop();
            oscRight.stop();
          }, 1000);
        } catch (e) {}
      }
    };
  }

  /**
   * Start synthesized gentle Zen Rain (filtered noise)
   */
  startZenRain() {
    this.init();
    this.stopAmbient();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 2);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start();

    this.activeAmbient = {
      stop: () => {
        try {
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1);
          setTimeout(() => whiteNoise.stop(), 1000);
        } catch (e) {}
      }
    };
  }

  /**
   * Stop any running ambient audio soundscape
   */
  stopAmbient() {
    if (this.activeAmbient) {
      this.activeAmbient.stop();
      this.activeAmbient = null;
    }
  }
}

export const audioSynth = new AudioSynthEngine();

// Auto-unlock AudioContext on mobile (Android/iOS) touch or click
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    audioSynth.init();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { passive: true, once: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
}

