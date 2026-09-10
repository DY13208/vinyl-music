import { BrowserMultiFormatReader } from '@zxing/browser';
import type { ScannerService, ScannerSession } from './types';

export class WebScannerAdapter implements ScannerService {
  public async startBarcodeScan(preview: HTMLVideoElement, onDetected: (value: string) => void): Promise<ScannerSession> {
    const reader = new BrowserMultiFormatReader();
    let session: ScannerSession | null = null;
    session = await reader.decodeFromConstraints(
      { video: { facingMode: { ideal: 'environment' } }, audio: false },
      preview,
      (result) => {
        if (!result) return;
        session?.stop();
        onDetected(result.getText());
      },
    );
    return session;
  }
}
