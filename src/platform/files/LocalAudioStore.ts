export interface LocalAudioStore {
  put(id: string, blob: Blob): Promise<void>;
  getPlaybackUri(id: string): Promise<string | null>;
  remove(id: string): Promise<void>;
}
