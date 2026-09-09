import React from 'react';
import { Album } from '../types';

interface AlbumMetaProps {
  album: Album;
  onClick?: () => void;
  className?: string;
}

export const AlbumMeta: React.FC<AlbumMetaProps> = ({
  album,
  onClick,
  className = '',
}) => {
  const trackCount = album.trackCount || album.tracks?.length || 10;

  return (
    <div
      className={`w-full flex flex-col items-center text-center px-4 select-none ${className}`}
      onClick={onClick}
    >
      {/* Album Title (White, bold, 20~22px, centered, max 2 lines) */}
      <h2 className="text-[21px] font-bold text-white tracking-tight leading-snug line-clamp-2 max-w-[90%] drop-shadow-sm">
        {album.title}
      </h2>

      {/* Artist Name (14~15px, #BBCBB2, centered) */}
      <p className="text-[14.5px] font-medium text-[#BBCBB2] tracking-normal mt-1">
        {album.artist}
      </p>

      {/* Very subtle meta info: 1973 · 摇滚 · 10首 (11~12px, #6B6B78) */}
      <p className="text-[11.5px] font-medium text-[#6B6B78] tracking-tight mt-1">
        {album.year} · {album.genre} · {trackCount}首
      </p>
    </div>
  );
};
