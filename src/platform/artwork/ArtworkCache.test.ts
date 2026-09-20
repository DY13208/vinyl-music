import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ArtworkCache } from './ArtworkCache';
import { vinylDatabase } from '../db/VinylDatabase';
import type { Album } from '../../types';

test('browsing eviction and clear preserve owned cover blobs across cache reconstruction', async () => {
  const cache = new ArtworkCache(vinylDatabase, 6);
  await vinylDatabase.transaction(['collections'], 'readwrite', tx => tx.put('collections', 'vinyl_user_collection', [{ coverUrl: 'owned', vinylLabel: { image: 'label' } }] as Album[]));
  const blob = new Blob(['1234'], { type: 'image/webp' });
  await cache.put('owned', blob);
  await cache.put('label', blob);
  await cache.put('old', blob);
  await cache.put('new', blob);
  assert.equal(await cache.get('old'), undefined);
  assert.equal((await cache.stats()).browsingBytes, 4);
  await cache.clearBrowsing();
  const reopened = new ArtworkCache(vinylDatabase);
  assert.equal(await (await reopened.get('owned'))?.text(), '1234');
  assert.equal(await (await reopened.get('label'))?.text(), '1234');
  assert.equal(await reopened.get('new'), undefined);
  assert.equal((await reopened.stats()).collectionBytes, 8);
  await vinylDatabase.transaction(['collections'], 'readwrite', tx => tx.put('collections', 'vinyl_user_collection', []));
  await reopened.clearBrowsing();
  assert.equal(await reopened.get('owned'), undefined);
});
