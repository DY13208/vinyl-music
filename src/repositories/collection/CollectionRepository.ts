import type { Album } from '../../types';

/** Local-first collection contract. UI code must not depend on a concrete storage backend. */
export interface CollectionRepository {
  getAlbums(): Album[];
  saveAlbum(album: Album): Album[];
  saveAlbums(albums: Album[]): Album[];
  updateAlbum(album: Album): Album[];
  deleteAlbum(albumId: string): Album[];
}
