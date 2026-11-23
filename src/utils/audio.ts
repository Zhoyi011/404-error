class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.5;

  private ensureContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  setConfig(enabled: boolean, volumePercent: number) {
    this.enabled = enabled;
    this.volume = Math.max(0, Math.min(1, volumePercent / 100));
    if (!enabled) {
      this.stopRadioChannel();
    }
  }

  playClick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.05);
    gain.gain.setValueAtTime(this.volume * 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playNotification() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [587.33, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(this.volume * 0.16, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.18);
    });
  }

  playSuccess() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(this.volume * 0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.22);
    });
  }

  playError() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(175, now);
    osc.frequency.linearRampToValueAtTime(92, now + 0.32);
    gain.gain.setValueAtTime(this.volume * 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  playRitualChime(stepIndex: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [392.0, 493.88, 587.33];
    const freq = freqs[stepIndex % freqs.length];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.01, now + 0.45);
    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  playJumpscare() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [110, 117, 233, 466].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.65, now + 0.75);
      gain.gain.setValueAtTime(this.volume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    });
  }

  playMorseBeep(kind: 'dot' | 'dash') {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const duration = kind === 'dot' ? 0.08 : 0.24;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.22, now + 0.01);
    gain.gain.setValueAtTime(this.volume * 0.22, now + duration - 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  private radioNodes: { stop: () => void } | null = null;
  private radioTimerId: number | null = null;

  stopRadioChannel() {
    if (this.radioTimerId !== null) {
      window.clearInterval(this.radioTimerId);
      this.radioTimerId = null;
    }
    if (this.radioNodes) {
      try {
        this.radioNodes.stop();
      } catch {
        // ignore audio teardown errors
      }
      this.radioNodes = null;
    }
  }

  startRadioChannel(mode: 'static' | 'rain' | 'news' | 'numbers' | 'taboo') {
    this.stopRadioChannel();
    const ctx = this.ensureContext();
    if (!ctx) return;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.001, this.volume * 0.25), ctx.currentTime);
    masterGain.connect(ctx.destination);

    const sources: AudioNode[] = [];
    const oscs: (OscillatorNode | AudioBufferSourceNode)[] = [];

    // Create looping noise buffer for static / rain texture
    const len = Math.floor(ctx.sampleRate * 1.5);
    const noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (mode === 'rain') {
        lastOut = (lastOut + 0.04 * white) / 1.04;
        data[i] = lastOut * 2.4;
      } else {
        data[i] = white * (mode === 'static' ? 0.55 : 0.12);
      }
    }

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    noiseSrc.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = mode === 'rain' ? 'lowpass' : 'bandpass';
    filter.frequency.value = mode === 'rain' ? 950 : mode === 'static' ? 1800 : 1200;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = mode === 'static' ? 0.45 : mode === 'rain' ? 0.65 : 0.14;

    noiseSrc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSrc.start();
    oscs.push(noiseSrc);
    sources.push(noiseGain, filter);

    if (mode === 'rain') {
      // Soft warm Lo-Fi pad chord
      [220, 277.18, 329.63].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        g.gain.value = 0.08;
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        oscs.push(osc);
      });
    } else if (mode === 'news') {
      // Periodic emergency bulletin pips
      let step = 0;
      this.radioTimerId = window.setInterval(() => {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(step % 4 === 0 ? 880 : 660, t);
        g.gain.setValueAtTime(this.volume * 0.11, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.13);
        step += 1;
      }, 650);
    } else if (mode === 'numbers') {
      // Numbers station coded beeps
      const pattern = [523.25, 659.25, 440, 783.99, 587.33];
      let step = 0;
      this.radioTimerId = window.setInterval(() => {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pattern[step % pattern.length], t);
        g.gain.setValueAtTime(this.volume * 0.14, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
        step += 1;
      }, 480);
    } else if (mode === 'taboo') {
      // Unsettling low infrasound beat + dissonant overtone
      [58, 61.5, 466.16].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx === 2 ? 'sawtooth' : 'sine';
        osc.frequency.value = freq;
        g.gain.value = idx === 2 ? 0.04 : 0.22;
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        oscs.push(osc);
      });
    }

    this.radioNodes = {
      stop: () => {
        oscs.forEach((o) => {
          try {
            o.stop();
          } catch {
            // ignore already stopped
          }
        });
        masterGain.disconnect();
      },
    };
  }
}

export const soundEngine = new SoundEngine();
