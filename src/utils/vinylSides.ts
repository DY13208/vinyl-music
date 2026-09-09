import { Album, Track, VinylRecord } from '../types';

export const durationOf = (tracks: Track[]) => {
  const seconds = tracks.reduce((sum, track) => sum + track.durationSec, 0);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

/** Explicit pressing data wins. Legacy digital imports get a reversible display split. */
export const getAlbumDiscs = (album: Album): VinylRecord[] => {
  if (album.discs?.some(disc => disc.sides.length)) return album.discs.filter(disc => disc.sides.length);
  const midpoint = Math.ceil(album.tracks.length / 2);
  return [{ disc: 1, sides: [
    { side: 'A', tracks: album.tracks.slice(0, midpoint) },
    { side: 'B', tracks: album.tracks.slice(midpoint) },
  ] }];
};

/** Playback-only value; never persists a partial track set to the collection. */
export const albumForSide = (album: Album, tracks: Track[]): Album => ({
  ...album, discs: getAlbumDiscs(album), tracks, trackCount: tracks.length, totalDuration: durationOf(tracks),
});
