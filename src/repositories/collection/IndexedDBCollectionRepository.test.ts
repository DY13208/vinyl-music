import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IndexedDBCollectionRepository } from './IndexedDBCollectionRepository';
import type { StorageService } from '../../platform/storage/StorageService';
import { ALBUMS } from '../../data/mockData';

function fixture(data: unknown, legacy: string | null = null) {
  const storage: StorageService = { getItem: () => legacy, setItem: () => {}, removeItem: () => {} };
  const values = new Map<string, unknown>([['collection-migration-v1', true], ['vinyl_user_collection', data]]);
  const db = {
    get: async <T>(_store: unknown, key: IDBValidKey) => values.get(String(key)) as T | undefined,
    put: async <T>(_store: unknown, key: IDBValidKey, value: T) => { values.set(String(key), value); },
  };
  return new IndexedDBCollectionRepository(storage, [], db);
}

test('ready barrier exposes existing IndexedDB albums and removes sample metadata on refresh', async () => {
  const repository = fixture([ALBUMS[0]]);
  assert.deepEqual(repository.getAlbums(), []);
  assert.throws(() => repository.saveAlbum(ALBUMS[1]), /加载/);
  await repository.whenReady();
  assert.equal(repository.getAlbums()[0].id, ALBUMS[0].id);
  assert.equal(repository.getAlbums()[0].coverUrl, '');
  assert.equal(repository.getAlbums()[0].vinylVariant, 'black');
});

test('an empty IndexedDB collection overrides stale legacy data', async () => {
  const repository = fixture([], JSON.stringify([ALBUMS[0]]));
  await repository.whenReady();
  assert.deepEqual(repository.getAlbums(), []);
});

test('first visit stays empty instead of creating a sample collection', async () => {
  const repository = fixture(undefined);
  await repository.whenReady();
  assert.deepEqual(repository.getAlbums(), []);
});

test('failed local writes reject without falsely changing the collection', async () => {
  const storage: StorageService = { getItem: () => null, setItem() {}, removeItem() {} };
  const db = { get: async <T>() => undefined as T | undefined, put: async () => { throw new Error('QuotaExceededError'); } };
  const repository = new IndexedDBCollectionRepository(storage, [], db);
  await repository.whenReady();
  await assert.rejects(repository.saveAlbum(ALBUMS[0]), /本地保存失败/);
  assert.deepEqual(repository.getAlbums(), []);
});

test('overlapping additions are queued without losing either album', async () => {
  const repository = fixture([]);
  await repository.whenReady();
  await Promise.all([repository.saveAlbum(ALBUMS[0]), repository.saveAlbum(ALBUMS[1])]);
  assert.equal(repository.getAlbums().length, 2);
});
