import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppleMusicProvider } from './AppleMusicProvider';

test('searches Asian and North American catalogs and isolates a failed region', async t => {
  const countries: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string) => {
    const url = new URL(input);
    const country = url.searchParams.get('country')!;
    countries.push(country);
    assert.equal(url.searchParams.get('term'), '釋放自己 Jacky Cheung');
    if (country === 'KR') throw new Error('region unavailable');
    return new Response(JSON.stringify({ results: [{ trackId: 1, trackName: country === 'HK' ? '釋放自己 (Live)' : 'Release Yourself (Live)', artistName: 'Jacky Cheung', collectionName: 'Concert', previewUrl: 'https://example.com/preview.m4a' }] }));
  });
  const result = await new AppleMusicProvider().searchTrack({ id: '1', title: '釋放自己', artist: 'Jacky Cheung', album: 'Concert' });
  assert.deepEqual(countries.sort(), ['CA', 'HK', 'JP', 'KR', 'TW', 'US']);
  assert.equal(result.length, 2, 'retain distinct localizations of the same recording');
  assert.ok(result.every(source => source.previewOnly));
});
