import { useState } from 'react';
import { storageService } from '../../../platform/platformService';
import type { AlbumDetailThemeId } from './AlbumDetailTheme';
import { ALBUM_DETAIL_THEME_KEY, readAlbumDetailTheme } from './albumDetailThemePreference';

export function useAlbumDetailTheme() {
  const [themeId, updateTheme] = useState(() => readAlbumDetailTheme(storageService));
  const [message, setMessage] = useState('');

  const setTheme = (next: AlbumDetailThemeId) => {
    updateTheme(next);
    try {
      storageService.setItem(ALBUM_DETAIL_THEME_KEY, next);
      setMessage('');
    } catch {
      setMessage('主题已切换，暂时无法保存到此设备。');
    }
  };

  return { themeId, setTheme, message };
}

export type AlbumDetailThemePreference = ReturnType<typeof useAlbumDetailTheme>;
