import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import {
  Album,
  Track,
  Artist,
  ScreenId,
  MainTab,
  DevicePlatform,
  WishlistItem,
} from './types';
import { ALBUMS, ARTISTS, WISHLIST } from './data/mockData';
import { audioEngine, PreviewTrack } from './services/audioEngine';
import { loadServerCollection, removeAlbumFromServer, saveAlbumsToServer, saveAlbumToServer } from './services/collectionApi';
import { HomeView } from './views/HomeView';
import { PlayerView } from './views/PlayerView';
import { AlbumDetailView } from './views/AlbumDetailView';
import { DiscoverView } from './views/DiscoverView';
import { SearchView } from './views/SearchView';
import { ArtistView } from './views/ArtistView';
import { WishlistView } from './views/WishlistView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView';
import { SplashView } from './views/SplashView';
import { LandscapeView } from './views/LandscapeView';
import { DesignBoardView } from './views/DesignBoardView';
import { MiniPlayer } from './components/MiniPlayer';
import { BottomNav } from './components/BottomNav';

const CollectionView = lazy(() => import('./views/CollectionView').then((module) => ({ default: module.CollectionView })));
const ImportVinylModal = lazy(() => import('./components/ImportVinylModal').then((module) => ({ default: module.ImportVinylModal })));

export default function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [isImportOpen, setIsImportOpen] = useState(false);

  // User Vinyl Collection with LocalStorage Persistence
  const [albums, setAlbums] = useState<Album[]>(() => {
    try {
      const saved = localStorage.getItem('vinyl_user_collection');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((album: Album) => {
            const catalogAlbum = ALBUMS.find((item) => item.id === album.id);
            return album.vinylVariant || !catalogAlbum ? album : { ...album, vinylVariant: catalogAlbum.vinylVariant, vinylColors: catalogAlbum.vinylColors };
          });
        }
      }
    } catch (e) {
      console.error('Failed to load saved collection', e);
    }
    return ALBUMS;
  });

  // Persist collection changes
  useEffect(() => {
    try {
      localStorage.setItem('vinyl_user_collection', JSON.stringify(albums));
    } catch (e) {
      console.error('Failed to save vinyl collection', e);
    }
  }, [albums]);

  useEffect(() => {
    let active = true;
    loadServerCollection().then((savedAlbums) => {
      if (!active || !savedAlbums.length) return;
      setAlbums((current) => {
        const serverIds = new Set(savedAlbums.map(album => album.id));
        return [...savedAlbums, ...current.filter(album => !serverIds.has(album.id))];
      });
    }).catch((error) => console.warn('Backend collection unavailable', error));
    return () => { active = false; };
  }, []);

  // Carousel & Content State
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [selectedAlbum, setSelectedAlbum] = useState<Album>(albums[0] || ALBUMS[0]);
  const [selectedArtist, setSelectedArtist] = useState<Artist>(ARTISTS[0]);
  const [favorites, setFavorites] = useState<string[]>([ALBUMS[0].id, ALBUMS[1].id]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(WISHLIST);

  // Playback State
  const [currentPlayingAlbum, setCurrentPlayingAlbum] = useState<Album | null>(albums[0] || ALBUMS[0]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(albums[0]?.tracks[0] || ALBUMS[0].tracks[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(138); // 2:18 initial sample time
  const [progressPercent, setProgressPercent] = useState<number>(33.4);
  const [previewDurationSec, setPreviewDurationSec] = useState<number>(30);
  const [previewMatch, setPreviewMatch] = useState<PreviewTrack | null>(null);
  const [playbackMessage, setPlaybackMessage] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const previewRequestRef = useRef(0);

  const durationSec = previewMatch ? previewDurationSec : (currentTrack?.durationSec || 30);

  const startTrackPreview = async (album: Album, track: Track) => {
    const requestId = ++previewRequestRef.current;
    setCurrentPlayingAlbum(album);
    setCurrentTrack(track);
    setCurrentTimeSec(0);
    setProgressPercent(0);
    setPreviewMatch(null);
    setPlaybackMessage('正在查找官方试听…');
    setIsPreviewLoading(true);
    setIsPlaying(false);
    audioEngine.playNeedleDrop();
    try {
      const match = await audioEngine.playTrackPreview(
        { title: track.title, artist: album.artist, album: album.title },
        {
          onTimeUpdate: (time, duration) => {
            if (previewRequestRef.current !== requestId) return;
            setCurrentTimeSec(time);
            setPreviewDurationSec(duration);
            setProgressPercent(duration ? (time / duration) * 100 : 0);
          },
          onEnded: () => {
            if (previewRequestRef.current !== requestId) return;
            setIsPlaying(false);
            setProgressPercent(100);
          },
          onError: (message) => {
            if (previewRequestRef.current !== requestId) return;
            setPlaybackMessage(message);
            setIsPlaying(false);
          },
        },
      );
      if (previewRequestRef.current !== requestId) return;
      setPreviewMatch(match);
      setIsPreviewLoading(false);
      if (match) {
        setPlaybackMessage('试听音频由 iTunes 提供');
        setIsPlaying(true);
      } else {
        setPlaybackMessage((message) =>
          message === '正在查找官方试听…' ? '暂未找到这首歌的官方试听' : message,
        );
      }
    } catch {
      if (previewRequestRef.current !== requestId) return;
      setIsPreviewLoading(false);
      setIsPlaying(false);
      setPlaybackMessage('暂时无法连接试听服务，请检查网络后重试');
    }
  };

  // Audio Play / Pause control
  const handleTogglePlay = (targetAlbum?: Album) => {
    const alb = targetAlbum || currentPlayingAlbum || ALBUMS[0];
    const track = currentPlayingAlbum?.id === alb.id && currentTrack ? currentTrack : alb.tracks[0];
    if (!track || isPreviewLoading) return;

    if (isPlaying) {
      setIsPlaying(false);
      audioEngine.pausePreview();
    } else {
      const query = { title: track.title, artist: alb.artist, album: alb.title };
      if (currentPlayingAlbum?.id === alb.id && currentTrack?.id === track.id && audioEngine.hasPreview(query)) {
        void audioEngine.resumePreview().then(resumed => {
          setIsPlaying(resumed);
          if (!resumed) setPlaybackMessage('浏览器阻止了音频播放，请再次点击播放');
        });
      } else {
        void startTrackPreview(alb, track);
      }
    }
  };

  const handleSelectTrack = (album: Album, track: Track) => {
    void startTrackPreview(album, track);
  };

  const handlePrevTrack = () => {
    if (!currentPlayingAlbum) return;
    const tracks = currentPlayingAlbum.tracks;
    const currentIdx = tracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIdx = (currentIdx - 1 + tracks.length) % tracks.length;
    handleSelectTrack(currentPlayingAlbum, tracks[prevIdx]);
  };

  const handleNextTrack = () => {
    if (!currentPlayingAlbum) return;
    const tracks = currentPlayingAlbum.tracks;
    const currentIdx = tracks.findIndex((t) => t.id === currentTrack?.id);
    const nextIdx = (currentIdx + 1) % tracks.length;
    handleSelectTrack(currentPlayingAlbum, tracks[nextIdx]);
  };

  const handleSeek = (percent: number) => {
    audioEngine.seekPreview(percent);
    setProgressPercent(percent);
    setCurrentTimeSec(Math.floor((percent / 100) * durationSec));
  };

  const handleToggleFavorite = (albumId: string) => {
    setFavorites((prev) =>
      prev.includes(albumId) ? prev.filter((id) => id !== albumId) : [...prev, albumId]
    );
  };

  const handleToggleWishlist = (album: Album) => {
    setWishlist((prev) => {
      const exists = prev.some((w) => w.album.id === album.id);
      if (exists) {
        return prev.filter((w) => w.album.id !== album.id);
      }
      return [
        ...prev,
        {
          id: `w-${Date.now()}`,
          album,
          addedDate: '2026.09.08',
          targetPrice: album.price || 320,
          condition: 'Mint (M)',
          pressing: album.edition,
        },
      ];
    });
  };

  // Tab switching
  const handleChangeTab = (tab: MainTab) => {
    setActiveTab(tab);
    setCurrentScreen(tab);
  };

  const handleOpenAlbumDetail = (album: Album) => {
    setSelectedAlbum(album);
    setCurrentScreen('album_detail');
  };

  const handleOpenArtist = (artistId: string) => {
    const art = ARTISTS.find((a) => a.id === artistId) || ARTISTS[0];
    setSelectedArtist(art);
    setCurrentScreen('artist_detail');
  };

  // Vinyl Collection CRUD handlers
  const handleAddAlbum = async (newAlbum: Album) => {
    await saveAlbumToServer(newAlbum);
    setAlbums((prev) => [newAlbum, ...prev]);
    setFavorites((prev) => (prev.includes(newAlbum.id) ? prev : [newAlbum.id, ...prev]));
  };

  const handleImportMultiple = async (newAlbums: Album[]) => {
    await saveAlbumsToServer(newAlbums);
    setAlbums((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const existingTitles = new Set(prev.map((a) => a.title.toLowerCase().trim()));
      const toAdd = newAlbums.filter(
        (a) => !existingIds.has(a.id) && !existingTitles.has(a.title.toLowerCase().trim())
      );
      return [...toAdd, ...prev];
    });
  };

  const handleRemoveAlbum = (albumId: string) => {
    setAlbums((prev) => prev.filter((a) => a.id !== albumId));
    void removeAlbumFromServer(albumId).catch((error) => console.warn('Backend delete unavailable', error));
  };

  // Check if current view is Landscape
  if (currentScreen === 'landscape') {
    return (
      <LandscapeView
        albums={albums}
        currentIndex={carouselIndex}
        onSelectIndex={setCarouselIndex}
        isPlaying={isPlaying}
        onTogglePlay={() => handleTogglePlay(albums[carouselIndex])}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={favorites.includes(albums[carouselIndex]?.id)}
        onExitLandscape={() => {
          setCurrentScreen('home');
        }}
      />
    );
  }

  // Check if Design Board Mode is active
  if (currentScreen === 'design_board') {
    return (
      <div className="w-full min-h-screen bg-[#050507]">
        {/* Top Floating Control Bar */}
        <div className="sticky top-0 z-50 bg-[#0F0F0F]/90 backdrop-blur-md border-b border-[#26272D] px-4 py-2.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentScreen('home')}
            className="px-3 py-1 rounded-[4px] bg-[#2FE92B] text-[#0F0F0F] font-bold text-[12px] flex items-center gap-1.5"
          >
            <span>返回交互界面</span>
          </button>
          <span className="text-[12px] font-mono text-white/50">
            全套 14 张设计稿画板总览
          </span>
        </div>

        <DesignBoardView
          albums={ALBUMS}
          onOpenScreen={(screen) => setCurrentScreen(screen)}
          platform="ios"
          onTogglePlatform={() => {}}
        />
      </div>
    );
  }

  // Bottom Nav is permanently visible on all standard screens (except full-screen player and splash)
  const isBottomNavVisible = currentScreen !== 'player' && currentScreen !== 'splash';

  return (
    <div className="fixed inset-0 w-full h-full bg-[#000000] flex justify-center overflow-hidden select-none">
      <div
        id="mobile-viewport"
        className="relative w-full max-w-md h-full flex flex-col bg-[#000000] text-white overflow-hidden shadow-2xl border-x border-[#1C1C20]/40"
      >
        {/* Scrollable Body Content Area (Fixed Full-Height Mobile Canvas) */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col w-full">
          {currentScreen === 'splash' && (
            <SplashView onEnterApp={() => setCurrentScreen('home')} />
          )}

          {currentScreen === 'home' && (
            <HomeView
              albums={albums}
              carouselIndex={carouselIndex}
              onSelectCarouselIndex={setCarouselIndex}
              onOpenAlbumDetail={handleOpenAlbumDetail}
              onOpenSearch={() => setCurrentScreen('search')}
            />
          )}

          {currentScreen === 'collection' && (
            <Suspense fallback={<div className="flex-1 bg-black" aria-label="正在打开收藏柜" />}>
              <CollectionView albums={albums} onOpenAlbumDetail={handleOpenAlbumDetail} onAddVinyl={() => setIsImportOpen(true)} />
            </Suspense>
          )}

          {currentScreen === 'discover' && (
            <DiscoverView
              albums={albums}
              onOpenAlbumDetail={handleOpenAlbumDetail}
              onOpenSearch={() => setCurrentScreen('search')}
            />
          )}

          {currentScreen === 'search' && (
            <SearchView
              albums={albums}
              onBack={() => setCurrentScreen(activeTab)}
              onOpenAlbumDetail={handleOpenAlbumDetail}
              onOpenArtist={handleOpenArtist}
              onPlayTrack={handleSelectTrack}
            />
          )}

          {currentScreen === 'album_detail' && (
            <AlbumDetailView
              album={selectedAlbum}
              currentTrackId={currentTrack?.id}
              isPlayingAlbum={currentPlayingAlbum?.id === selectedAlbum.id}
              isPlaying={isPlaying}
              onBack={() => setCurrentScreen(activeTab)}
              onPlayAlbum={handleTogglePlay}
              onSelectTrack={handleSelectTrack}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={favorites.includes(selectedAlbum.id)}
              onToggleWishlist={handleToggleWishlist}
            />
          )}

          {currentScreen === 'artist_detail' && (
            <ArtistView
              artist={selectedArtist}
              onBack={() => setCurrentScreen(activeTab)}
              onOpenAlbumDetail={handleOpenAlbumDetail}
            />
          )}

          {currentScreen === 'wishlist' && (
            <WishlistView
              wishlist={wishlist}
              onBack={() => setCurrentScreen('profile')}
              onOpenAlbumDetail={handleOpenAlbumDetail}
              onRemoveWishlist={(id) =>
                setWishlist((prev) => prev.filter((w) => w.id !== id))
              }
            />
          )}

          {currentScreen === 'profile' && (
            <ProfileView
              onOpenSettings={() => setCurrentScreen('settings')}
              onOpenWishlist={() => setCurrentScreen('wishlist')}
              onOpenCollection={() => {
                setActiveTab('collection');
                setCurrentScreen('collection');
              }}
              onOpenDesignBoard={() => setCurrentScreen('design_board')}
              onOpenLandscape={() => setCurrentScreen('landscape')}
            />
          )}

          {currentScreen === 'settings' && (
            <SettingsView onBack={() => setCurrentScreen('profile')} />
          )}

          {currentScreen === 'player' && currentPlayingAlbum && currentTrack && (
            <PlayerView
              album={currentPlayingAlbum}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              progressPercent={progressPercent}
              currentTimeSec={currentTimeSec}
              durationSec={durationSec}
              onTogglePlay={() => handleTogglePlay(currentPlayingAlbum)}
              onPrevTrack={handlePrevTrack}
              onNextTrack={handleNextTrack}
              onSeek={handleSeek}
              onClose={() => setCurrentScreen(activeTab)}
              onSelectTrack={(trk) => handleSelectTrack(currentPlayingAlbum, trk)}
              previewMatch={previewMatch}
              playbackMessage={playbackMessage}
              isPreviewLoading={isPreviewLoading}
            />
          )}
        </div>

        {/* Pinned Bottom Dock: Mini Player + 4-Tab Bottom Navigation (ALWAYS VISIBLE AT BOTTOM) */}
        {isBottomNavVisible && (
          <div
            id="app-bottom-dock"
            className="w-full flex-shrink-0 bg-[#000000] z-40 border-t border-[#26272D]/70 shadow-[0_-10px_25px_rgba(0,0,0,0.85)]"
          >
            {/* Mini Player: Shown on non-home screens when audio is active */}
            {currentPlayingAlbum && currentTrack && currentScreen !== 'home' && currentScreen !== 'collection' && (
              <MiniPlayer
                currentAlbum={currentPlayingAlbum}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                progressPercent={progressPercent}
                onTogglePlay={() => handleTogglePlay(currentPlayingAlbum || undefined)}
                onOpenPlayer={() => setCurrentScreen('player')}
              />
            )}

            {/* 4-Tab Bottom Navigation: 首页, 收藏, 发现, 我的 */}
            <BottomNav activeTab={activeTab} onChangeTab={handleChangeTab} />

            {/* Hardware Home Indicator Bar */}
            <div className="w-full pb-1.5 pt-0.5 flex justify-center bg-[#000000]">
              <div className="w-32 h-1 rounded-full bg-white/25" />
            </div>
          </div>
        )}

        {isImportOpen && (
          <Suspense fallback={null}>
            <ImportVinylModal
              isOpen
              onClose={() => setIsImportOpen(false)}
              onAddAlbum={handleAddAlbum}
              onImportMultiple={handleImportMultiple}
              currentAlbums={albums}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
