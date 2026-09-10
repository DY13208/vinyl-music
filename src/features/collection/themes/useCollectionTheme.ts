import { useState } from 'react';
import { storageService } from '../../../platform/platformService';
import { CollectionThemeId, CollectionViewMode } from './CollectionTheme';
import { COLLECTION_THEME_KEY, COLLECTION_VIEW_KEY, readCollectionTheme, readCollectionViewMode } from './collectionThemePreference';

export function useCollectionTheme() {
  const [themeId, updateTheme] = useState(() => readCollectionTheme(storageService));
  const [viewMode, updateViewMode] = useState(() => readCollectionViewMode(storageService));
  const [message, setMessage] = useState('');
  const [viewMessage, setViewMessage] = useState('');
  const setTheme = (next: CollectionThemeId) => {
    updateTheme(next);
    try { storageService.setItem(COLLECTION_THEME_KEY, next); setMessage(''); }
    catch { setMessage('主题已切换，暂时无法保存到此设备。'); }
  };
  const setViewMode = (next: CollectionViewMode) => {
    updateViewMode(next);
    try { storageService.setItem(COLLECTION_VIEW_KEY, next); setViewMessage(''); }
    catch { setViewMessage('布局已切换，暂时无法保存到此设备。'); }
  };
  return { themeId, setTheme, viewMode, setViewMode, message, viewMessage };
}
export type CollectionThemeState = ReturnType<typeof useCollectionTheme>;
