import { useState } from 'react';
import { Album } from '../types';
import { storageService } from '../platform/platformService';

export type BrowseMode = 'default' | 'grid' | 'spine';
export interface BrowseState {
  mode: BrowseMode;
  selectedAlbumId: string | null;
  selectAlbum: (id: string) => void;
  setMode: (mode: BrowseMode) => void;
  message: string;
}
const KEY = 'vinyl_landscape_browse_v1';

export function useAlbumBrowserState(albums: readonly Album[]): BrowseState {
  const [selectedId, selectAlbum] = useState<string | null>(albums[0]?.id ?? null);
  const [mode, updateMode] = useState<BrowseMode>(() => {
    try { return ['wall', 'grid'].includes(storageService.getItem(KEY) || '') ? 'grid' : 'spine'; }
    catch { return 'spine'; }
  });
  const [message, setMessage] = useState('');
  const selectedAlbumId = albums.some(album => album.id === selectedId) ? selectedId : albums[0]?.id ?? null;
  const setMode = (next: BrowseMode) => {
    updateMode(next);
    try { storageService.setItem(KEY, next); setMessage(''); }
    catch { setMessage('视图已切换，暂时无法记住此偏好。'); }
  };
  return { mode, setMode, selectedAlbumId, selectAlbum, message };
}
