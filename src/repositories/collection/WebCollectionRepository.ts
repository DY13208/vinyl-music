import type { StorageService } from '../../platform/storage/StorageService';
import type { Album } from '../../types';
import type { CollectionRepository } from './CollectionRepository';

const STORAGE_KEY = 'vinyl_user_collection';

export class WebCollectionRepository implements CollectionRepository {
  public constructor(private readonly storage: StorageService, private readonly defaults: Album[]) {}

  public getAlbums(): Album[] {
    try {
      const saved = this.storage.getItem(STORAGE_KEY);
      if (!saved) return this.defaults;
      const parsed = JSON.parse(saved) as unknown;
      if (!Array.isArray(parsed) || !parsed.length) return this.defaults;
      return parsed.map((album: Album) => {
        const catalogAlbum = this.defaults.find(item => item.id === album.id);
        return album.vinylVariant || !catalogAlbum ? album : { ...album, vinylVariant: catalogAlbum.vinylVariant, vinylColors: catalogAlbum.vinylColors };
      });
    } catch (error) {
      console.error('Failed to load saved collection', error);
      return this.defaults;
    }
  }

  public saveAlbum(album: Album): Album[] {
    const current = this.getAlbums();
    return this.commit([album, ...current.filter(item => item.id !== album.id)]);
  }

  public saveAlbums(albums: Album[]): Album[] {
    const current = this.getAlbums();
    const existingIds = new Set(current.map(item => item.id));
    const existingTitles = new Set(current.map(item => item.title.toLocaleLowerCase().trim()));
    const additions = albums.filter(item => !existingIds.has(item.id) && !existingTitles.has(item.title.toLocaleLowerCase().trim()));
    return this.commit([...additions, ...current]);
  }

  public updateAlbum(album: Album): Album[] {
    const current = this.getAlbums();
    return this.commit(current.map(item => item.id === album.id ? album : item));
  }

  public deleteAlbum(albumId: string): Album[] {
    return this.commit(this.getAlbums().filter(item => item.id !== albumId));
  }

  private commit(albums: Album[]): Album[] {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(albums));
    return albums;
  }
}
