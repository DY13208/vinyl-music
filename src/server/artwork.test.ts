import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchPublicArtwork, MAX_ARTWORK_BYTES } from './artwork';
import { publicArtworkUrl } from '../utils/artworkUrl';

const cover = 'https://y.gtimg.cn/music/photo_new/test.jpg';
test('only public artwork CDNs are eligible; uploaded/private URLs never reach the relay', () => {
  for (const source of ['http://127.0.0.1/x', 'http://192.168.1.1/x', 'https://y.gtimg.cn.evil.test/x', 'https://user:pass@y.gtimg.cn/x', 'https://y.gtimg.cn:8443/x', 'data:image/png;base64,x', 'blob:http://localhost/x', 'file:///cover.jpg']) assert.equal(publicArtworkUrl(source), null);
  assert.equal(publicArtworkUrl('http://p1.music.126.net/cover.jpg'), 'https://p1.music.126.net/cover.jpg');
});

test('relay validates every redirect before fetching', async () => {
  const calls: string[] = [];
  await assert.rejects(fetchPublicArtwork(cover, (async (url: string) => {
    calls.push(url);
    return new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data' } });
  }) as typeof fetch), /redirect/);
  assert.deepEqual(calls, [cover]);
});

test('relay rejects HTML and oversized streaming bodies even without Content-Length', async () => {
  await assert.rejects(fetchPublicArtwork(cover, (async () => new Response('<html>no image</html>', { headers: { 'content-type': 'text/html' } })) as typeof fetch));
  await assert.rejects(fetchPublicArtwork(cover, (async () => new Response(new Uint8Array(MAX_ARTWORK_BYTES + 1), { headers: { 'content-type': 'image/jpeg' } })) as typeof fetch), /large/);
});

test('public image response preserves bytes and does not send user cookies', async () => {
  const result = await fetchPublicArtwork(cover, (async (_url, options) => {
    assert.equal(new Headers(options?.headers).has('cookie'), false);
    assert.equal(options?.redirect, 'manual');
    return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/jpeg' } });
  }) as typeof fetch);
  assert.equal(result.mime, 'image/jpeg');
  assert.deepEqual([...result.bytes], [1, 2, 3]);
});
