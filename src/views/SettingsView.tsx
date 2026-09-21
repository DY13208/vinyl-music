import React, { useEffect, useState } from 'react';
import { artworkService } from '../platform/artwork/WebArtworkAdapter';
import { importLegacyCollection } from '../platform/storage/LegacyCollectionImport';
import type { Album } from '../types';
import { ArrowLeft, ChevronRight, Check } from 'lucide-react';
import { hapticsService } from '../platform/platformService';
import { CollectionThemePicker } from '../features/collection/themes/CollectionThemePicker';
import { CollectionThemeState } from '../features/collection/themes/useCollectionTheme';
import { PlayerThemeSelector } from '../features/player/themes/settings/PlayerThemeSelector';
import type { PlayerThemePreference } from '../features/player/themes/usePlayerTheme';
import { HOME_THEMES, HomeTheme } from '../hooks/useHomeTheme';
import { useAuth } from '../auth/AuthContext';

interface SettingsViewProps {
  onImportLegacy?: (albums: Album[]) => Promise<void>;
  onBack: () => void;
  floatingPlayerVisible: boolean;
  onFloatingPlayerVisibleChange: (visible: boolean) => void;
  preferenceMessage: string;
  collectionTheme: CollectionThemeState;
  playerTheme: PlayerThemePreference;
  homeTheme: HomeTheme;
  onSelectHomeTheme: (theme: HomeTheme) => void;
  homeThemeMessage: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack, floatingPlayerVisible, onFloatingPlayerVisibleChange, preferenceMessage, collectionTheme, playerTheme, homeTheme, onSelectHomeTheme, homeThemeMessage, onImportLegacy }) => {
  const auth = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importing, setImporting] = useState(false);
  const importOriginal = async () => {
    if (!onImportLegacy) return;
    setImporting(true);
    try { const count = await importLegacyCollection(onImportLegacy); setImportMessage(count ? `已读取 ${count} 张原有唱片，重复唱片自动跳过，原始数据仍保留在本机。` : '没有找到未登录时的本机馆藏。'); }
    catch (error) { setImportMessage(error instanceof Error ? error.message : '导入失败'); }
    finally { setImporting(false); }
  };
  const [crossfade, setCrossfade] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [riaaEq, setRiaaEq] = useState(true);
  const [needleCrackle, setNeedleCrackle] = useState(true);
  const [cacheSize, setCacheSize] = useState('读取中');
  const [savedSize, setSavedSize] = useState('读取中');
  const [cacheMessage, setCacheMessage] = useState('');
  const [clearing, setClearing] = useState(false);
  const refreshCache = async () => {
    const stats = await artworkService.stats();
    const format = (bytes: number) => bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    setCacheSize(format(stats.browsingBytes));
    setSavedSize(format(stats.collectionBytes));
    setCacheMessage(stats.pendingCount ? `${stats.pendingCount} 张唱片架图片尚未保存到本机，请联网后重试；空间不足时请先清理浏览缓存。` : '唱片架封面已保存在本机。');
  };
  useEffect(() => { void refreshCache().catch(() => setCacheMessage('无法读取本地存储，请检查浏览器权限。')); }, []);

  const handleClearCache = async () => {
    setClearing(true);
    try { await artworkService.clearBrowsing(); await refreshCache(); hapticsService.triggerHaptic('medium'); }
    catch { setCacheMessage('缓存清理失败，请稍后重试。'); }
    finally { setClearing(false); }
  };

  return (
    <div
      id="settings-view"
      className="w-full min-h-screen bg-[#000000] text-white flex flex-col select-none pb-24 overflow-y-auto no-scrollbar"
    >
      {/* Header */}
      <header className="px-4 pt-3 pb-2 flex items-center gap-3 sticky top-0 bg-[#000000]/95 backdrop-blur-md z-30 border-b border-[#26272D]">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-[4px] bg-[#0F0F0F] border border-[#26272D] text-white/80 hover:text-white flex items-center justify-center transition-colors"
          title="返回"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-[18px] font-bold text-white tracking-tight">系统设置</h1>
      </header>

      <div className="px-4 py-4 space-y-5">
        <section aria-label="修改密码" className="rounded-[6px] bg-[#0F0F0F] border border-[#26272D] p-3.5 space-y-3">
          <h2 className="text-[16px] font-medium">修改密码</h2>
          <input aria-label="当前密码" type="password" placeholder="当前密码" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="w-full min-h-11 rounded border border-[#343d34] bg-black px-3" />
          <input aria-label="新密码" type="password" placeholder="新密码（至少 12 个字符）" value={newPassword} onChange={event => setNewPassword(event.target.value)} className="w-full min-h-11 rounded border border-[#343d34] bg-black px-3" />
          <input aria-label="确认新密码" type="password" placeholder="确认新密码" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="w-full min-h-11 rounded border border-[#343d34] bg-black px-3" />
          <button type="button" disabled={passwordBusy} onClick={async () => { if (!auth || newPassword !== confirmPassword) { setPasswordMessage('两次输入的新密码不一致'); return; } setPasswordBusy(true); setPasswordMessage(''); try { await auth.changePassword(currentPassword, newPassword); setPasswordMessage('密码已更新，请重新登录'); } catch (error) { setPasswordMessage(error instanceof Error ? error.message : '修改密码失败'); } finally { setPasswordBusy(false); } }} className="min-h-11 px-4 rounded bg-[#2FE92B] text-black font-medium">{passwordBusy ? '正在保存…' : '保存密码'}</button>
          {passwordMessage && <p role="status" className="text-[12px] text-[#BBCBB2]">{passwordMessage}</p>}
        </section>
        <section className="rounded-[6px] bg-[#0F0F0F] border border-[#26272D] p-3.5">
          <div className="flex items-center justify-between gap-4">
            <div><h2 id="floating-player-setting" className="text-[13.5px] font-medium">显示底栏播放器</h2><p id="floating-player-setting-help" className="text-[12px] text-[#BBCBB2] mt-1">隐藏底栏播放按钮后，音乐继续播放</p></div>
            <button type="button" role="switch" aria-checked={floatingPlayerVisible} aria-labelledby="floating-player-setting" aria-describedby="floating-player-setting-help" onClick={() => onFloatingPlayerVisibleChange(!floatingPlayerVisible)} className="w-14 h-11 flex-shrink-0 flex items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-[#2FE92B]">
              <span className={`block w-11 h-6 rounded-full p-0.5 ${floatingPlayerVisible ? 'bg-[#2FE92B]' : 'bg-[#2A2A2C]'}`}><span className={`block w-5 h-5 rounded-full bg-[#0F0F0F] ${floatingPlayerVisible ? 'translate-x-5' : 'translate-x-0'}`} /></span>
            </button>
          </div>
          {preferenceMessage && <p role="status" className="mt-2 text-[12px] text-[#BBCBB2]">{preferenceMessage}</p>}
        </section>
        <section aria-label="外观" className="space-y-3">
          <h2 className="text-[16px] font-medium">外观</h2>
          <details className="pt-settings-section">
            <summary>首页样式</summary>
            <div className="grid grid-cols-2 gap-2">{HOME_THEMES.map(item => <button key={item.id} type="button" aria-pressed={homeTheme === item.id} onClick={() => onSelectHomeTheme(item.id)} className={`min-h-12 rounded border p-3 text-left text-sm ${homeTheme === item.id ? 'border-[#a9d69a] text-[#a9d69a]' : 'border-[#343d34]'}`}>{item.name}</button>)}</div>
            {homeThemeMessage && <p role="status">{homeThemeMessage}</p>}
          </details>
          <CollectionThemePicker preference={collectionTheme} />
          <details className="pt-settings-section">
            <summary>播放器样式</summary>
            <PlayerThemeSelector preference={playerTheme}/>
          </details>
        </section>
        {/* Section 1: 账号与安全 */}
        <section className="space-y-1">
          <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase px-1 font-mono">
            ACCOUNT & SECURITY
          </span>
          <div className="rounded-[6px] bg-[#0F0F0F] border border-[#26272D] overflow-hidden divide-y divide-[#1F2024]">
            <div className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#151518]">
              <span className="text-[13.5px] font-medium text-white">账号与安全</span>
              <div className="flex items-center gap-1.5 text-white/40 text-[12px]">
                <span>晓东 (VIP 发烧级)</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
            <div className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#151518]">
              <span className="text-[13.5px] font-medium text-white">实体黑胶仓库同步</span>
              <div className="flex items-center gap-1.5 text-[#2FE92B] text-[12px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2FE92B]" />
                <span>已同步云端</span>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: 播放与声学设置 */}
        <section className="space-y-1">
          <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase px-1 font-mono">
            AUDIO & PLAYBACK
          </span>
          <div className="rounded-[6px] bg-[#0F0F0F] border border-[#26272D] overflow-hidden divide-y divide-[#1F2024]">
            {/* 音质 */}
            <div className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#151518]">
              <div>
                <p className="text-[13.5px] font-medium text-white">音质标准</p>
                <p className="text-[10.5px] text-[#BBCBB2] opacity-70">模拟母带级 192kHz/24bit 直接刻录</p>
              </div>
              <div className="flex items-center gap-1 text-[#2FE92B] text-[12px] font-mono">
                <span>Master DSD</span>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </div>
            </div>

            {/* 均衡器 */}
            <div className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#151518]">
              <div>
                <p className="text-[13.5px] font-medium text-white">RIAA 标准黑胶均衡器</p>
                <p className="text-[10.5px] text-[#BBCBB2] opacity-70">还原1954年行业唱片刻录曲线</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRiaaEq(!riaaEq);
                  hapticsService.triggerHaptic('light');
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                  riaaEq ? 'bg-[#2FE92B]' : 'bg-[#2A2A2C]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-[#0F0F0F] shadow-sm transition-transform ${
                    riaaEq ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 唱针杂音底噪模拟 */}
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-medium text-white">唱针落盘与温润底噪</p>
                <p className="text-[10.5px] text-[#BBCBB2] opacity-70">模拟真实唱片机触盘微小爆鸣感</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNeedleCrackle(!needleCrackle);
                  hapticsService.triggerHaptic('light');
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                  needleCrackle ? 'bg-[#2FE92B]' : 'bg-[#2A2A2C]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-[#0F0F0F] shadow-sm transition-transform ${
                    needleCrackle ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Crossfade */}
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-medium text-white">曲目无缝平滑过渡 (Crossfade)</p>
                <p className="text-[10.5px] text-[#BBCBB2] opacity-70">唱片AB面自动翻面模拟</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCrossfade(!crossfade);
                  hapticsService.triggerHaptic('light');
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                  crossfade ? 'bg-[#2FE92B]' : 'bg-[#2A2A2C]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-[#0F0F0F] shadow-sm transition-transform ${
                    crossfade ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: 触觉与系统交互 */}
        <section className="space-y-1">
          <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase px-1 font-mono">
            SYSTEM & HAPTIC
          </span>
          <div className="rounded-[6px] bg-[#0F0F0F] border border-[#26272D] overflow-hidden divide-y divide-[#1F2024]">
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-medium text-white">iOS 触觉震动反馈 (Haptic)</p>
                <p className="text-[10.5px] text-[#BBCBB2] opacity-70">拨动黑胶与唱针触碰时的震动</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHapticFeedback(!hapticFeedback);
                  hapticsService.triggerHaptic('medium');
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                  hapticFeedback ? 'bg-[#2FE92B]' : 'bg-[#2A2A2C]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-[#0F0F0F] shadow-sm transition-transform ${
                    hapticFeedback ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-medium text-white">新到黑胶与补货通知</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNotifications(!notifications);
                  hapticsService.triggerHaptic('light');
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                  notifications ? 'bg-[#2FE92B]' : 'bg-[#2A2A2C]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-[#0F0F0F] shadow-sm transition-transform ${
                    notifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 清理缓存 */}
            <button type="button" disabled={clearing}
              onClick={handleClearCache}
              className="w-full text-left p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#151518]"
            >
              <div>
                <p className="text-[13.5px] font-medium text-white">{clearing ? '正在清理…' : '清理浏览封面缓存'}</p>
                <p className="text-[10.5px] text-[#BBCBB2] opacity-70">最多 32 MB，保留唱片架封面和本地音乐</p>
              </div>
              <div className="flex items-center gap-1.5 text-white/40 text-[12px] font-mono">
                <span>{cacheSize}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
            <div className="p-3.5 border-t border-[#26272D] text-[12px] text-[#BBCBB2] space-y-2">
              <p>唱片架图片占用：{savedSize}</p>
              <p role="status">{cacheMessage}</p>
              <p>馆藏与上传图片仅保存在当前设备，不上传服务器。清除站点数据会丢失本地内容；设备之间不会自动同步。</p>
              {onImportLegacy && <><p>如果此设备升级前的馆藏属于你，可将它归入当前账户。只会在本机复制，不会上传。</p><button type="button" disabled={importing} onClick={importOriginal} className="min-h-11 text-[#2FE92B]">{importing ? '正在导入…' : '将原有本机馆藏归入此账户'}</button><p role="status">{importMessage}</p></>}
            </div>
          </div>
        </section>

        {/* Section 4: 关于与版权 */}
        <section className="space-y-1">
          <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase px-1 font-mono">
            ABOUT
          </span>
          <div className="rounded-[6px] bg-[#0F0F0F] border border-[#26272D] p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[13.5px] font-bold text-white">VINYL for iOS & Android</p>
              <p className="text-[10.5px] text-[#BBCBB2] opacity-70">版本 2.4.0 (Build 2026.09)</p>
            </div>
            <span className="text-[11px] font-mono text-[#2FE92B]">LATEST</span>
          </div>
        </section>
      </div>
    </div>
  );
};
