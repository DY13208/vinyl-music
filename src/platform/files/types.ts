export interface FileService {
  readAsText(file: Blob): Promise<string>;
  readAsDataUrl(file: Blob): Promise<string>;
  downloadText(filename: string, contents: string, mimeType: string): void;
  pickLocalAudio(): Promise<LocalAudioSelection | null>;
}

export interface LocalAudioSelection {
  blob: Blob;
  filename: string;
  mimeType: string;
  duration?: number;
  title?: string;
  artist?: string;
}
