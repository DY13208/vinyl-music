import { useState } from 'react';
import { storageService } from '../platform/platformService';

export const HOME_THEMES = [
  { id: 'dark', name: '暗黑黑胶', detail: '炭黑 · 微光 · 唱片纹理' },
  { id: 'gallery', name: '极简画廊', detail: '黑白 · 留白 · 清晰排版' },
  { id: 'archive', name: '复古藏馆', detail: '暖棕 · 木纹 · 黄铜灯影' },
  { id: 'future', name: '未来光感', detail: '深蓝 · 冷光 · 透光材质' },
] as const;
export type HomeTheme = typeof HOME_THEMES[number]['id'];
const KEY = 'vinyl_home_theme_v1';

export function useHomeTheme() {
  const [theme, setTheme] = useState<HomeTheme>(() => {
    try {
      const saved = storageService.getItem(KEY);
      return HOME_THEMES.find(item => item.id === saved)?.id ?? 'dark';
    } catch { return 'dark'; }
  });
  const [themeMessage, setThemeMessage] = useState('');
  const selectTheme = (next: HomeTheme) => {
    setTheme(next);
    try { storageService.setItem(KEY, next); setThemeMessage(''); }
    catch { setThemeMessage('主题已切换，但无法保存到此设备。'); }
  };
  return { theme, selectTheme, themeMessage };
}
