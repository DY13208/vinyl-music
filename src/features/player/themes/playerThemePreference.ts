import type { StorageService } from '../../../platform/storage/StorageService';
import type { PlayerThemeId } from './PlayerTheme';
export const PLAYER_THEME_KEY = 'player_theme';
export const PLAYER_THEME_IDS: readonly PlayerThemeId[] = ['crescent', 'halo', 'nocturne', 'classic'];
export function readPlayerTheme(storage: StorageService): PlayerThemeId {
  try {
    const value = storage.getItem(PLAYER_THEME_KEY);
    return PLAYER_THEME_IDS.includes(value as PlayerThemeId) ? value as PlayerThemeId : 'crescent';
  } catch { return 'crescent'; }
}
