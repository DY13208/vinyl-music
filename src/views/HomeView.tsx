import React from 'react';
import { Album } from '../types';
import { Search } from 'lucide-react';
import { VinylShelfHero } from '../components/VinylShelfHero';
import { AlbumMeta } from '../components/AlbumMeta';
import { PlaybackWaveform } from '../components/PlaybackWaveform';
import { PlaybackControls } from '../components/PlaybackControls';

interface HomeViewProps {
  albums: Album[];
  carouselIndex: number;
  onSelectCarouselIndex: (index: number) => void;
  isPlaying: boolean;
  currentTrackTitle?: string;
  progressPercent?: number;
  onTogglePlayAlbum: (album: Album) => void;
  onOpenAlbumDetail: (album: Album) => void;
  onOpenSearch: () => void;
  onToggleFavorite: (albumId: string) => void;
  favorites: string[];
  onNextTrack?: () => void;
  onSeek?: (percent: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  albums,
  carouselIndex,
  onSelectCarouselIndex,
  isPlaying,
  progressPercent = 0,
  onTogglePlayAlbum,
  onOpenAlbumDetail,
  onOpenSearch,
  onToggleFavorite,
  favorites,
  onNextTrack,
  onSeek,
}) => {
  const currentAlbum = albums[carouselIndex] || albums[0];
  const isCurrentFavorite = favorites.includes(currentAlbum?.id);

  const handleNext = () => {
    if (onNextTrack) {
      onNextTrack();
    } else if (carouselIndex < albums.length - 1) {
      onSelectCarouselIndex(carouselIndex + 1);
    } else {
      onSelectCarouselIndex(0);
    }
  };

  return (
    <div
      id="home-view"
      className="w-full h-full flex flex-col justify-between bg-[#000000] text-white select-none overflow-hidden px-5 pt-5 pb-3"
    >
      {/* 1. Top Greeting & Search Section (~13%) */}
      <header className="w-full flex items-start justify-between flex-shrink-0 pt-0.5">
        <div className="flex flex-col">
          <h1 className="text-[28px] sm:text-[31px] font-extrabold text-white tracking-tight leading-[1.14]">
            早上好，
          </h1>
          <h1 className="text-[28px] sm:text-[31px] font-extrabold text-white tracking-tight leading-[1.14] mt-0.5">
            今天想听哪一张？
          </h1>
        </div>

        {/* 44~48px Circular Search Button (#111115 bg, #26272D border, white icon) */}
        <button
          id="home-search-btn"
          type="button"
          onClick={onOpenSearch}
          className="w-11 h-11 rounded-full bg-[#111115] border border-[#26272D] text-white hover:text-white/90 active:scale-95 flex items-center justify-center transition-all flex-shrink-0 mt-0.5"
          title="搜索"
        >
          <Search className="w-5 h-5 text-white" />
        </button>
      </header>

      {/* 2. Vinyl Shelf Carousel (~42%): Real Sleeve + Real Circular Vinyl Disc Ensemble */}
      <div className="w-full flex items-center justify-center flex-shrink-0 my-auto py-1">
        <VinylShelfHero
          albums={albums}
          currentIndex={carouselIndex}
          onSelectIndex={onSelectCarouselIndex}
          isPlaying={isPlaying}
          onOpenAlbumDetail={onOpenAlbumDetail}
        />
      </div>

      {/* 3. Album Meta Information (~11%): Title, Artist, Subtle Meta Line */}
      <div className="w-full flex-shrink-0">
        <AlbumMeta
          album={currentAlbum}
          onClick={() => onOpenAlbumDetail(currentAlbum)}
        />
      </div>

      {/* 4. Playback Waveform & Index (~8%): Width ~58%, #2A2A2C / #2FE92B, 03 / 12 */}
      <div className="w-full flex-shrink-0 mt-1">
        <PlaybackWaveform
          progressPercent={progressPercent}
          currentIndex={carouselIndex}
          totalCount={albums.length}
          onSeek={onSeek}
        />
      </div>

      {/* 5. Playback Controls (~11%): Heart (left) + 60px Circular #2FE92B Play (center) + Next (right) */}
      <div className="w-full flex-shrink-0 mb-1">
        <PlaybackControls
          isPlaying={isPlaying}
          isFavorite={isCurrentFavorite}
          onTogglePlay={() => onTogglePlayAlbum(currentAlbum)}
          onToggleFavorite={() => onToggleFavorite(currentAlbum.id)}
          onNextTrack={handleNext}
        />
      </div>
    </div>
  );
};
