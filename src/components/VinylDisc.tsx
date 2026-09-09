import React from 'react';
import { SideTransitionPhase } from '../hooks/useVinylSideTransition';
import { VinylType, VinylVariant } from '../types';
import { resolveTexture } from '../utils/vinylAppearance';
import './VinylDisc.css';

interface VinylDiscProps {
  coverUrl: string;
  albumTitle: string;
  artistName?: string;
  isPlaying?: boolean;
  rotating?: boolean;
  size?: number | string;
  showAmbientGlow?: boolean;
  className?: string;
  useTextureAsset?: boolean;
  labelColor?: string;
  labelImage?: string;
  labelText?: string;
  vinylVariant?: VinylVariant;
  vinylColors?: string[];
  type?: VinylType;
  texture?: string;
  side?: string;
  rpm?: string;
  transitionPhase?: SideTransitionPhase;
}

export const VinylDisc: React.FC<VinylDiscProps> = ({
  coverUrl, albumTitle, artistName, isPlaying = false, rotating, size = 256,
  className = '', showAmbientGlow = false, labelColor = '#e4decf', labelImage, labelText,
  vinylVariant = 'black', vinylColors = [], type = vinylVariant, texture,
  side = 'A', rpm = '33 ⅓ RPM', transitionPhase = 'idle',
}) => {
  const material = resolveTexture(type, texture, vinylColors[0]);

  return <div className={`vinyl-disc ${showAmbientGlow ? 'vinyl-ambient-glow' : ''} ${className}`} style={{ width: size, height: size }} role="img" aria-label={`${albumTitle} · Side ${side}`} data-texture={material} data-side={side} data-transition={transitionPhase}>
    <div className="vinyl-disc__surface">
      <div className={`vinyl-disc__rotation ${(rotating ?? isPlaying) ? 'is-rotating' : ''}`}>
        {type === 'picture' && <img className="vinyl-disc__picture" src={coverUrl} alt="" draggable={false} referrerPolicy="no-referrer" />}
        <img className="vinyl-disc__texture" src={`/assets/vinyl-textures/${material}.webp`} alt="" draggable={false} decoding="async" onError={event => {
          const img = event.currentTarget;
          if (!img.src.endsWith('/black.webp')) img.src = '/assets/vinyl-textures/black.webp';
        }} />
        <div className="vinyl-disc__label" style={{ backgroundColor: labelColor }} translate="no">
          {labelImage && <img src={labelImage} alt="" draggable={false} className="vinyl-disc__label-image" />}
          <span className="vinyl-disc__label-title">{labelText || albumTitle}</span>
          <strong className="vinyl-disc__side">{side}</strong>
          <span className="vinyl-disc__rpm">{rpm} · STEREO</span>
          <span className="vinyl-disc__artist">{artistName}</span>
        </div>
      </div>
    </div>
  </div>;
};
