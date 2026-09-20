import { WebScannerAdapter } from './WebScannerAdapter';

/** Scanner capability entry point, kept separate so ZXing remains lazily loaded with its UI. */
export const scannerService = new WebScannerAdapter();
