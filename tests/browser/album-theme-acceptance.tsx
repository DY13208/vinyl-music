import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlbumDetailView } from '../../src/views/AlbumDetailView';
import { ALBUMS } from '../../src/data/mockData';
import type { AlbumDetailThemeId } from '../../src/features/album-detail/themes/AlbumDetailTheme';
import '../../src/index.css';

const requested = new URLSearchParams(location.search).get('theme');
const themeId: AlbumDetailThemeId = requested === 'holo-card' ? requested : 'cover-notes';
const album = {
  ...ALBUMS[2],
  tracks: ALBUMS[2].tracks.map((track, index) => ({
    ...track,
    coverUrl: index === 3 ? ALBUMS[1].coverUrl : track.coverUrl,
  })),
};

function Acceptance() {
  const [result, setResult] = useState('尚未操作');
  const [favorite, setFavorite] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string>();

  return <div style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}>
    <AlbumDetailView
      album={album}
      currentTrackId={currentTrackId}
      isPlayingAlbum={Boolean(currentTrackId)}
      isPlaying={Boolean(currentTrackId)}
      isFavorite={favorite}
      themePreference={{ themeId, setTheme: () => {}, message: '' }}
      onBack={() => setResult('返回')}
      onToggleFavorite={() => setFavorite(value => !value)}
      onPlayAlbum={() => {
        setCurrentTrackId(album.tracks[0]?.id);
        setResult('播放整张');
      }}
      onSelectTrack={(_, track) => {
        setCurrentTrackId(track.id);
        setResult(`播放 ${track.title}`);
      }}
      onToggleWishlist={() => setResult('愿望单')}
    />
    <output aria-label="主题操作结果" style={{ position: 'fixed', right: 8, top: 92, zIndex: 20, padding: 6, background: '#111', color: '#fff', fontSize: 11 }}>{result}</output>
  </div>;
}

createRoot(document.getElementById('root')!).render(<Acceptance />);
