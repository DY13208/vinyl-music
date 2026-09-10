import type React from 'react';
import type { Album, Track } from '../../../types';

export type PlayerThemeId = 'crescent' | 'halo' | 'nocturne' | 'classic';
export type OrbitThemeId = Exclude<PlayerThemeId, 'classic'>;
export type RepeatMode = 'off' | 'all' | 'one';
export type PlayerTokens = React.CSSProperties & { [key: `--player-${string}`]: string };
export interface PlayerStageProps {
  album: Album;
  currentTrack: Track;
  queue: Track[];
  isPlaying: boolean;
  isPreviewLoading: boolean;
  progressPercent: number;
  onSelectTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onShowLyrics: () => void;
}
export interface PlayerThemeDefinition {
  id: PlayerThemeId;
  name: string;
  description: string;
  tokens: PlayerTokens;
  Stage: React.ComponentType<PlayerStageProps>;
}
