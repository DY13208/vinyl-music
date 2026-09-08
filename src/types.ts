export interface Track {
  id: string;
  number: number;
  title: string;
  duration: string;
  durationSec: number;
  composer?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  year: number;
  genre: string;
  coverUrl: string;
  label: string;
  rpm: '33 ⅓ RPM' | '45 RPM' | string;
  weight: string; // e.g. "180g Heavyweight"
  edition: string; // e.g. "首版限量黑胶", "50周年重制版"
  matrixCode: string; // e.g. "SHVL 804 A-2"
  price?: number;
  trackCount: number;
  totalDuration: string;
  description: string;
  color: string; // Subtle ambient tone
  tracks: Track[];
  isCollected?: boolean;
  isWishlist?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  englishName?: string;
  avatarUrl: string;
  bannerUrl: string;
  followers: string;
  bio: string;
  albumCount: number;
  albums: Album[];
}

export interface WishlistItem {
  id: string;
  album: Album;
  addedDate: string;
  targetPrice: number;
  condition: 'Mint (M)' | 'Near Mint (NM)' | 'Very Good Plus (VG+)';
  pressing: string;
}

export type MainTab = 'home' | 'collection' | 'discover' | 'profile';

export type ScreenId =
  | 'home'
  | 'collection'
  | 'discover'
  | 'profile'
  | 'player'
  | 'album_detail'
  | 'artist_detail'
  | 'search'
  | 'wishlist'
  | 'settings'
  | 'splash'
  | 'landscape'
  | 'design_board';

export type DevicePlatform = 'ios' | 'android';
