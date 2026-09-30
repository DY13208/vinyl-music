import type { StorageService } from '../../../platform/storage/StorageService';
import type { AlbumDetailThemeId } from './AlbumDetailTheme';

export const ALBUM_DETAIL_THEME_KEY = 'vinyl_album_detail_theme_v1';
const themeIds: readonly AlbumDetailThemeId[] = ['archive', 'cover-notes', 'holo-card'];

export function readAlbumDetailTheme(storage: StorageService): AlbumDetailThemeId {
  try {
    const value = storage.getItem(ALBUM_DETAIL_THEME_KEY);
    return themeIds.includes(value as AlbumDetailThemeId) ? value as AlbumDetailThemeId : 'archive';
  } catch {
    return 'archive';
  }
}
