export interface ScannerSession { stop(): void; }

export interface ScannerService {
  startBarcodeScan(preview: HTMLVideoElement, onDetected: (value: string) => void): Promise<ScannerSession>;
}
