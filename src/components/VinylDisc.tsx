import React from 'react';

interface VinylDiscProps {
  coverUrl: string;
  albumTitle: string;
  artistName: string;
  isPlaying?: boolean;
  size?: number; // size in px
  showAmbientGlow?: boolean;
  className?: string;
  rpm?: string;
}

export const VinylDisc: React.FC<VinylDiscProps> = ({
  coverUrl,
  albumTitle,
  artistName,
  isPlaying = false,
  size = 280,
  showAmbientGlow = true,
  className = '',
  rpm = '33 ⅓ RPM',
}) => {
  return (
    <div
      className={`relative rounded-full select-none flex items-center justify-center ${
        showAmbientGlow ? 'vinyl-ambient-glow' : ''
      } ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: '#09090A',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85), inset 0 0 4px rgba(255, 255, 255, 0.12)',
        border: '1px solid #1c1c1f',
      }}
    >
      {/* Spinning disc body */}
      <div
        className={`w-full h-full rounded-full relative overflow-hidden flex items-center justify-center ${
          isPlaying ? 'animate-vinyl-spin' : ''
        }`}
        style={{
          transition: 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Concentric grooved rings (Realistic vinyl record grooves) */}
        <div className="absolute inset-0 rounded-full vinyl-grooves pointer-events-none" />

        {/* Lead-in groove outer band */}
        <div className="absolute inset-[3%] rounded-full border border-white/[0.04] pointer-events-none" />
        <div className="absolute inset-[7%] rounded-full border border-white/[0.03] pointer-events-none" />

        {/* Dead-wax gaps between tracks */}
        <div className="absolute inset-[18%] rounded-full border border-white/[0.06] pointer-events-none" />
        <div className="absolute inset-[27%] rounded-full border border-white/[0.04] pointer-events-none" />
        <div className="absolute inset-[33%] rounded-full border border-white/[0.05] pointer-events-none" />

        {/* Dynamic vinyl specular sheen / light reflections */}
        <div className="absolute inset-0 rounded-full vinyl-reflection pointer-events-none" />

        {/* Run-out matrix groove area */}
        <div
          className="absolute rounded-full border border-white/[0.05] pointer-events-none flex items-center justify-center"
          style={{ width: '42%', height: '42%', backgroundColor: '#070708' }}
        >
          {/* Engraved run-out matrix code text */}
          <span className="text-[6px] tracking-widest text-white/10 uppercase select-none font-mono">
            SHVL 804 • MTRX A
          </span>
        </div>

        {/* Center Paper Label */}
        <div
          className="absolute rounded-full overflow-hidden flex flex-col items-center justify-center text-center p-2 shadow-inner"
          style={{
            width: '32%',
            height: '32%',
            backgroundColor: '#0F0F10',
            border: '1.5px solid #26272D',
          }}
        >
          {/* Faint album artwork texture on center label */}
          <img
            src={coverUrl}
            alt={albumTitle}
            className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-[0.5px]"
          />
          <div className="absolute inset-0 bg-black/60" />

          {/* Center label typography */}
          <div className="relative z-10 flex flex-col items-center justify-center px-1">
            {/* Tiny #2FE92B indicator dot & vinyl brand mark */}
            <div className="flex items-center gap-1 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2FE92B] inline-block shadow-[0_0_6px_#2FE92B]" />
              <span className="text-[7px] font-bold tracking-widest text-[#2FE92B] uppercase">VINYL</span>
            </div>

            <p className="text-[8px] font-medium text-white/90 line-clamp-1 leading-tight max-w-[70px]">
              {albumTitle}
            </p>
            <p className="text-[6.5px] text-[#BBCBB2] line-clamp-1 max-w-[65px] leading-tight opacity-75">
              {artistName}
            </p>

            <span className="text-[5.5px] tracking-wider text-white/40 mt-0.5 uppercase font-mono">
              {rpm} • STEREO
            </span>
          </div>

          {/* Center spindle hole (metallic ring with void) */}
          <div
            className="absolute z-20 rounded-full bg-black border border-white/40 shadow-sm"
            style={{ width: 10, height: 10 }}
          />
        </div>
      </div>
    </div>
  );
};
