import type { AudioEngine, AudioLoadEvents, AudioSource } from './AudioEngine';

export class WebAudioEngine implements AudioEngine {
  private ctx: AudioContext | null = null;
  private vinylCrackleNode: AudioNode | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private masterGain: GainNode | null = null;
  private crackleGain: GainNode | null = null;
  private isPlayingMusic = false;
  private currentFreqs: number[] = [196, 246.94, 293.66, 392]; // G major 7 warm chord
  private previewAudio: HTMLAudioElement | null = null;
  private previewKey: string | null = null;

  public async load(source: AudioSource, events: AudioLoadEvents = {}): Promise<void> {
    this.stopPlayback();
    const audio = new Audio(source.uri);
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    audio.addEventListener('timeupdate', () => events.onTimeUpdate?.(audio.currentTime, audio.duration || 0));
    audio.addEventListener('durationchange', () => events.onTimeUpdate?.(audio.currentTime, audio.duration || 0));
    audio.addEventListener('ended', () => events.onEnded?.());
    audio.addEventListener('error', () => events.onError?.('音频加载失败，请稍后重试'));
    this.previewAudio = audio;
    this.previewKey = source.id ?? source.uri;
  }

  public async play(): Promise<void> {
    if (!this.previewAudio) throw new Error('No audio source loaded');
    await this.previewAudio.play();
  }

  public async pause(): Promise<void> { this.previewAudio?.pause(); }

  public async seek(seconds: number): Promise<void> {
    if (!this.previewAudio || !Number.isFinite(this.previewAudio.duration)) return;
    this.previewAudio.currentTime = Math.max(0, Math.min(seconds, this.previewAudio.duration));
  }

  public async setVolume(volume: number): Promise<void> {
    if (this.previewAudio) this.previewAudio.volume = Math.max(0, Math.min(1, volume));
  }

  public async setPlaybackRate(rate: number): Promise<void> {
    if (this.previewAudio) this.previewAudio.playbackRate = rate;
  }

  public async getCurrentTime(): Promise<number> { return this.previewAudio?.currentTime ?? 0; }

  public async getDuration(): Promise<number> {
    return this.previewAudio && Number.isFinite(this.previewAudio.duration) ? this.previewAudio.duration : 0;
  }

  public async destroy(): Promise<void> {
    this.stopPlayback();
    if (this.ctx) await this.ctx.close().catch(() => undefined);
    this.ctx = null;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Play needle drop effect
  public playNeedleDrop() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  // Start warm vinyl crackle and analog ambiance
  public startPlayback(seed = 1) {
    try {
      this.initContext();
      if (!this.ctx) return;

      this.stopPlayback();
      const now = this.ctx.currentTime;

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.01, now);
      this.masterGain.gain.linearRampToValueAtTime(0.25, now + 1.2);
      this.masterGain.connect(this.ctx.destination);

      // 1. Procedural subtle vinyl surface noise (analog groove hiss + crackle)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        // Brown noise + random crackle spikes
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        if (Math.random() < 0.0008) {
          output[i] += (Math.random() * 0.3 - 0.15); // tiny vinyl click
        }
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1200, now);
      bandpass.Q.setValueAtTime(1.5, now);

      this.crackleGain = this.ctx.createGain();
      this.crackleGain.gain.setValueAtTime(0.06, now);

      whiteNoise.connect(bandpass);
      bandpass.connect(this.crackleGain);
      this.crackleGain.connect(this.masterGain);
      whiteNoise.start(now);
      this.vinylCrackleNode = whiteNoise;

      // 2. Harmonic warm musical pad based on track/album
      const chordSets = [
        [130.81, 164.81, 196.00, 246.94], // C major 7 (warm vintage)
        [146.83, 174.61, 220.00, 261.63], // D minor 7 (melodic melancholy)
        [110.00, 164.81, 220.00, 277.18], // A 9 (jazzy warmth)
        [98.00, 146.83, 196.00, 293.66],  // G open (pastoral rock)
      ];
      this.currentFreqs = chordSets[seed % chordSets.length];

      this.musicOscillators = this.currentFreqs.map((freq, index) => {
        const osc = this.ctx!.createOscillator();
        const oscGain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600 + index * 100, now);

        oscGain.gain.setValueAtTime(0.02, now);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(this.masterGain!);

        osc.start(now);
        return osc;
      });

      this.isPlayingMusic = true;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Stop playback gracefully
  public stopPlayback() {
    try {
      if (this.previewAudio) {
        this.previewAudio.pause();
        this.previewAudio.removeAttribute('src');
        this.previewAudio.load();
        this.previewAudio = null;
        this.previewKey = null;
      }
      if (this.ctx && this.masterGain) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.linearRampToValueAtTime(0.001, now + 0.6);
        setTimeout(() => {
          this.musicOscillators.forEach((osc) => {
            try {
              osc.stop();
              osc.disconnect();
            } catch {}
          });
          this.musicOscillators = [];

          if (this.vinylCrackleNode) {
            try {
              (this.vinylCrackleNode as AudioBufferSourceNode).stop();
              this.vinylCrackleNode.disconnect();
            } catch {}
            this.vinylCrackleNode = null;
          }
        }, 650);
      }
      this.isPlayingMusic = false;
    } catch {}
  }

  /** Web-only mechanical click retained for the haptics adapter's existing feedback. */
  public playHapticSound(type: 'light' | 'medium' | 'heavy' = 'light') {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = type === 'light' ? 320 : type === 'medium' ? 180 : 120;
      const vol = type === 'light' ? 0.04 : type === 'medium' ? 0.08 : 0.12;
      const duration = type === 'light' ? 0.015 : 0.025;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + duration);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  }
}

