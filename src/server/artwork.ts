import type { IncomingMessage, ServerResponse } from 'node:http';
import { publicArtworkUrl } from '../utils/artworkUrl.js';

export const MAX_ARTWORK_BYTES = 3 * 1024 * 1024;
const MIME = /^image\/(jpeg|png|webp|gif|avif)$/i;

export async function fetchPublicArtwork(source: string, request: typeof fetch = fetch) {
  let url = publicArtworkUrl(source);
  if (!url) throw new Error('Unsupported artwork source');
  const signal = AbortSignal.timeout(8000);
  for (let redirects = 0; redirects <= 3; redirects++) {
    const response = await request(url, { redirect: 'manual', signal, headers: { Accept: 'image/jpeg,image/png,image/webp,image/avif,image/gif', 'User-Agent': 'VinylShelf/1.0 (public artwork)' } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      url = location ? publicArtworkUrl(new URL(location, url).href) : null;
      if (!url) throw new Error('Unsupported artwork redirect');
      continue;
    }
    const mime = response.headers.get('content-type')?.split(';')[0].trim() || '';
    if (!response.ok || !MIME.test(mime) || Number(response.headers.get('content-length')) > MAX_ARTWORK_BYTES) {
      await response.body?.cancel();
      throw new Error('Artwork unavailable or too large');
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Empty artwork');
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        size += next.value.byteLength;
        if (size > MAX_ARTWORK_BYTES) throw new Error('Artwork too large');
        chunks.push(next.value);
      }
    } finally { await reader.cancel(); }
    if (!size) throw new Error('Empty artwork');
    return { bytes: Buffer.concat(chunks), mime };
  }
  throw new Error('Too many artwork redirects');
}

// Shared by the local development server and the stateless Vercel Function.
export async function artworkHandler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.writeHead(405).end();
    return;
  }
  const source = new URL(req.url || '/', 'https://vinyl.invalid').searchParams.get('url') || '';
  if (!publicArtworkUrl(source)) { res.writeHead(400, { 'Cache-Control': 'no-store' }).end('Unsupported public artwork URL'); return; }
  try {
    const { bytes, mime } = await fetchPublicArtwork(source);
    res.writeHead(200, { 'Content-Type': mime, 'Content-Length': bytes.length, 'Cache-Control': 'public, max-age=86400, s-maxage=604800' }).end(bytes);
  } catch {
    res.writeHead(502, { 'Cache-Control': 'no-store' }).end('Public artwork unavailable');
  }
}
