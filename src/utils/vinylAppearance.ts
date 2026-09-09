import { Album, VinylType } from '../types';

export const TEXTURES = ['black', 'clear', 'translucent', 'red', 'blue', 'green', 'orange', 'white', 'marbled-01', 'marbled-02', 'splatter-01', 'splatter-02', 'split-01', 'liquid-01', 'liquid-02', 'picture-base'] as const;
const defaults: Partial<Record<VinylType, string>> = {
  marble: 'marbled-01', marbled: 'marbled-01', splatter: 'splatter-01',
  split: 'split-01', liquid: 'liquid-01', picture: 'picture-base', colored: 'red',
};
export const resolveTexture = (type: VinylType = 'black', texture?: string, color?: string) => {
  if (texture && (TEXTURES as readonly string[]).includes(texture)) return texture;
  if (type === 'colored' && color) {
    const hex = color.replace('#', '');
    if (/^[\da-f]{6}$/i.test(hex)) {
      const [r, g, b] = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16));
      if (Math.min(r, g, b) > 190) return 'white';
      if (b > r) return 'blue';
      if (g > r * 1.2) return 'green';
      if (r > g * 1.2 && g > b * 1.4) return 'orange';
    }
  }
  return defaults[type] ?? ((TEXTURES as readonly string[]).includes(type) ? type : 'black');
};
export const getVinylAppearance = (album: Pick<Album, 'vinylType' | 'vinylTexture' | 'vinylColor' | 'vinylSecondaryColor' | 'vinylLabel' | 'vinylVariant' | 'vinylColors' | 'color'>) => {
  const variant = album.vinylType ?? album.vinylVariant ?? 'black';
  const colors = [album.vinylColor ?? album.vinylColors?.[0] ?? album.color, album.vinylSecondaryColor ?? album.vinylColors?.[1] ?? '#b9b0a8', album.vinylColors?.[2] ?? '#302c31'];
  return { variant, colors, texture: resolveTexture(variant, album.vinylTexture, colors[0]), label: album.vinylLabel };
};
