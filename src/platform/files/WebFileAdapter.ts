import type { FileService, LocalAudioSelection } from './types';

function readFile(file: Blob, mode: 'text' | 'dataUrl'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    if (mode === 'text') reader.readAsText(file);
    else reader.readAsDataURL(file);
  });
}

export class WebFileAdapter implements FileService {
  public readAsText(file: Blob): Promise<string> { return readFile(file, 'text'); }
  public readAsDataUrl(file: Blob): Promise<string> { return readFile(file, 'dataUrl'); }

  public downloadText(filename: string, contents: string, mimeType: string): void {
    const anchor = document.createElement('a');
    anchor.href = `data:${mimeType};charset=utf-8,${encodeURIComponent(contents)}`;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  public pickLocalAudio(): Promise<LocalAudioSelection | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/mpeg,audio/mp4,audio/aac,audio/flac,audio/wav,.mp3,.m4a,.aac,.flac,.wav';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        const base = file.name.replace(/\.[^.]+$/, '');
        const parts = base.split(/\s+-\s+/);
        const duration = await this.readAudioDuration(file);
        resolve({ blob: file, filename: file.name, mimeType: file.type, duration, artist: parts.length > 1 ? parts[0].trim() : undefined, title: parts.length > 1 ? parts.slice(1).join(' - ').trim() : base.trim() });
      };
      input.click();
    });
  }

  private readAudioDuration(file: Blob): Promise<number | undefined> {
    return new Promise((resolve) => {
      const uri = URL.createObjectURL(file);
      const audio = new Audio();
      const finish = (duration?: number) => { URL.revokeObjectURL(uri); resolve(duration); };
      audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) ? audio.duration : undefined);
      audio.onerror = () => finish();
      audio.src = uri;
    });
  }
}
