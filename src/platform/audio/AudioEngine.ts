export interface AudioSource {
  uri: string;
  id?: string;
  mimeType?: string;
}

export interface AudioLoadEvents {
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (message: string) => void;
}

/** Platform-neutral playback contract. Platform implementations own concrete media objects. */
export interface AudioEngine {
  load(source: AudioSource, events?: AudioLoadEvents): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seek(seconds: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  setPlaybackRate(rate: number): Promise<void>;
  getCurrentTime(): Promise<number>;
  getDuration(): Promise<number>;
  destroy(): Promise<void>;
}
