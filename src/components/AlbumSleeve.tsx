import React from 'react';
import { AlbumArtwork } from './AlbumArtwork';

interface AlbumSleeveProps {
  coverUrl: string;
  title: string;
  artist?: string;
  size?: number | string;
  className?: string;
}

export const AlbumSleeve: React.FC<AlbumSleeveProps> = ({
  coverUrl,
  title,
  size = 192,
  className = '',
}) => {
  return (
    <div
      className={`relative select-none flex-shrink-0 rounded-[6px] overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: '#121214',
        boxShadow:
          '0 14px 34px rgba(0, 0, 0, 0.92), 0 4px 12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Front Album Jacket Artwork */}
      <AlbumArtwork src={coverUrl} alt={title} loading="eager" />

      {/* Realistic Left Spine Fold Shadow */}
      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/45 via-black/20 to-transparent pointer-events-none" />

      {/* Cardboard Matte Surface / Print Varnish Sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/10 pointer-events-none" />

      {/* Right Sleeve Mouth / Opening Edge Dark Recess Hint */}
      <div className="absolute inset-y-0 right-0 w-[2px] bg-black/60 shadow-[inset_-1px_0_2px_rgba(0,0,0,0.8)] pointer-events-none" />

      {/* Subtle Outer Cardboard Edge Highlight */}
      <div className="absolute inset-0 rounded-[6px] ring-1 ring-inset ring-white/[0.08] pointer-events-none" />
    </div>
  );
};
