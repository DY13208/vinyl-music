import { useState } from 'react';
export type Genre = string;
export type SortOption = 'recent' | 'artist' | 'year';

/** Owned by App so opening a detail page does not discard the collection context. */
export function useCollectionBrowseState() {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<Genre>('全部');
  const [sort, setSort] = useState<SortOption>('recent');
  return { query, setQuery, genre, setGenre, sort, setSort };
}
export type CollectionBrowseState = ReturnType<typeof useCollectionBrowseState>;
