
class SoundManager {
  private audioCtx: AudioContext | null = null;

  private initContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private async playFrequency(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.1, ramp: 'exp' | 'linear' = 'exp') {
    this.initContext();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    if (ramp === 'exp') {
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
    } else {
      gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + duration);
    }

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  playBeep() {
    this.playFrequency(880, 0.1, 'sine', 0.05);
  }

  playError() {
    this.playFrequency(110, 0.3, 'sawtooth', 0.1);
  }

  playSuccess() {
    this.playFrequency(523.25, 0.05, 'sine', 0.1);
    setTimeout(() => this.playFrequency(783.99, 0.2, 'sine', 0.1), 50);
  }

  playUIHover() {
    this.playFrequency(1200, 0.05, 'sine', 0.01);
  }

  playTyping() {
    // Sharp high frequency "click"
    this.playFrequency(2000 + Math.random() * 500, 0.02, 'sine', 0.01);
  }

  playMessageSent() {
    this.playFrequency(600, 0.1, 'triangle', 0.05);
  }

  playScan() {
    // Rising sweep for face/system scan
    const duration = 0.5;
    this.initContext();
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  playMapSearch() {
    // Pulsing tech sound
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.playFrequency(800 - i * 100, 0.1, 'square', 0.02), i * 150);
    }
  }

  playListening() {
    // Low double beep
    this.playFrequency(440, 0.1, 'sine', 0.05);
    setTimeout(() => this.playFrequency(440, 0.1, 'sine', 0.05), 150);
  }

  playNotification() {
    this.playFrequency(523.25, 0.1, 'sine', 0.1);
    setTimeout(() => this.playFrequency(659.25, 0.1, 'sine', 0.1), 100);
    setTimeout(() => this.playFrequency(783.99, 0.2, 'sine', 0.1), 200);
  }

  playJarvisStart() {
    const duration = 1.5;
    this.initContext();
    if (!this.audioCtx) return;
    
    // Low drone
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.frequency.setTargetAtTime(60, this.audioCtx.currentTime, 0.1);
    gain1.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.5);
    gain1.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + duration);
    osc1.connect(gain1);
    gain1.connect(this.audioCtx.destination);
    osc1.start();
    osc1.stop(this.audioCtx.currentTime + duration);

    // High chirp
    setTimeout(() => {
        this.playFrequency(880, 0.1, 'sine', 0.1);
        setTimeout(() => this.playFrequency(1320, 0.2, 'sine', 0.05), 100);
    }, 200);
  }
}

export const soundManager = new SoundManager();
