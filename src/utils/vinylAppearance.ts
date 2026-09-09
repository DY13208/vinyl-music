import { Album, VinylVariant } from '../types';

export interface VinylAppearance {
  variant: VinylVariant;
  colors: [string, string, string];
}

export const getVinylAppearance = (album: Pick<Album, 'vinylVariant' | 'vinylColors' | 'color'>): VinylAppearance => {
  const colors = album.vinylColors ?? [];
  return {
    variant: album.vinylVariant ?? 'black',
    colors: [colors[0] ?? album.color ?? '#151518', colors[1] ?? '#b9b0a8', colors[2] ?? '#302c31'],
  };
};
