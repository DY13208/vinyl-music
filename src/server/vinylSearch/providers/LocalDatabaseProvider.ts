import { ALBUMS } from '../../../data/mockData.js';
import type { Album } from '../../../types.js';
import type { ProviderAlbum, ProviderAvailability, VinylSearchProvider } from '../types.js';
import { logProviderHits } from '../http.js';
import { normalizeBarcode, normalizeText } from '../utils.js';

export class LocalDatabaseProvider implements VinylSearchProvider {
  public readonly id = 'local' as const;
  public readonly role = 'local' as const;
  public readonly priority = 1;

  public constructor(private readonly albums: Album[] = ALBUMS) {}

  public availability(): ProviderAvailability { return { available: true }; }

  public async search(query: string): Promise<ProviderAlbum[]> {
    const started = Date.now();
    const terms = query.split(/\s[-–—]\s|\s+/).map(normalizeText).filter(Boolean);
    const matches = this.albums.filter(album => {
      const haystack = normalizeText(`${album.artist} ${album.title}`);
      return terms.every(term => haystack.includes(term));
    }).map(album => this.map(album));
    logProviderHits(this.id, 'search', matches.length, started);
    return matches;
  }

  public async searchByBarcode(barcode: string): Promise<ProviderAlbum[]> {
    const started = Date.now();
    const normalized = normalizeBarcode(barcode);
    const matches = this.albums.filter(album => normalizeBarcode(album.barcode) === normalized).map(album => this.map(album));
    logProviderHits(this.id, 'searchByBarcode', matches.length, started);
    return matches;
  }

  public async getAlbum(id: string): Promise<ProviderAlbum | null> {
    const album = this.albums.find(item => item.id === id);
    return album ? this.map(album) : null;
  }

  private map(album: Album): ProviderAlbum {
    return {
      provider: this.id,
      providerId: album.id,
      role: this.role,
      title: album.title,
      artist: album.artist,
      year: album.year,
      releaseDate: `${album.year}-01-01`,
      coverUrl: album.coverUrl,
      genres: album.genre.split(' · '),
      label: album.label,
      barcode: album.barcode,
      catalogNumber: album.catalogNumber,
      country: album.country,
      formats: [album.rpm, album.edition],
      rpm: album.rpm,
      edition: album.edition,
      matrixCode: album.matrixCode,
      tracks: album.tracks,
      discs: album.discs,
      isVinylRelease: false,
    };
  }
}
