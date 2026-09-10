import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { StorageService } from '../../platform/storage/StorageService';
import type { Album } from '../../types';
import { WebCollectionRepository } from './WebCollectionRepository';

class MemoryStorage implements StorageService {
  public values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
const album = (id: string, title = id) => ({ id, title, artist: 'Artist', tracks: [] }) as Album;

test('reads the existing localStorage-compatible collection key without migration', () => {
  const storage = new MemoryStorage();
  storage.setItem('vinyl_user_collection', JSON.stringify([album('existing')]));
  const repository = new WebCollectionRepository(storage, [album('default')]);
  assert.deepEqual(repository.getAlbums().map(item => item.id), ['existing']);
});

test('local save, update and delete are immediately authoritative', () => {
  const storage = new MemoryStorage();
  const repository = new WebCollectionRepository(storage, [album('default')]);
  assert.deepEqual(repository.saveAlbum(album('new')).map(item => item.id), ['new', 'default']);
  assert.equal(repository.updateAlbum(album('new', 'Updated'))[0].title, 'Updated');
  assert.deepEqual(repository.deleteAlbum('new').map(item => item.id), ['default']);
});

test('batch import preserves existing id and title deduplication behavior', () => {
  const storage = new MemoryStorage();
  const repository = new WebCollectionRepository(storage, [album('one', 'One')]);
  assert.deepEqual(repository.saveAlbums([album('one', 'Duplicate id'), album('two', 'One'), album('three', 'Three')]).map(item => item.id), ['three', 'one']);
});
