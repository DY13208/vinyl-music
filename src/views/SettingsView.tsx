import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, CirclePlay, HardDrive, Info, LogOut, Palette, RotateCw, UserRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { artworkService } from '../platform/artwork/WebArtworkAdapter';
import { importLegacyCollection } from '../platform/storage/LegacyCollectionImport';
import { hapticsService } from '../platform/platformService';
import type { Album } from '../types';
import { CollectionThemePicker } from '../features/collection/themes/CollectionThemePicker';
import type { CollectionThemeState } from '../features/collection/themes/useCollectionTheme';
import { PlayerThemeSelector } from '../features/player/themes/settings/PlayerThemeSelector';
import type { PlayerThemePreference } from '../features/player/themes/usePlayerTheme';
import { AlbumDetailThemeSelector } from '../features/album-detail/themes/AlbumDetailThemeSelector';
import type { AlbumDetailThemePreference } from '../features/album-detail/themes/useAlbumDetailTheme';
import { HOME_THEMES, type HomeTheme } from '../hooks/useHomeTheme';
import './SettingsDesktop.css';

interface SettingsViewProps {
  onImportLegacy?: (albums: Album[]) => Promise<void>;
  onBack: () => void;
  onOpenLandscape: () => void;
  floatingPlayerVisible: boolean;
  onFloatingPlayerVisibleChange: (visible: boolean) => void;
  preferenceMessage: string;
  collectionTheme: CollectionThemeState;
  playerTheme: PlayerThemePreference;
  albumDetailTheme: AlbumDetailThemePreference;
  homeTheme: HomeTheme;
  onSelectHomeTheme: (theme: HomeTheme) => void;
  homeThemeMessage: string;
}

const formatBytes = (bytes: number) => bytes < 1024 * 1024
  ? `${Math.round(bytes / 1024)} KB`
  : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBack,
  onOpenLandscape,
  floatingPlayerVisible,
  onFloatingPlayerVisibleChange,
  preferenceMessage,
  collectionTheme,
  playerTheme,
  albumDetailTheme,
  homeTheme,
  onSelectHomeTheme,
  homeThemeMessage,
  onImportLegacy,
}) => {
  const auth = useAuth();
  const [cacheSize, setCacheSize] = useState('读取中');
  const [savedSize, setSavedSize] = useState('读取中');
  const [cacheMessage, setCacheMessage] = useState('');
  const [clearing, setClearing] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importing, setImporting] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const refreshCache = async () => {
    const stats = await artworkService.stats();
    setCacheSize(formatBytes(stats.browsingBytes));
    setSavedSize(formatBytes(stats.collectionBytes));
    setCacheMessage(stats.pendingCount
      ? `${stats.pendingCount} 张唱片架图片尚未保存到本机，请联网后重试。`
      : '唱片架封面已保存在本机。');
  };

  useEffect(() => {
    void refreshCache().catch(() => setCacheMessage('无法读取本地存储，请检查浏览器权限。'));
  }, []);

  const clearCache = async () => {
    setClearing(true);
    try {
      await artworkService.clearBrowsing();
      await refreshCache();
      hapticsService.triggerHaptic('medium');
    } catch {
      setCacheMessage('缓存清理失败，请稍后重试。');
    } finally {
      setClearing(false);
    }
  };

  const importOriginal = async () => {
    if (!onImportLegacy) return;
    setImporting(true);
    try {
      const count = await importLegacyCollection(onImportLegacy);
      setImportMessage(count
        ? `已读取 ${count} 张原有唱片；重复唱片已跳过，原始数据仍保留在本机。`
        : '没有找到未登录时的本机馆藏。');
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const logout = async () => {
    if (!auth) return;
    setLoggingOut(true);
    setLogoutError('');
    try {
      await auth.logout();
    } catch {
      setLogoutError('退出失败，请检查网络后重试。');
      setLoggingOut(false);
    }
  };

  return (
    <div id="settings-view" className="w-full min-h-screen bg-[#000000] text-white flex flex-col select-none pb-24 overflow-y-auto no-scrollbar">
      <header className="px-4 pt-3 pb-2 flex items-center gap-3 sticky top-0 bg-[#000000]/95 backdrop-blur-md z-30 border-b border-[#26272D]">
        <button type="button" onClick={onBack} className="w-9 h-9 rounded-full bg-[#0F0F0F] border border-[#26272D] text-white/80 flex items-center justify-center" aria-label="返回我的页面">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-[18px] font-bold tracking-tight">设置</h1>
        {/* Desktop-only lead line (display:none on mobile). */}
        <p className="settings-desktop__lead" aria-hidden="true">外观主题、播放、本机存储与账户</p>
      </header>

      <div className="px-4 py-4 space-y-6">
        <section aria-labelledby="appearance-settings" className="space-y-3">
          <span className="settings-desktop__icon" aria-hidden="true"><Palette /></span>
          <h2 id="appearance-settings" className="text-[15px] font-semibold">外观与展示</h2>
          <p className="settings-desktop__sub" aria-hidden="true">首页、唱片架、专辑详情与播放器的展示风格</p>
          <details className="pt-settings-section">
            <summary>首页陈列样式</summary>
            <div className="grid grid-cols-2 gap-2">
              {HOME_THEMES.map(item => (
                <button key={item.id} type="button" aria-pressed={homeTheme === item.id} onClick={() => onSelectHomeTheme(item.id)} className={`min-h-12 rounded-md border p-3 text-left text-sm ${homeTheme === item.id ? 'border-[#a9d69a] bg-[#162316] text-[#dff5d8]' : 'border-[#343d34] text-white/65'}`}>
                  <strong className="block font-medium">{item.name}</strong>
                  <small className="mt-1 block text-[10px] opacity-65">{item.detail.split(' · ')[0]}</small>
                </button>
              ))}
            </div>
            {homeThemeMessage && <p role="status">{homeThemeMessage}</p>}
          </details>
          <CollectionThemePicker preference={collectionTheme} />
          <AlbumDetailThemeSelector preference={albumDetailTheme} />
          <details className="pt-settings-section">
            <summary>播放器样式</summary>
            <PlayerThemeSelector preference={playerTheme} />
          </details>
          <button type="button" onClick={() => { onOpenLandscape(); hapticsService.triggerHaptic('light'); }} className="w-full min-h-14 rounded-md border border-[#26272D] bg-[#0F0F0F] px-3.5 flex items-center gap-3 text-left">
            <RotateCw className="w-4 h-4 text-[#2FE92B]" />
            <span className="flex-1"><strong className="block text-[13.5px] font-medium">横屏唱片展台</strong><small className="mt-1 block text-[10.5px] text-[#BBCBB2]/70">进入适合桌面和横屏设备的唱片浏览模式</small></span>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </button>
        </section>

        <section aria-labelledby="playback-settings" className="space-y-3">
          <span className="settings-desktop__icon" aria-hidden="true"><CirclePlay /></span>
          <h2 id="playback-settings" className="text-[15px] font-semibold">播放</h2>
          <p className="settings-desktop__sub" aria-hidden="true">底栏播放入口的显示方式</p>
          <div className="rounded-md border border-[#26272D] bg-[#0F0F0F] p-3.5">
            <div className="flex items-center justify-between gap-4">
              <div><h3 id="floating-player-setting" className="text-[13.5px] font-medium">显示底栏播放器</h3><p id="floating-player-setting-help" className="text-[11px] text-[#BBCBB2]/70 mt-1">隐藏入口不会停止正在播放的音乐</p></div>
              <button type="button" role="switch" aria-checked={floatingPlayerVisible} aria-labelledby="floating-player-setting" aria-describedby="floating-player-setting-help" onClick={() => onFloatingPlayerVisibleChange(!floatingPlayerVisible)} className="w-14 h-11 flex-shrink-0 flex items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-[#2FE92B]">
                <span className={`block w-11 h-6 rounded-full p-0.5 ${floatingPlayerVisible ? 'bg-[#2FE92B]' : 'bg-[#2A2A2C]'}`}><span className={`block w-5 h-5 rounded-full bg-[#0F0F0F] transition-transform ${floatingPlayerVisible ? 'translate-x-5' : 'translate-x-0'}`} /></span>
              </button>
            </div>
            {preferenceMessage && <p role="status" className="mt-2 text-[11px] text-[#BBCBB2]">{preferenceMessage}</p>}
          </div>
        </section>

        <section aria-labelledby="storage-settings" className="space-y-3">
          <span className="settings-desktop__icon" aria-hidden="true"><HardDrive /></span>
          <h2 id="storage-settings" className="text-[15px] font-semibold">本机存储</h2>
          <p className="settings-desktop__sub" aria-hidden="true">封面缓存与本机馆藏数据</p>
          <div className="rounded-md border border-[#26272D] bg-[#0F0F0F] overflow-hidden divide-y divide-[#1F2024]">
            <button type="button" disabled={clearing} onClick={clearCache} className="w-full min-h-14 px-3.5 flex items-center justify-between text-left">
              <span><strong className="block text-[13.5px] font-medium">{clearing ? '正在清理…' : '清理浏览封面缓存'}</strong><small className="mt-1 block text-[10.5px] text-[#BBCBB2]/70">保留唱片架封面和本地音乐</small></span>
              <span className="text-[11px] text-white/45">{cacheSize}</span>
            </button>
            <div className="p-3.5 text-[11px] leading-5 text-[#BBCBB2]/75 space-y-2">
              <p>唱片架图片占用：{savedSize}</p>
              <p role="status">{cacheMessage}</p>
              <p>馆藏、上传图片与本地音源只保存在当前设备。</p>
              {onImportLegacy && <button type="button" disabled={importing} onClick={importOriginal} className="min-h-11 text-[#71ef68]">{importing ? '正在导入…' : '导入此设备上的原有馆藏'}</button>}
              {importMessage && <p role="status">{importMessage}</p>}
            </div>
          </div>
        </section>

        <section aria-labelledby="account-settings" className="space-y-3">
          <span className="settings-desktop__icon" aria-hidden="true"><UserRound /></span>
          <h2 id="account-settings" className="text-[15px] font-semibold">账户</h2>
          <p className="settings-desktop__sub" aria-hidden="true">当前登录的账户</p>
          <div className="rounded-md border border-[#26272D] bg-[#0F0F0F] overflow-hidden divide-y divide-[#1F2024]">
            <div className="p-3.5"><span className="block text-[11px] text-white/45">当前账户</span><strong className="mt-1 block text-[13px] font-medium">{auth?.user.email || '本机账户'}</strong></div>
            <button type="button" disabled={loggingOut} onClick={logout} className="w-full min-h-12 px-3.5 flex items-center gap-3 text-left text-[13px] text-white/80">
              <LogOut className="w-4 h-4" />{loggingOut ? '正在退出…' : '退出登录'}
            </button>
          </div>
          <p className="text-[11px] leading-5 text-[#BBCBB2]/70">退出后隐藏本账户馆藏，本机数据会保留。</p>
          {logoutError && <p role="alert" className="text-[11px] text-[#ffc6b8]">{logoutError}</p>}
        </section>

        <section aria-labelledby="about-settings" className="space-y-3">
          <span className="settings-desktop__icon" aria-hidden="true"><Info /></span>
          <h2 id="about-settings" className="text-[15px] font-semibold">关于</h2>
          <p className="settings-desktop__sub" aria-hidden="true">版本信息</p>
          <div className="rounded-md border border-[#26272D] bg-[#0F0F0F] p-3.5">
            <div className="flex items-center justify-between gap-4"><div><strong className="block text-[13.5px]">VINYL</strong><span className="mt-1 block text-[10.5px] text-[#BBCBB2]/70">版本 2.4.0 · 本地优先的黑胶收藏与播放</span></div><span className="text-[10px] font-mono text-[#71ef68]">LATEST</span></div>
          </div>
        </section>
      </div>
    </div>
  );
};
