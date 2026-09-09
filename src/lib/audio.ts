/**
 * Web Audio API Sound Synthesizer
 * Zero external audio file dependencies. Produces clean, crisp, harmonic audio effects.
 */

export type TileStateSound = 'CORRECT' | 'PRESENT' | 'ABSENT' | 'EMPTY' | 'ACTIVE' | string;

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted: boolean = false;
  private volume: number = 0.8; // 0.0 to 1.0
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Read mute & volume preference from localStorage
    try {
      const savedMute = localStorage.getItem('alwird_muted');
      if (savedMute !== null) {
        this.muted = JSON.parse(savedMute);
      }
      const savedVol = localStorage.getItem('alwird_volume');
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }
    } catch {}
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem('alwird_muted', JSON.stringify(muted));
    } catch {}

    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    try {
      localStorage.setItem('alwird_volume', clamped.toString());
    } catch {}

    if (this.ctx && this.masterGain && !this.muted) {
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
    this.notify();
  }

  private getDestination(): AudioNode | null {
    if (this.muted) return null;
    this.initContext();
    if (!this.ctx || !this.masterGain) return null;
    return this.masterGain;
  }

  /**
   * Sound when typing an Arabic letter
   */
  public playKeypress() {
    const dest = this.getDestination();
    if (!dest || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(dest);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch {}
  }

  /**
   * Sound when deleting an Arabic letter
   */
  public playBackspace() {
    const dest = this.getDestination();
    if (!dest || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(130, this.ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(dest);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch {}
  }

  /**
   * Sound when word is invalid (too short, or not in dictionary)
   */
  public playInvalidWord() {
    const dest = this.getDestination();
    if (!dest || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.setValueAtTime(105, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(dest);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {}
  }

  /**
   * Sound when a valid guess is submitted
   */
  public playGuessSubmit() {
    const dest = this.getDestination();
    if (!dest || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(dest);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {}
  }

  /**
   * Sound for individual tile flip or reveal
   */
  public playTileFlip(index: number = 0, state?: TileStateSound) {
    const dest = this.getDestination();
    if (!dest || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      let freq = 400 + index * 50;
      let type: OscillatorType = 'triangle';

      if (state === 'CORRECT') {
        // High bright bell for correct letter
        freq = 587.33 + index * 60; // D5+
        type = 'sine';
      } else if (state === 'PRESENT') {
        // Warm harmonic tone for misplaced letter
        freq = 440 + index * 40; // A4
        type = 'triangle';
      } else if (state === 'ABSENT') {
        // Low muted wood tap
        freq = 240;
        type = 'sine';
      }

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(dest);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {}
  }

  /**
   * Sequential reveal sound for the 5-letter guess evaluation
   */
  public playGuessEvaluation(evaluation: TileStateSound[]) {
    if (this.muted) return;
    this.playGuessSubmit();

    evaluation.forEach((state, idx) => {
      setTimeout(() => {
        this.playTileFlip(idx, state);
      }, idx * 120);
    });
  }

  /**
   * Celebratory sound when player solves a word or wins a round
   */
  public playRoundWin() {
    const dest = this.getDestination();
    if (!dest || !this.ctx) return;

    try {
      // Harmonic major arpeggio: C5, E5, G5, C6 with sparkle
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.14, this.ctx!.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.08 + 0.32);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(this.ctx!.currentTime + idx * 0.08);
        osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.32);
      });
    } catch {}
  }

  /**
   * Grand fanfare when winning the complete match / championship
   */
  public playMatchWin() {
    const dest = this.getDestination();
    if (!dest || !this.ctx) return;

    try {
      // Fanfare sequence: C5, G5, C6, E6, G6
      const fanfare = [
        { f: 523.25, d: 0.12, t: 0.0 },
        { f: 659.25, d: 0.12, t: 0.12 },
        { f: 783.99, d: 0.16, t: 0.24 },
        { f: 1046.5, d: 0.35, t: 0.40 },
        { f: 1318.5, d: 0.50, t: 0.65 },
      ];

      fanfare.forEach((n) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, this.ctx!.currentTime + n.t);

        gain.gain.setValueAtTime(0.16, this.ctx!.currentTime + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + n.t + n.d);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(this.ctx!.currentTime + n.t);
        osc.stop(this.ctx!.currentTime + n.t + n.d);
      });
    } catch {}
  }

  /**
   * Defeat / round loss sound (when exhausted or opponent solves first)
   */
  public playRoundLoss() {
    const dest = this.getDestination();
    if (!dest || !this.ctx) return;

    try {
      // Descending minor sequence
      const notes = [440, 392, 349.23, 293.66];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.11);

        gain.gain.setValueAtTime(0.1, this.ctx!.currentTime + idx * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.11 + 0.22);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(this.ctx!.currentTime + idx * 0.11);
        osc.stop(this.ctx!.currentTime + idx * 0.11 + 0.22);
      });
    } catch {}
  }

  /**
   * Match loss / draw sound
   */
  public playMatchLoss() {
    const dest = this.getDestination();
    if (!dest || !this.ctx) return;

    try {
      const notes = [329.63, 293.66, 261.63, 220]; // E4, D4, C4, A3
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.14);

        gain.gain.setValueAtTime(0.09, this.ctx!.currentTime + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.14 + 0.3);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(this.ctx!.currentTime + idx * 0.14);
        osc.stop(this.ctx!.currentTime + idx * 0.14 + 0.3);
      });
    } catch {}
  }

  /**
   * Countdown tick (for 3-2-1 match start & final 5 seconds of round)
   */
  public playCountdownTick(isFinal: boolean = false) {
    const dest = this.getDestination();
    if (!dest || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 440, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(dest);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {}
  }

  /**
   * Joker Power-up magic sparkle arpeggio
   */
  public playJokerPowerUp() {
    const dest = this.getDestination();
    if (!dest || !this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5]; // C5, E5, G5, B5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.07);

        gain.gain.setValueAtTime(0.12, this.ctx!.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.07 + 0.25);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(this.ctx!.currentTime + idx * 0.07);
        osc.stop(this.ctx!.currentTime + idx * 0.07 + 0.25);
      });
    } catch {}
  }

  /**
   * Sound effect when opening dictionary hint modal
   */
  public playHintReveal() {
    const dest = this.getDestination();
    if (!dest || !this.ctx) return;

    try {
      const notes = [440, 554.37, 659.25]; // A4, C#5, E5 (warm major chord)
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.1, this.ctx!.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.05 + 0.22);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(this.ctx!.currentTime + idx * 0.05);
        osc.stop(this.ctx!.currentTime + idx * 0.05 + 0.22);
      });
    } catch {}
  }
}

export const soundManager = new SoundSynthesizer();

