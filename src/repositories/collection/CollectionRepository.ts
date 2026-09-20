import type { Album } from '../../types';

/** Local-first collection contract. UI code must not depend on a concrete storage backend. */
export interface CollectionRepository {
  whenReady?: () => Promise<void>;
  getAlbums(): Album[];
  saveAlbum(album: Album): Album[] | Promise<Album[]>;
  saveAlbums(albums: Album[]): Album[] | Promise<Album[]>;
  updateAlbum(album: Album): Album[] | Promise<Album[]>;
  deleteAlbum(albumId: string): Album[] | Promise<Album[]>;
}
