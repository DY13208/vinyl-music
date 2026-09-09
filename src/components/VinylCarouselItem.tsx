import React from 'react';
import { Album } from '../types';
import { AlbumSleeve } from './AlbumSleeve';
import { VinylDisc } from './VinylDisc';

interface VinylCarouselItemProps {
  album: Album;
  isPlaying?: boolean;
  discSize?: number;
  sleeveSize?: number;
  isCenter?: boolean;
}

export const VinylCarouselItem: React.FC<VinylCarouselItemProps> = ({
  album,
  isPlaying = false,
  discSize = 256,
  sleeveSize = 196,
  isCenter = false,
}) => {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{
        width: 320,
        height: discSize + 12,
      }}
    >
      {/* 1. Back Layer: Square Cardboard Album Sleeve (Offset Left) */}
      <div
        className="absolute z-0 flex items-center justify-center transition-transform duration-300"
        style={{
          transform: 'translateX(-32px)',
        }}
      >
        <AlbumSleeve
          coverUrl={album.coverUrl}
          title={album.title}
          artist={album.artist}
          size={sleeveSize}
        />
      </div>

      {/* 2. Front Layer: Real Circular Vinyl Disc (Offset Right, sliding out ~50%) */}
      <div
        className="absolute z-10 flex items-center justify-center transition-transform duration-300"
        style={{
          transform: 'translateX(+34px)',
          filter: 'drop-shadow(-8px 10px 18px rgba(0, 0, 0, 0.75))',
        }}
      >
        <VinylDisc
          coverUrl={album.coverUrl}
          albumTitle={album.title}
          artistName={album.artist}
          isPlaying={isCenter && isPlaying}
          size={discSize}
          showAmbientGlow={isCenter && isPlaying}
        />
      </div>
    </div>
  );
};
