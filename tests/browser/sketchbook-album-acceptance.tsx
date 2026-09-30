import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlbumDetailView } from '../../src/views/AlbumDetailView';
import { ALBUMS } from '../../src/data/mockData';
import type { Album } from '../../src/types';
import '../../src/index.css';

const base = ALBUMS[2];
const params = new URLSearchParams(location.search);
const mobileFixture = params.has('mobile');
const fixtureWidth = Number(params.get('width')) || 390;
const fixtureHeight = Number(params.get('height')) || 844;
const trackCover = (title: string, index: number) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><rect width="800" height="800" fill="${index % 2 ? '#26352f' : '#29251f'}"/><circle cx="400" cy="330" r="176" fill="none" stroke="#ece7dc" stroke-width="5" opacity=".72"/><text x="400" y="610" fill="#ece7dc" font-family="Georgia,serif" font-size="38" text-anchor="middle">${title.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</text></svg>`)}`;
const fixture: Album = {
  ...base,
  title: '夜色压片手记',
  artist: 'Vinyl Shelf Ensemble',
  description: '一张用于验收封面翻页、曲目索引与移动端布局的唱片。每首曲目都有独立画面，点击曲目后，上方封面会同步切换。',
  tracks: base.tracks.map((track, index) => ({
    ...track,
    coverUrl: index === 0 ? trackCover(track.title, index) : undefined,
  })),
};

function Acceptance() {
  const [result, setResult] = useState('尚未操作');
  const [favorite, setFavorite] = useState(false);
  return <div style={{ width: mobileFixture ? fixtureWidth : '100vw', maxWidth: '100vw', height: mobileFixture ? fixtureHeight : '100dvh', maxHeight: '100dvh', margin: 'auto', overflow: 'hidden' }}>
    <AlbumDetailView
      album={fixture}
      isFavorite={favorite}
      themePreference={{ themeId: 'cover-notes', setTheme: () => {}, message: '' }}
      onBack={() => setResult('返回')}
      onToggleFavorite={() => setFavorite(value => !value)}
      onPlayAlbum={() => setResult('播放整张')}
      onSelectTrack={(_, track) => setResult(`播放 ${track.title}`)}
      onToggleWishlist={() => setResult('愿望单')}
    />
    <output aria-label="主题操作结果" style={{ position: 'fixed', right: 8, bottom: 8, zIndex: 10, padding: 6, background: '#111', color: '#fff' }}>{result}</output>
  </div>;
}

createRoot(document.getElementById('root')!).render(<Acceptance />);
