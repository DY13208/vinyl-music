import { Album } from '../../types';
import type { ReactNode } from 'react';
export interface AlbumLayoutProps {
  albums: readonly Album[];
  selectedAlbumId: string | null;
  onSelectAlbum: (id: string) => void;
  onOpenAlbumDetail: (album: Album) => void;
  renderArtwork?: (album: Album) => ReactNode;
}
