import type { ComponentType, CSSProperties, ReactNode } from 'react';
import type { Album } from '../../../types';

export type CollectionThemeId = 'shelf' | 'editorial' | 'cinematic' | 'glass' | 'cover-wall';
export type CollectionViewMode = 'default' | 'gallery-grid' | 'spine-carousel';
export type CollectionTokens = CSSProperties & Record<`--collection-${string}`, string>;
export type CollectionCardVariant = 'sleeve' | 'cover';
export interface CollectionPresentationProps {
  albums: readonly Album[];
  selectedAlbumId: string | null;
  favoriteIds: readonly string[];
  onOpenAlbumDetail: (album: Album) => void;
  onToggleFavorite: (id: string) => void;
  onSelectAlbum?: (id: string) => void;
  cardVariant: CollectionCardVariant;
}
export interface CollectionTheme {
  id: CollectionThemeId;
  name: string;
  description: string;
  layout: 'cabinet' | 'featured' | 'cinema' | 'grid';
  backgroundTreatment: 'wood' | 'solid' | 'photographic' | 'glass';
  cardVariant: CollectionCardVariant;
  headerVariant: 'shelf' | 'editorial' | 'cinematic' | 'glass' | 'cover-wall';
  coversOnly?: boolean;
  tokens: CollectionTokens;
  Presentation: ComponentType<CollectionPresentationProps>;
  Header: ComponentType<{ children: ReactNode }>;
}
