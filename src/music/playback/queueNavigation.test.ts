import assert from 'node:assert/strict';
import test from 'node:test';
import { getQueueIndex } from './queueNavigation';

test('queue advances, stops, and wraps according to repeat mode', () => {
  assert.equal(getQueueIndex({ length: 3, currentIndex: 1, direction: 'next', shuffle: false, repeatMode: 'off' }), 2);
  assert.equal(getQueueIndex({ length: 3, currentIndex: 2, direction: 'next', shuffle: false, repeatMode: 'off' }), -1);
  assert.equal(getQueueIndex({ length: 3, currentIndex: 2, direction: 'next', shuffle: false, repeatMode: 'all' }), 0);
  assert.equal(getQueueIndex({ length: 3, currentIndex: 0, direction: 'previous', shuffle: false, repeatMode: 'all' }), 2);
});

test('automatic repeat-one replays current track and shuffle avoids it', () => {
  assert.equal(getQueueIndex({ length: 3, currentIndex: 1, direction: 'next', shuffle: false, repeatMode: 'one', automatic: true }), 1);
  assert.equal(getQueueIndex({ length: 3, currentIndex: 1, direction: 'next', shuffle: true, repeatMode: 'off', random: () => 0 }), 0);
  assert.equal(getQueueIndex({ length: 3, currentIndex: 1, direction: 'next', shuffle: true, repeatMode: 'off', random: () => .99 }), 2);
});
