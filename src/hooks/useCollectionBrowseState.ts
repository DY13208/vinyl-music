import { useState } from 'react';
export const genres = ['全部', '摇滚', '流行', '爵士', '电子', '古典', '其他'] as const;
export type Genre = typeof genres[number];
export type SortOption = 'recent' | 'artist' | 'year';

/** Owned by App so opening a detail page does not discard the collection context. */
export function useCollectionBrowseState() {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<Genre>('全部');
  const [sort, setSort] = useState<SortOption>('recent');
  return { query, setQuery, genre, setGenre, sort, setSort };
}
export type CollectionBrowseState = ReturnType<typeof useCollectionBrowseState>;
