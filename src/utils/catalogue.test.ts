import { test } from 'node:test';
import assert from 'node:assert/strict';
import { providerAlbumToAlbum } from '../server/vinylSearch/utils';
import { isInCollection } from './catalogue';

const album = providerAlbumToAlbum({ provider: 'deezer', providerId: '1', role: 'identity', artist: 'Artist', title: 'Album' });
test('catalogue membership handles cross-provider duplicates without conflating artists or pressings', () => {
  assert.equal(isInCollection(album, []), false);
  assert.equal(isInCollection({ ...album, id: 'other-id' }, [album]), true);
  assert.equal(isInCollection({ ...album, id: 'other-id', artist: 'Someone else' }, [album]), false);
  assert.equal(isInCollection({ ...album, id: 'pressing-a', catalogNumber: 'LP-A' }, [{ ...album, id: 'pressing-b', catalogNumber: 'LP-B' }]), false);
});
