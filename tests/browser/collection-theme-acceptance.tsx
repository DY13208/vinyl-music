import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ALBUMS } from '../../src/data/mockData';
import { AshenPressCollectionView } from '../../src/features/collection/themes/themes/ashen-press/AshenPressCollectionView';
import '../../src/index.css';

function Acceptance() {
  const albums = useMemo(() => Array.from({ length: 12 }, (_, index) => ({
    ...ALBUMS[index % ALBUMS.length],
    id: `acceptance-${index}`,
    title: `${ALBUMS[index % ALBUMS.length].title} ${index + 1}`,
  })), []);
  const [result, setResult] = useState('尚未打开专辑');
  return <main style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}>
    <AshenPressCollectionView
      albums={albums}
      selectedAlbumId={null}
      favoriteIds={[]}
      cardVariant="cover"
      onOpenAlbumDetail={album => setResult(`打开 ${album.title}`)}
      onToggleFavorite={() => {}}
    />
    <output aria-label="唱片架操作结果" style={{ position: 'fixed', left: 8, bottom: 8, zIndex: 20, padding: 6, color: '#fff', background: '#111', fontSize: 11 }}>{result}</output>
  </main>;
}

createRoot(document.getElementById('root')!).render(<Acceptance />);
