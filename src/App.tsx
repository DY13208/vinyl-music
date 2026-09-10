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
import { audioEngine } from './services/audioEngine';
import { fileService } from './platform/files';
import { localMusicProvider, playbackResolver } from './music';
import type { MusicTrack, TrackSource } from './music';
import { trackMatcher } from './music/matching/TrackMatcher';
import type { LocalAudioSelection } from './platform/files/types';
import { collectionRepository } from './repositories/collection';
import type { CollectionRepository } from './repositories/collection';
import { HomeView } from './views/HomeView';
import { useHomeTheme } from './hooks/useHomeTheme';
import { useAlbumBrowserState } from './hooks/useAlbumBrowserState';
import { useCollectionBrowseState } from './hooks/useCollectionBrowseState';
import { useFloatingPlayerPreference } from './hooks/useFloatingPlayerPreference';
import { useCollectionTheme } from './features/collection/themes/useCollectionTheme';
import { usePlayerTheme } from './features/player/themes/usePlayerTheme';
import type { RepeatMode } from './features/player/themes/PlayerTheme';
import { collectionThemeRegistry } from './features/collection/themes/collectionThemeRegistry';
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
import { FloatingPlayer } from './components/FloatingPlayer';
import { BottomNav } from './components/BottomNav';

const CollectionView = lazy(() => import('./views/CollectionView').then((module) => ({ default: module.CollectionView })));
const ImportVinylModal = lazy(() => import('./components/ImportVinylModal').then((module) => ({ default: module.ImportVinylModal })));

export default function App({ repository = collectionRepository }: { repository?: CollectionRepository } = {}) {
  const { theme, selectTheme, themeMessage } = useHomeTheme();
  const floatingPlayer = useFloatingPlayerPreference();
  const collectionTheme = useCollectionTheme();
  const playerTheme = usePlayerTheme();
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Local-first collection. The repository preserves the existing storage key and data.
  const [albums, setAlbums] = useState<Album[]>(() => repository.getAlbums());

  // Carousel & Content State
  const browse = useAlbumBrowserState(albums);
  const collectionBrowse = useCollectionBrowseState();
  const carouselIndex = Math.max(0, albums.findIndex(album => album.id === browse.selectedAlbumId));
  const setCarouselIndex = (index: number) => { if (albums[index]) browse.selectAlbum(albums[index].id); };
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
  const [playbackSource, setPlaybackSource] = useState<TrackSource | null>(null);
  const [playbackMessage, setPlaybackMessage] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [pendingLocalFile, setPendingLocalFile] = useState<LocalAudioSelection | null>(null);
  const previewRequestRef = useRef(0);

  const durationSec = playbackSource ? previewDurationSec : (currentTrack?.durationSec || 30);

  const toMusicTrack = (album: Album, track: Track): MusicTrack => ({
    id: track.id, title: track.title, artist: album.artist, album: album.title,
    duration: track.durationSec, trackNumber: track.number, artwork: album.coverUrl,
  });

  const startTrackPreview = async (album: Album, track: Track) => {
    const requestId = ++previewRequestRef.current;
    setCurrentPlayingAlbum(album);
    setCurrentTrack(track);
    setCurrentTimeSec(0);
    setProgressPercent(0);
    setPlaybackSource(null);
    setPendingLocalFile(null);
    setPlaybackMessage('正在查找可靠音源…');
    setIsPreviewLoading(true);
    setIsPlaying(false);
    audioEngine.playNeedleDrop();
    try {
      const resolution = await playbackResolver.resolve(toMusicTrack(album, track));
      if (previewRequestRef.current !== requestId) return;
      if (resolution.status !== 'MATCHED' || !resolution.source) {
        setIsPreviewLoading(false);
        setPlaybackMessage(resolution.status === 'POSSIBLE_MATCH' ? '只找到待确认候选，未自动播放' : '暂无可靠音源');
        return;
      }
      const source = resolution.source;
      await audioEngine.load(
        { uri: source.uri, id: `${source.provider}:${source.providerTrackId}` },
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
      await audioEngine.play();
      if (previewRequestRef.current !== requestId) return;
      setPlaybackSource(source);
      setIsPreviewLoading(false);
      setPlaybackMessage(source.provider === 'local' ? '正在播放已绑定的本地音源' : source.provider === 'audius' ? '音源由 Audius 提供' : '试听音频由 Apple Music 提供');
      setIsPlaying(true);
    } catch {
      if (previewRequestRef.current !== requestId) return;
      setIsPreviewLoading(false);
      setIsPlaying(false);
      setPlaybackMessage('音源暂时不可用，请稍后重试或导入本地音频');
    }
  };

  // Audio Play / Pause control
  const handleTogglePlay = (targetAlbum?: Album) => {
    const alb = targetAlbum || currentPlayingAlbum || ALBUMS[0];
    const track = currentPlayingAlbum?.id === alb.id && currentTrack ? currentTrack : alb.tracks[0];
    if (!track || isPreviewLoading) return;

    if (isPlaying) {
      setIsPlaying(false);
      void audioEngine.pause();
    } else {
      if (currentPlayingAlbum?.id === alb.id && currentTrack?.id === track.id && playbackSource) {
        void audioEngine.play().then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
          setPlaybackMessage('音频无法继续播放，请重试');
        });
      } else {
        void startTrackPreview(alb, track);
      }
    }
  };

  const handleSelectTrack = (album: Album, track: Track) => {
    setCurrentScreen('player');
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
    void audioEngine.seek((percent / 100) * durationSec);
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
    if (albums.some(item => item.id === album.id)) browse.selectAlbum(album.id);
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
    setAlbums(repository.saveAlbum(newAlbum));
    setFavorites((prev) => (prev.includes(newAlbum.id) ? prev : [newAlbum.id, ...prev]));
  };

  const handleImportMultiple = async (newAlbums: Album[]) => {
    setAlbums(repository.saveAlbums(newAlbums));
  };

  const handleRemoveAlbum = (albumId: string) => {
    setAlbums(repository.deleteAlbum(albumId));
  };

  const handleImportLocalSource = async () => {
    if (!currentPlayingAlbum || !currentTrack) return;
    try {
      if (!pendingLocalFile) {
        const file = await fileService.pickLocalAudio();
        if (!file) return;
        const match = trackMatcher.score(toMusicTrack(currentPlayingAlbum, currentTrack), {
          title: file.title, artist: file.artist, album: currentPlayingAlbum.title, duration: file.duration,
        });
        setPendingLocalFile(file);
        setPlaybackMessage(`本地文件匹配分 ${match.score}；请确认将 ${file.filename} 绑定到《${currentTrack.title}》`);
        return;
      }
      setPlaybackMessage('正在保存并绑定本地音源…');
      await localMusicProvider.bindUserFile(toMusicTrack(currentPlayingAlbum, currentTrack), pendingLocalFile);
      setPlaybackMessage(`已将 ${pendingLocalFile.filename} 绑定为当前歌曲音源`);
      setPendingLocalFile(null);
      await startTrackPreview(currentPlayingAlbum, currentTrack);
    } catch {
      setPlaybackMessage('本地音源保存失败；浏览器存储空间或文件权限可能不可用');
    }
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
        data-home-theme={theme}
        data-collection-theme={currentScreen === 'collection' ? collectionTheme.themeId : undefined}
        style={currentScreen === 'collection' ? collectionThemeRegistry[collectionTheme.themeId].tokens : undefined}
        className={`relative w-full max-w-md h-full flex flex-col bg-[#000000] text-white overflow-hidden shadow-2xl border-x border-[#1C1C20]/40 ${currentScreen === 'home' ? 'home-shell' : ''} ${currentScreen === 'home' || currentScreen === 'collection' ? 'browse-shell' : ''}`}
      >
        {/* Scrollable Body Content Area (Fixed Full-Height Mobile Canvas) */}
        <div className="home-body flex-1 overflow-y-auto no-scrollbar relative flex flex-col w-full">
          {currentScreen === 'splash' && (
            <SplashView onEnterApp={() => setCurrentScreen('home')} />
          )}

          {currentScreen === 'home' && (
            <HomeView
              browse={browse}
              albums={albums}
              carouselIndex={carouselIndex}
              onSelectCarouselIndex={setCarouselIndex}
              onOpenAlbumDetail={handleOpenAlbumDetail}
              onOpenSearch={() => setCurrentScreen('search')}
              onAddAlbum={() => setIsImportOpen(true)}
              theme={theme}
              onSelectTheme={selectTheme}
              themeMessage={themeMessage}
              playingAlbum={currentPlayingAlbum}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              isLoading={isPreviewLoading}
              playbackMessage={playbackMessage}
              onPlayTrack={handleSelectTrack}
              onTogglePlay={() => handleTogglePlay()}
              onOpenPlayer={() => setCurrentScreen('player')}
            />
          )}

          {currentScreen === 'collection' && (
            <Suspense fallback={<div className="flex-1 bg-black" aria-label="正在打开收藏柜" />}>
              <CollectionView albums={albums} browse={browse} filters={collectionBrowse} themePreference={collectionTheme} favoriteIds={favorites} onToggleFavorite={handleToggleFavorite} onOpenAlbumDetail={handleOpenAlbumDetail} onAddVinyl={() => setIsImportOpen(true)} />
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
              homeTheme={theme}
              onSelectHomeTheme={selectTheme}
              themeMessage={themeMessage}
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
            <SettingsView onBack={() => setCurrentScreen('profile')} floatingPlayerVisible={floatingPlayer.visible} onFloatingPlayerVisibleChange={floatingPlayer.setVisible} preferenceMessage={floatingPlayer.message} collectionTheme={collectionTheme} playerTheme={playerTheme} homeTheme={theme} onSelectHomeTheme={selectTheme} homeThemeMessage={themeMessage} />
          )}

          {currentScreen === 'player' && currentPlayingAlbum && currentTrack && (
            <PlayerView
              themePreference={playerTheme}
              favorite={favorites.includes(currentPlayingAlbum.id)}
              onToggleFavorite={() => handleToggleFavorite(currentPlayingAlbum.id)}
              isShuffle={isShuffle}
              onShuffleChange={setIsShuffle}
              repeatMode={repeatMode}
              onRepeatChange={setRepeatMode}
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
              playbackSource={playbackSource}
              playbackMessage={playbackMessage}
              isPreviewLoading={isPreviewLoading}
              onImportLocalSource={() => void handleImportLocalSource()}
              localImportPending={!!pendingLocalFile}
            />
          )}
        </div>

        {/* Playback floats independently so the navigation remains unobstructed. */}
        {isBottomNavVisible && floatingPlayer.visible && currentPlayingAlbum && currentTrack && (
          <FloatingPlayer
            currentAlbum={currentPlayingAlbum}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            progressPercent={progressPercent}
            onTogglePlay={() => handleTogglePlay(currentPlayingAlbum)}
            onOpenPlayer={() => setCurrentScreen('player')}
          />
        )}

        {/* Pinned 4-tab navigation. */}
        {isBottomNavVisible && (
          <div
            id="app-bottom-dock"
            className="w-full flex-shrink-0 bg-[#000000] z-40 border-t border-[#26272D]/70 shadow-[0_-10px_25px_rgba(0,0,0,0.85)]"
          >
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
