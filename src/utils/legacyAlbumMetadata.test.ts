import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALBUMS } from '../data/mockData';
import { cleanLegacyAlbum } from './legacyAlbumMetadata';
import { getVinylAppearance } from './vinylAppearance';

test('known demo artwork and pressing values are removed without changing original data or tracks', () => {
  const sample = structuredClone(ALBUMS[0]);
  const result = cleanLegacyAlbum(sample);
  assert.equal(result.coverUrl, '');
  assert.equal(result.edition, '');
  assert.equal(result.matrixCode, '');
  assert.equal(result.price, undefined);
  assert.equal(getVinylAppearance(result).texture, 'black');
  assert.deepEqual(result.tracks, sample.tracks);
  assert.ok(sample.coverUrl.includes('unsplash'));
  assert.equal(sample.vinylVariant, 'clear');
});

test('user replacement artwork, pressing details and explicit colored vinyl are retained', () => {
  const album = { ...ALBUMS[0], coverUrl: '/my-cover.webp', edition: 'My pressing', vinylType: 'splatter' as const, vinylTexture: 'splatter-02' };
  const result = cleanLegacyAlbum(album);
  assert.equal(result.coverUrl, album.coverUrl);
  assert.equal(result.edition, album.edition);
  assert.equal(getVinylAppearance(result).texture, 'splatter-02');
});

test('unknown vinyl defaults to black despite an ambient color or orphan texture', () => {
  const appearance = getVinylAppearance({ color: '#ff0000', vinylTexture: 'red' });
  assert.equal(appearance.variant, 'black');
  assert.equal(appearance.texture, 'black');
});
