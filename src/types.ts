export interface Track {
  id: string;
  number: number;
  title: string;
  duration: string;
  durationSec: number;
  composer?: string;
}

export interface LyricLine {
  id: string;
  time: number; // timestamp in seconds
  text: string; // original line text
  translation?: string; // localized / Chinese translation
}

export type VinylVariant = 'black' | 'colored' | 'clear' | 'translucent' | 'marble' | 'splatter' | 'split' | 'liquid' | 'picture';

export type VinylType = VinylVariant | 'marbled' | 'red' | 'blue' | 'green' | 'orange' | 'white';

export interface VinylLabel {
  image?: string; // 唱片中心标签图片 (e.g. "/labels/album-a.webp")
  color?: string; // 标签背景色 (e.g. "#d8c9a7")
  text?: string; // 标签文字 (备用，无图片时使用)
}

export interface VinylSide {
  side: string; // 'A', 'B', 'C', 'D', etc.
  tracks: Track[];
  labelImage?: string; // 该面的唱片中心标签图片
  labelColor?: string; // 该面的标签背景色
}

export interface VinylRecord {
  disc: number;
  sides: VinylSide[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  year: number;
  genre: string;
  coverUrl: string; // 专辑封套图片，不用作标签
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
  condition?: string; // e.g. "Mint (M)", "Near Mint (NM)"
  waxColor?: string; // e.g. "经典纯黑", "炫彩泼墨", "发烧透明"
  vinylVariant?: VinylVariant;
  vinylColors?: string[];
  vinylType?: VinylType;
  vinylTexture?: string;
  vinylColor?: string;
  vinylSecondaryColor?: string;
  vinylLabel?: VinylLabel;
  discs?: VinylRecord[];
  addedAt?: string;
  barcode?: string;
  catalogNumber?: string;
  country?: string;
  pressingPlant?: string;
  sleeveCondition?: string;
  collectionTags?: string[];
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
