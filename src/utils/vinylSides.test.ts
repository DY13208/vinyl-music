import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Album, Track } from '../types';
import { albumForSide, durationOf, getAlbumDiscs } from './vinylSides';
import { resolveTexture } from './vinylAppearance';

const tracks: Track[] = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, title: `Track ${i}`, number: i + 1, duration: '3:01', durationSec: 181 }));
const album = { id: 'test', tracks, trackCount: 5, totalDuration: '15:05' } as Album;

test('legacy split preserves order, track identity and every track exactly once', () => {
  const sides = getAlbumDiscs(album)[0].sides;
  assert.deepEqual(sides.map(side => side.side), ['A', 'B']);
  assert.deepEqual(sides.map(side => side.tracks.length), [3, 2]);
  assert.deepEqual(sides.flatMap(side => side.tracks), tracks);
  assert.equal(sides[0].tracks[0], tracks[0]);
  assert.equal(durationOf(sides[0].tracks), '9:03');
  assert.equal(durationOf(sides[1].tracks), '6:02');
});

test('explicit multi-LP sides C/D/E/F retain pressing sequence and uneven track allocation', () => {
  const pressing = [{ disc: 1, sides: [{ side: 'A', tracks: tracks.slice(0, 2) }, { side: 'B', tracks: tracks.slice(2, 3) }] },
    { disc: 2, sides: [{ side: 'C', tracks: tracks.slice(3, 4) }, { side: 'D', tracks: tracks.slice(4) }] },
    { disc: 3, sides: [{ side: 'E', tracks: [] }, { side: 'F', tracks: [] }] }];
  assert.deepEqual(getAlbumDiscs({ ...album, discs: pressing }), pressing);
});

test('side playback cannot mutate the collection album or track numbers', () => {
  const original = structuredClone(album);
  Object.freeze(album.tracks);
  const sideAlbum = albumForSide(album, tracks.slice(3));
  assert.deepEqual(album, original);
  assert.equal(sideAlbum.id, album.id);
  assert.deepEqual(sideAlbum.tracks.map(track => track.number), [4, 5]);
  assert.equal(sideAlbum.trackCount, 2);
  assert.equal(sideAlbum.totalDuration, '6:02');
  assert.deepEqual(getAlbumDiscs(sideAlbum), getAlbumDiscs(album));
  assert.equal(sideAlbum.discs?.[0].sides[1].tracks[0].id, 't3');
});

test('empty imports keep selectable empty sides with a zero duration', () => {
  assert.equal(durationOf([]), '0:00');
  assert.equal(getAlbumDiscs({ ...album, tracks: [], discs: [] })[0].sides.length, 2);
});

test('explicit textures win; absent or unrecognised texture paths use safe defaults', () => {
  assert.equal(resolveTexture(), 'black');
  assert.equal(resolveTexture('marbled', 'marbled-02'), 'marbled-02');
  assert.equal(resolveTexture('black', '../../other'), 'black');
  assert.equal(resolveTexture('liquid'), 'liquid-01');
  assert.equal(resolveTexture('colored', undefined, '#ff2222'), 'red');
  assert.equal(resolveTexture('colored', undefined, '#2222ff'), 'blue');
});
