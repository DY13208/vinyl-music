import React from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { AlbumLayoutProps } from './types';

export function AlbumSelectionBar({ albums, selectedAlbumId, onSelectAlbum, onOpenAlbumDetail }: AlbumLayoutProps) {
  const index = albums.findIndex(album => album.id === selectedAlbumId);
  const album = albums[index];
  if (!album) return null;
  return <footer className="browse-selection">
    <div className="browse-selection__copy" aria-live="polite" aria-atomic="true"><h2 title={album.title}>{album.title}</h2><p>{album.artist}<span> · {album.year || '年份未知'} · {album.genre || '未分类'}</span></p></div>
    <div className="browse-selection__actions">
      <button className="browse-selection__detail" type="button" onClick={() => onOpenAlbumDetail(album)}>专辑详情<ArrowUpRight size={16} /></button>
      <button type="button" aria-label="上一张唱片" disabled={albums.length < 2} onClick={() => onSelectAlbum(albums[(index - 1 + albums.length) % albums.length].id)}><ChevronLeft size={20} /></button>
      <span className="browse-selection__count" aria-label={`第 ${index + 1} 张，共 ${albums.length} 张`}>{String(index + 1).padStart(2, '0')} / {albums.length}</span>
      <button type="button" aria-label="下一张唱片" disabled={albums.length < 2} onClick={() => onSelectAlbum(albums[(index + 1) % albums.length].id)}><ChevronRight size={20} /></button>
    </div>
  </footer>;
}
