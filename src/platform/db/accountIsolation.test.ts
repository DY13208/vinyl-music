import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebIndexedDBAdapter } from './VinylDatabase';

test('account databases isolate collections and artwork across reopen', async () => {
  const a = new WebIndexedDBAdapter('vinyl-test:account:a');
  const b = new WebIndexedDBAdapter('vinyl-test:account:b');
  await a.transaction(['collections', 'artwork'], 'readwrite', async tx => {
    await tx.put('collections', 'vinyl_user_collection', [{ title: 'Private record A' }]);
    await tx.put('artwork', 'same-public-url', new Blob(['private image A']));
  });
  const read = (db: WebIndexedDBAdapter) => db.transaction(['collections', 'artwork'], 'readonly', async tx => [await tx.get('collections', 'vinyl_user_collection'), await tx.get('artwork', 'same-public-url')]);
  assert.deepEqual(await read(b), [undefined, undefined]);
  assert.deepEqual((await read(new WebIndexedDBAdapter('vinyl-test:account:a')))[0], [{ title: 'Private record A' }]);
});
