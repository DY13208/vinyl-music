import type { StorageService } from '../../../platform/storage/StorageService';
import type { CollectionThemeId, CollectionViewMode } from './CollectionTheme';

export const COLLECTION_THEME_KEY = 'collection_theme';
export const COLLECTION_VIEW_KEY = 'collection_view_mode';
const themes: readonly CollectionThemeId[] = ['shelf', 'editorial', 'cinematic', 'glass', 'cover-wall'];
const modes: readonly CollectionViewMode[] = ['default', 'gallery-grid', 'spine-carousel'];
export function readCollectionTheme(storage: StorageService): CollectionThemeId {
  try { const value = storage.getItem(COLLECTION_THEME_KEY); return themes.includes(value as CollectionThemeId) ? value as CollectionThemeId : 'shelf'; }
  catch { return 'shelf'; }
}
export function readCollectionViewMode(storage: StorageService): CollectionViewMode {
  try { const value = storage.getItem(COLLECTION_VIEW_KEY); return modes.includes(value as CollectionViewMode) ? value as CollectionViewMode : 'default'; }
  catch { return 'default'; }
}
