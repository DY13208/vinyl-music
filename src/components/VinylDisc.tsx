import React from 'react';
import { VinylVariant } from '../types';

interface VinylDiscProps {
  coverUrl: string;
  albumTitle: string;
  artistName?: string;
  isPlaying?: boolean;
  size?: number | string;
  rpm?: string;
  showAmbientGlow?: boolean;
  className?: string;
  useTextureAsset?: boolean;
  labelColor?: string;
  vinylVariant?: VinylVariant;
  vinylColors?: string[];
}

export const VinylDisc: React.FC<VinylDiscProps> = ({
  coverUrl,
  albumTitle,
  artistName,
  isPlaying = false,
  size = 256,
  rpm = '33 ⅓ RPM',
  showAmbientGlow = false,
  className = '',
  useTextureAsset = false,
  labelColor = '#303034',
  vinylVariant = 'black',
  vinylColors = [],
}) => {
  // Center circular label diameter: ~36% of vinyl diameter
  const labelSize = typeof size === 'number' ? `${Math.round(size * 0.34)}px` : `calc(${size} * 0.34)`;

  return (
    <div
      className={`relative rounded-full select-none flex items-center justify-center flex-shrink-0 ${
        showAmbientGlow ? 'vinyl-ambient-glow' : ''
      } ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: vinylVariant === 'clear' ? 'rgba(120, 130, 132, .22)' : '#09090B',
        boxShadow:
          '0 18px 45px rgba(0, 0, 0, 0.98), 0 6px 16px rgba(0, 0, 0, 0.85), inset 0 0 2px rgba(255, 255, 255, 0.18)',
        border: '1px solid #1c1c20',
      }}
    >
      {/* Spinning vinyl body */}
      <div
        className={`w-full h-full rounded-full relative overflow-hidden flex items-center justify-center ${
          isPlaying ? 'animate-vinyl-spin' : ''
        }`}
        style={{
          transition: 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {useTextureAsset ? (
          <>
            <div className={`vinyl-surface vinyl-surface--${vinylVariant}`} style={{ '--vinyl-a': vinylColors[0] || labelColor, '--vinyl-b': vinylColors[1] || '#b9b0a8', '--vinyl-c': vinylColors[2] || '#26262a', '--picture-url': `url(${coverUrl})` } as React.CSSProperties} />
            <img src="/assets/vinyl/vinyl-texture.webp" alt="" className={`vinyl-texture-base vinyl-texture-base--${vinylVariant}`} draggable={false} />
          </>
        ) : (
          <div className="absolute inset-0 rounded-full vinyl-grooves pointer-events-none" />
        )}

        {!useTextureAsset && <div className="absolute inset-0 rounded-full vinyl-reflection pointer-events-none" />}

        {/* Center Circular Vinyl Label (Strictly Circular, NOT a square image!) */}
        <div
          className="absolute z-10 rounded-full overflow-hidden select-none flex items-center justify-center"
          style={{
            width: labelSize,
            height: labelSize,
            backgroundColor: labelColor,
            boxShadow:
              '0 0 0 1px rgba(255, 255, 255, 0.15), inset 0 0 8px rgba(0, 0, 0, 0.9)',
          }}
        >
          {!useTextureAsset && <img src={coverUrl} alt={albumTitle} className="absolute inset-0 w-full h-full object-cover rounded-full" loading="eager" referrerPolicy="no-referrer" />}
          {!useTextureAsset && <div className="absolute inset-0 rounded-full bg-gradient-to-b from-black/55 via-black/40 to-black/65" />}

          {/* Printed Label Information Overlay */}
          <div className={`relative z-10 w-full h-full rounded-full flex flex-col items-center justify-between p-2 pointer-events-none text-center ${useTextureAsset ? 'vinyl-label--minimal' : ''}`}>
            {/* Top Arc Micro Label: RPM / Stereo */}
            {!useTextureAsset && <span className="text-[6.5px] font-mono tracking-widest text-[#BBCBB2] uppercase scale-90 pt-0.5">{rpm} · STEREO</span>}

            {/* Center Spindle Hole Structure */}
            <div className="relative flex items-center justify-center">
              {/* Concentric metal spindle ring */}
              <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
                {/* Center spindle hole */}
                <div className="w-2.5 h-2.5 rounded-full bg-[#000000] border border-white/40 shadow-inner" />
              </div>
            </div>

            {/* Bottom Label Text: Album & Artist */}
            {!useTextureAsset && <div className="w-full pb-0.5 flex flex-col items-center">
              <span className="text-[7.5px] font-bold text-white leading-none line-clamp-1 max-w-[82%] drop-shadow-sm">
                {albumTitle}
              </span>
              {artistName && (
                <span className="text-[6px] font-medium text-[#BBCBB2] leading-none line-clamp-1 max-w-[80%] mt-0.5">
                  {artistName}
                </span>
              )}
            </div>}
          </div>

          {/* Micro Inner Label Rim Ring */}
          <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
