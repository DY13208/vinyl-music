import React from 'react';
import { Search } from 'lucide-react';
import { Album } from '../types';
import { VinylShelfHero } from '../components/VinylShelfHero';

interface HomeViewProps {
  albums: Album[];
  carouselIndex: number;
  onSelectCarouselIndex: (index: number) => void;
  onOpenAlbumDetail: (album: Album) => void;
  onOpenSearch: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ albums, carouselIndex, onSelectCarouselIndex, onOpenAlbumDetail, onOpenSearch }) => {
  const currentAlbum = albums[carouselIndex] ?? albums[0];
  return (
    <main id="home-view" className="home-gallery" aria-label="黑胶唱片展示架" style={{ '--album-ambient': currentAlbum?.color || '#42372f' } as React.CSSProperties}>
      <div className="home-gallery__room" aria-hidden="true" />
      <header className="home-gallery__header">
        <button id="home-search-btn" type="button" onClick={onOpenSearch} className="home-gallery__search" aria-label="搜索唱片" title="搜索">
          <Search aria-hidden="true" strokeWidth={1.8} />
        </button>
      </header>
      <section className="home-gallery__stage" aria-roledescription="carousel">
        <VinylShelfHero albums={albums} currentIndex={carouselIndex} onSelectIndex={onSelectCarouselIndex} onOpenAlbumDetail={onOpenAlbumDetail} />
        {currentAlbum && (
          <div className="home-gallery__caption" aria-live="polite">
            <h1>{currentAlbum.title}</h1>
            <p>{currentAlbum.artist}</p>
          </div>
        )}
      </section>
    </main>
  );
};
