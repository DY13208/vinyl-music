import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TrackMatcher } from './TrackMatcher';
import type { MusicTrack, TrackSource } from '../types';

const matcher = new TrackMatcher();
const target: MusicTrack = { id: 'sunny-day', title: '晴天', artist: '周杰伦', album: '叶惠美', duration: 269, trackNumber: 3 };
const score = (candidate: Partial<MusicTrack>) => matcher.score(target, candidate);

test('exact title, artist, album, duration and track number is reliable', () => {
  assert.equal(score({ ...target }).score, 95);
  assert.equal(score({ ...target }).reliable, true);
});

test('same title by another artist never auto-matches', () => {
  assert.equal(score({ title: '晴天', artist: '其他歌手', album: '叶惠美', duration: 269 }).reliable, false);
});

for (const version of ['Live Version', 'Cover', 'Remix']) {
  test(`original does not auto-match ${version}`, () => {
    assert.equal(score({ title: `晴天 (${version})`, artist: '周杰伦', album: '叶惠美', duration: 269 }).reliable, false);
  });
}

test('same song on a different album can still be reliable with matching duration', () => {
  assert.equal(score({ title: '晴天', artist: '周杰伦', album: '精选集', duration: 270 }).reliable, true);
});

test('large duration mismatch is not automatically accepted without album evidence', () => {
  assert.equal(score({ title: '晴天', artist: '周杰伦', album: '其他', duration: 400 }).reliable, false);
});

test('matching ISRC is a strong match', () => {
  const withIsrc = { ...target, isrc: 'TW-A53-03-00001' };
  assert.equal(matcher.score(withIsrc, { title: '晴天', artist: '周杰伦', isrc: 'TW-A53-03-00001' }).reliable, true);
});

test('Chinese version keyword is penalized', () => {
  assert.equal(score({ title: '晴天 现场版', artist: '周杰伦', album: '叶惠美', duration: 269 }).reliable, false);
});

test('explicit user verification always wins over automatic score', () => {
  const source: TrackSource = { provider: 'local', providerTrackId: 'owned-file', uri: 'local://owned-file', previewOnly: false, verified: true, verificationMethod: 'user', matchScore: 5, metadata: { title: 'unknown' }, createdAt: '2026-09-10T00:00:00.000Z' };
  const verified = matcher.scoreSource(target, source);
  assert.equal(verified.verified, true);
  assert.equal(verified.matchScore, 100);
});
