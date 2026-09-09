import React from 'react';

interface VinylDiscProps {
  coverUrl: string;
  albumTitle: string;
  artistName?: string;
  isPlaying?: boolean;
  size?: number; // Disc diameter in px (e.g. 256px)
  showAmbientGlow?: boolean;
  className?: string;
}

export const VinylDisc: React.FC<VinylDiscProps> = ({
  coverUrl,
  albumTitle,
  artistName,
  isPlaying = false,
  size = 256,
  showAmbientGlow = false,
  className = '',
}) => {
  // Center circular label diameter: ~36% of vinyl diameter
  const labelSize = Math.round(size * 0.36);

  return (
    <div
      className={`relative rounded-full select-none flex items-center justify-center flex-shrink-0 ${
        showAmbientGlow ? 'vinyl-ambient-glow' : ''
      } ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: '#09090B',
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
        {/* Concentric grooved rings (Authentic microscopic sound grooves) */}
        <div className="absolute inset-0 rounded-full vinyl-grooves pointer-events-none" />

        {/* Outer lead-in groove and lip */}
        <div className="absolute inset-[2.5%] rounded-full border border-white/[0.06] pointer-events-none" />
        <div className="absolute inset-[5.5%] rounded-full border border-white/[0.04] pointer-events-none" />

        {/* Mid-track dead-wax gaps */}
        <div className="absolute inset-[15%] rounded-full border border-white/[0.05] pointer-events-none" />
        <div className="absolute inset-[22%] rounded-full border border-white/[0.04] pointer-events-none" />
        <div className="absolute inset-[28%] rounded-full border border-white/[0.06] pointer-events-none" />

        {/* Specular butterfly reflection sheen */}
        <div className="absolute inset-0 rounded-full vinyl-reflection pointer-events-none" />

        {/* Center Circular Vinyl Label (Strictly Circular, NOT a square image!) */}
        <div
          className="absolute z-10 rounded-full overflow-hidden select-none flex items-center justify-center"
          style={{
            width: labelSize,
            height: labelSize,
            backgroundColor: '#18181B',
            boxShadow:
              '0 0 0 1px rgba(255, 255, 255, 0.15), inset 0 0 8px rgba(0, 0, 0, 0.9)',
          }}
        >
          {/* Circular Cropped Artwork Background */}
          <img
            src={coverUrl}
            alt={albumTitle}
            className="absolute inset-0 w-full h-full object-cover rounded-full"
            loading="eager"
            referrerPolicy="no-referrer"
          />

          {/* Dark Radial Vignette & Label Contrast Mask */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-black/55 via-black/40 to-black/65" />

          {/* Printed Label Information Overlay */}
          <div className="relative z-10 w-full h-full rounded-full flex flex-col items-center justify-between p-2 pointer-events-none text-center">
            {/* Top Arc Micro Label: RPM / Stereo */}
            <span className="text-[6.5px] font-mono tracking-widest text-[#BBCBB2] uppercase scale-90 pt-0.5">
              33 ⅓ RPM · STEREO
            </span>

            {/* Center Spindle Hole Structure */}
            <div className="relative flex items-center justify-center">
              {/* Concentric metal spindle ring */}
              <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
                {/* Center spindle hole */}
                <div className="w-2.5 h-2.5 rounded-full bg-[#000000] border border-white/40 shadow-inner" />
              </div>
            </div>

            {/* Bottom Label Text: Album & Artist */}
            <div className="w-full pb-0.5 flex flex-col items-center">
              <span className="text-[7.5px] font-bold text-white leading-none line-clamp-1 max-w-[82%] drop-shadow-sm">
                {albumTitle}
              </span>
              {artistName && (
                <span className="text-[6px] font-medium text-[#BBCBB2] leading-none line-clamp-1 max-w-[80%] mt-0.5">
                  {artistName}
                </span>
              )}
            </div>
          </div>

          {/* Micro Inner Label Rim Ring */}
          <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
