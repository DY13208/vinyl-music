const LANDSCAPE = '(orientation: landscape) and (min-width: 640px)';

/** Kept at the platform boundary so native hosts can supply their own viewport. */
export class WebViewportAdapter {
  isLandscape = () => typeof window !== 'undefined' && window.matchMedia(LANDSCAPE).matches;
  supportsWebGL = () => {
    if (typeof document === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      return Boolean(canvas.getContext('webgl2'));
    } catch {
      return false;
    }
  };
  subscribe = (listener: () => void) => {
    if (typeof window === 'undefined') return () => {};
    const query = window.matchMedia(LANDSCAPE);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  };
}
