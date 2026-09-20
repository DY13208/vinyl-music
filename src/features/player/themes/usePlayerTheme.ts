import { useState } from 'react';
import { storageService } from '../../../platform/platformService';
import { PLAYER_THEME_KEY, readPlayerTheme } from './playerThemePreference';
import type { PlayerThemeId } from './PlayerTheme';
export function usePlayerTheme() {
  const [themeId, setThemeId] = useState(() => readPlayerTheme(storageService));
  const [message, setMessage] = useState('');
  const setTheme = (next: PlayerThemeId) => {
    setThemeId(next);
    try { storageService.setItem(PLAYER_THEME_KEY, next); setMessage(''); }
    catch { setMessage('样式已切换，暂时无法保存到此设备。'); }
  };
  return { themeId, setTheme, message };
}
export type PlayerThemePreference = ReturnType<typeof usePlayerTheme>;
