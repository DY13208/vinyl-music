export type AlbumDetailThemeId = 'archive' | 'cover-notes' | 'holo-card';

export interface AlbumDetailThemeDefinition {
  id: AlbumDetailThemeId;
  name: string;
  description: string;
}

export const albumDetailThemes: readonly AlbumDetailThemeDefinition[] = [
  {
    id: 'archive',
    name: '唱片档案',
    description: '实体封套、唱片分面与压片信息',
  },
  {
    id: 'cover-notes',
    name: '封面手记',
    description: 'ThreeUI 原版卷页、放大镜与曲目封面索引',
  },
  {
    id: 'holo-card',
    name: '魂火卡牌',
    description: '余火与烬鬃双场景、全息翻面与曲目铭文',
  },
];
