import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CatalogueCache } from './catalogueCache';
import { WebIndexedDBAdapter } from '../platform/db/VinylDatabase';
import type { Album } from '../types';

test('catalogue snapshots survive reopen, become stale and expire without changing the collection', async () => {
  let now = 1000;
  const db = new WebIndexedDBAdapter('catalogue-expiry-test');
  const album = { id: 'public-1', title: 'Public album', tracks: [] } as unknown as Album;
  const cache = new CatalogueCache(db, () => now);
  await cache.put('album', album.id, album);
  const reopened = new CatalogueCache(new WebIndexedDBAdapter('catalogue-expiry-test'), () => now);
  assert.deepEqual(await reopened.get('album', album.id), { data: album, stale: false });
  assert.equal(await reopened.get('search', album.id), undefined);
  now += 24 * 60 * 60 * 1000;
  assert.equal((await reopened.get('album', album.id))?.stale, true);
  now += 6 * 24 * 60 * 60 * 1000;
  assert.equal(await reopened.get('album', album.id), undefined);
  assert.equal(await db.transaction(['collections'], 'readonly', tx => tx.get('collections', 'vinyl_user_collection')), undefined);
});

test('catalogue snapshots are bounded and isolated by account database', async () => {
  const db = new WebIndexedDBAdapter('catalogue-limit-test');
  let now = 1000;
  const cache = new CatalogueCache(db, () => ++now);
  for (let index = 0; index < 45; index++) await cache.put('search', String(index), []);
  assert.equal(await cache.get('search', '0'), undefined);
  assert.deepEqual((await cache.get('search', '44'))?.data, []);
  const other = new CatalogueCache(new WebIndexedDBAdapter('catalogue-other-account'));
  assert.equal(await other.get('search', '44'), undefined);
  // Enforce the byte budget as well as the entry-count budget.
  for (let index = 0; index < 5; index++) {
    await cache.put('album', String(index), { id: String(index), description: 'x'.repeat(1024 * 1024) } as Album);
  }
  assert.equal(await cache.get('album', '0'), undefined);
  assert.ok(await cache.get('album', '4'));
});

test('unavailable storage does not block browsing', async () => {
  const db = new WebIndexedDBAdapter('catalogue-unavailable');
  db.transaction = async () => { throw new Error('Storage unavailable'); };
  const cache = new CatalogueCache(db);
  await cache.put('search', 'artist', []);
  assert.equal(await cache.get('search', 'artist'), undefined);
});
