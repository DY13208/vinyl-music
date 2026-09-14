import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LocalDatabaseProvider } from './providers/LocalDatabaseProvider';
import { VinylSearchService } from './VinylSearchService';
import { providerAlbumToAlbum } from './utils';
import type { ProviderAlbum, VinylSearchProvider } from './types';

const identity: ProviderAlbum = { provider: 'deezer', providerId: 'album', role: 'identity', title: 'Example', artist: 'Artist', coverUrl: 'https://example.org/cover.jpg' };
const physical: ProviderAlbum = { ...identity, provider: 'discogs', providerId: 'release', role: 'physical', isVinylRelease: true, barcode: '1234567890123', catalogNumber: 'LP-1', coverUrl: undefined };
function provider(item: ProviderAlbum): VinylSearchProvider {
  return { id: item.provider, role: item.role, priority: 1, availability: () => ({ available: true }), search: async () => [item], searchByBarcode: async () => [], getAlbum: async () => item };
}

test('local provider does not return demo albums as search evidence', async () => {
  assert.deepEqual(await new LocalDatabaseProvider().search('Abbey Road'), []);
});

test('identity-only metadata supplies black vinyl without invented pressing, year or condition', () => {
  const album = providerAlbumToAlbum(identity);
  assert.equal(album.vinylTexture, 'black');
  assert.equal(album.year, 0);
  assert.equal(album.edition, '未确认黑胶发行版本');
  assert.equal(album.condition, '');
  assert.equal(album.rpm, '待确认');
  assert.equal(album.coverUrl, identity.coverUrl);
});

test('release identifiers stay on their release and are not borrowed by album identity', async () => {
  const service = new VinylSearchService([provider(identity), provider(physical)]);
  const result = (await service.search({ query: 'Example', artist: 'Artist', album: 'Example' })).results[0];
  assert.equal(result.album.barcode, undefined);
  assert.equal(result.album.catalogNumber, undefined);
  assert.equal(result.vinylRelease?.barcode, physical.barcode);
});

test('live and studio albums do not merge into one result', async () => {
  const service = new VinylSearchService([provider(identity), provider({ ...physical, title: 'Example (Live)' })]);
  const results = (await service.search({ query: 'Example', artist: 'Artist', album: 'Example' })).results;
  assert.equal(results.length, 2);
  assert.equal(results.find(result => result.album.title === 'Example')?.vinylReleaseFound, false);
});

test('a named artist search excludes another artist covering the same album', async () => {
  const service = new VinylSearchService([provider(identity), provider({ ...physical, artist: 'Someone Else' })]);
  const results = (await service.search({ query: 'Example', artist: 'Artist', album: 'Example' })).results;
  assert.equal(results.length, 1);
  assert.equal(results[0].album.artist, 'Artist');
  assert.equal(results[0].vinylReleaseFound, false);
});

test('identity-only album does not acquire an arbitrary pressing tracklist or cover', async () => {
  const release = { ...physical, coverUrl: 'https://example.org/special-edition.jpg', tracks: [{ id: 'bonus', number: 1, title: 'Edition bonus', duration: '1:00', durationSec: 60 }] };
  const service = new VinylSearchService([provider({ ...identity, coverUrl: undefined }), provider(release)]);
  const result = (await service.search({ query: 'Example', artist: 'Artist', album: 'Example' })).results[0];
  assert.equal(result.album.coverUrl, '');
  assert.deepEqual(result.album.tracks, []);
  assert.equal(result.vinylRelease?.tracks[0].id, 'bonus');
});
