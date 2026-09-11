import { ProviderHttpError } from './errors.js';
import type { VinylProviderId } from './types.js';

type RequestProviderId = VinylProviderId | 'cover-art';

const secretPattern = /([?&](?:token|access_token|key|appkey|secret|signature)=)[^&]+/gi;

export const providerUserAgent = 'VinylShelf/1.0 (https://github.com/vinyl-shelf)';

export async function requestJson<T>(
  provider: RequestProviderId,
  url: string,
  init: RequestInit = {},
  timeoutMs = 9000,
): Promise<T> {
  const started = Date.now();
  const safeUrl = url.replace(secretPattern, '$1<redacted>');
  console.log(`[vinyl-search][${provider}] request ${safeUrl}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    const elapsed = Date.now() - started;
    console.log(`[vinyl-search][${provider}] response status=${response.status} durationMs=${elapsed}`);
    if (!response.ok) {
      const reason = text.slice(0, 240).replace(/\s+/g, ' ') || response.statusText;
      console.error(`[vinyl-search][${provider}] http_error status=${response.status} reason=${reason}`);
      throw new ProviderHttpError(provider, response.status, `${response.status} ${reason}`);
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      console.error(`[vinyl-search][${provider}] invalid_json durationMs=${elapsed}`);
      throw new ProviderHttpError(provider, response.status, 'invalid_json');
    }
  } catch (error) {
    if (error instanceof ProviderHttpError) throw error;
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'timeout'
      : error instanceof Error ? error.message : String(error);
    console.error(`[vinyl-search][${provider}] request_error reason=${message} durationMs=${Date.now() - started}`);
    throw new ProviderHttpError(provider, undefined, message);
  } finally {
    clearTimeout(timer);
  }
}

export function logProviderHits(provider: RequestProviderId, operation: string, count: number, started: number) {
  console.log(`[vinyl-search][${provider}] ${operation} hits=${count} durationMs=${Date.now() - started}`);
}
