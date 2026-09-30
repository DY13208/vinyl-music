import { useState } from 'react';
import { storageService } from '../platform/platformService';

export type CategoryKind = 'genres' | 'tags';
export const DEFAULT_GENRES = ['摇滚', '流行', '爵士', '电子', '古典', 'R&B', '嘻哈', '其他'];
export const DEFAULT_TAGS = ['首版', '限量版', '彩胶', '签名版', '纪念版'];
const KEY = 'vinyl_collection_categories_v1';
export type Categories = { genres: string[]; tags: string[] };
const defaults = (): Categories => ({ genres: [...DEFAULT_GENRES], tags: [...DEFAULT_TAGS] });
const clean = (items: unknown, fallback: string[]) => Array.isArray(items)
  ? [...new Set(items.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean))]
  : fallback;

export function useCollectionCategories() {
  const [categories, setCategories] = useState<Categories>(() => {
    try {
      const saved = JSON.parse(storageService.getItem(KEY) || 'null');
      return saved ? { genres: clean(saved.genres, DEFAULT_GENRES), tags: clean(saved.tags, DEFAULT_TAGS) } : defaults();
    } catch { return defaults(); }
  });
  const [message, setMessage] = useState('');
  const save = (next: Categories) => {
    try { storageService.setItem(KEY, JSON.stringify(next)); setCategories(next); setMessage(''); return true; }
    catch { setMessage('分类保存失败，请检查本机存储空间后重试。'); return false; }
  };
  return { categories, save, message };
}
