import React, { useState } from 'react';
import { Album, ScreenId, DevicePlatform } from '../types';
import { Eye, Smartphone, ArrowRight, Disc, Sparkles } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface DesignBoardViewProps {
  albums: Album[];
  onOpenScreen: (screen: ScreenId) => void;
  platform: DevicePlatform;
  onTogglePlatform: (platform: DevicePlatform) => void;
}

export const DesignBoardView: React.FC<DesignBoardViewProps> = ({
  albums,
  onOpenScreen,
  platform,
  onTogglePlatform,
}) => {
  const screensMeta: {
    id: string;
    screenId: ScreenId;
    indexStr: string;
    title: string;
    subtitle: string;
    specs: string;
  }[] = [
    {
      id: 's-01',
      screenId: 'splash',
      indexStr: '01',
      title: '启动页',
      subtitle: '让音乐，回到生活的形状',
      specs: '黑胶质感渐变 · 极简标语 · 触感入场',
    },
    {
      id: 's-02',
      screenId: 'home',
      indexStr: '02',
      title: '首页 (黑胶轮播)',
      subtitle: '早上好，今天想听哪一张？',
      specs: '45%-60% 巨大黑胶居中 · 阻尼手势吸附 · #2FE92B 播放',
    },
    {
      id: 's-03',
      screenId: 'player',
      indexStr: '03',
      title: '播放页 (唱片机)',
      subtitle: '正在播放 · 拟物唱针与转盘',
      specs: '唱针落盘/起跳 · 慢速旋转 · 动态波形 · 模拟底噪',
    },
    {
      id: 's-04',
      screenId: 'album_detail',
      indexStr: '04',
      title: '专辑详情',
      subtitle: 'The Dark Side of the Moon',
      specs: '抽出的黑胶碟片 · 50周年重制版 · 完整曲目试听',
    },
    {
      id: 's-05',
      screenId: 'collection',
      indexStr: '05',
      title: '唱片库 (我的黑胶)',
      subtitle: 'Grid & Shelf 实体唱片架',
      specs: '实体黑胶层叠排列 · 翻阅手感 · 风格分类过滤器',
    },
    {
      id: 's-06',
      screenId: 'discover',
      indexStr: '06',
      title: '发现页',
      subtitle: '发现黑胶 · 声音考古志',
      specs: '本周推荐转盘 · 深度黑胶故事 · 馆藏编辑推荐',
    },
    {
      id: 's-07',
      screenId: 'search',
      indexStr: '07',
      title: '搜索页',
      subtitle: 'Album First 排序架构',
      specs: '专辑优先呈现 · 艺术家次之 · 经典热搜词',
    },
    {
      id: 's-08',
      screenId: 'artist_detail',
      indexStr: '08',
      title: '艺术家页',
      subtitle: 'Pink Floyd',
      specs: '巨幅乐队影像 · 完整唱片目录 · 已收藏版本标记',
    },
    {
      id: 's-09',
      screenId: 'collection',
      indexStr: '09',
      title: '我的收藏 (唱片架)',
      subtitle: '模拟实体唱片架层叠翻阅',
      specs: '黑胶书脊露边 · 触摸提起预览 · 实体箱槽光影',
    },
    {
      id: 's-10',
      screenId: 'wishlist',
      indexStr: '10',
      title: '愿望单',
      subtitle: '还未拥有的黑胶',
      specs: '压盘版本信息 · #FF9821 价格高亮 · 唱片成色等级',
    },
    {
      id: 's-11',
      screenId: 'profile',
      indexStr: '11',
      title: '个人主页',
      subtitle: '晓东 · 128 张黑胶收藏',
      specs: '黑胶数量统计 · 1,024 小时播放 · 发烧通行证',
    },
    {
      id: 's-12',
      screenId: 'settings',
      indexStr: '12',
      title: '设置页',
      subtitle: '母带级音质 & 触觉反馈',
      specs: 'RIAA 黑胶均衡曲线 · 唱针杂音模拟 · 312MB 缓存清理',
    },
    {
      id: 's-13',
      screenId: 'landscape',
      indexStr: '13',
      title: '横屏播放',
      subtitle: '唱片展台 · 沉浸式横屏视效',
      specs: '左封套 + 中转盘 + 右曲目歌词 · 实体摆件观赏感',
    },
    {
      id: 's-14',
      screenId: 'landscape',
      indexStr: '14',
      title: '横屏首页',
      subtitle: '宽幅唱片展示台',
      specs: '左右相邻黑胶透视边缘 · 实体黑胶展柜交互体验',
    },
  ];

  return (
    <div
      id="design-board-root"
      className="w-full min-h-screen bg-[#050507] text-white p-4 sm:p-8 select-none"
    >
      {/* Board Header */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-[#26272D] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2FE92B] shadow-[0_0_8px_#2FE92B]" />
            <span className="text-[11px] font-mono tracking-widest text-[#2FE92B] uppercase">
              DESIGN SYSTEM SPECIFICATION BOARD
            </span>
          </div>
          <h1 className="text-[28px] sm:text-[34px] font-black tracking-tight text-white flex items-center gap-3">
            <span>VINYL</span>
            <span className="text-[16px] sm:text-[20px] font-light text-[#BBCBB2]">
              全套高质感黑胶 App 界面设计稿
            </span>
          </h1>
          <p className="text-[13px] text-white/50 max-w-2xl mt-1 leading-relaxed">
            围绕“黑胶收藏、黑胶展示、黑胶播放、专辑文化与实体唱片体验”展开的暗黑编辑风设计系统。严格遵循 #000000 纯黑底色与 #2FE92B 强调色体系，兼容 iOS 与 Android。
          </p>
        </div>

        {/* Platform Device Switcher */}
        <div className="flex items-center gap-2 self-start md:self-end">
          <span className="text-[12px] text-white/40 font-mono">设备形态:</span>
          <div className="flex items-center p-0.5 rounded-[4px] bg-[#0F0F0F] border border-[#26272D]">
            <button
              type="button"
              onClick={() => onTogglePlatform('ios')}
              className={`px-3 py-1 text-[11px] font-mono rounded-[3px] transition-colors ${
                platform === 'ios'
                  ? 'bg-[#2FE92B] text-[#0F0F0F] font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              iOS (Dynamic Island)
            </button>
            <button
              type="button"
              onClick={() => onTogglePlatform('android')}
              className={`px-3 py-1 text-[11px] font-mono rounded-[3px] transition-colors ${
                platform === 'android'
                  ? 'bg-[#2FE92B] text-[#0F0F0F] font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Android (Punch Hole)
            </button>
          </div>
        </div>
      </div>

      {/* 14 Screens Visual Grid (Mirroring the User's Uploaded Presentation Board) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {screensMeta.map((item) => (
          <div
            key={item.id}
            id={`board-card-${item.id}`}
            onClick={() => {
              onOpenScreen(item.screenId);
              audioEngine.triggerHaptic('medium');
            }}
            className="group p-4 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#2FE92B]/60 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Screen Index & Title */}
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[12px] font-mono font-bold text-[#2FE92B]">
                  {item.indexStr}
                </span>
                <span className="text-[9.5px] font-mono text-white/30 tracking-widest uppercase">
                  ACTIVE SPEC
                </span>
              </div>

              <h3 className="text-[16px] font-bold text-white group-hover:text-[#2FE92B] transition-colors flex items-center justify-between">
                <span>{item.title}</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#2FE92B]" />
              </h3>
              <p className="text-[12px] text-[#BBCBB2] opacity-80 mt-1 line-clamp-1">
                {item.subtitle}
              </p>
            </div>

            {/* Spec Footnote */}
            <div className="mt-4 pt-3 border-t border-[#1C1C20] flex items-center justify-between text-[10.5px]">
              <span className="text-white/40 font-mono line-clamp-1 max-w-[200px]">
                {item.specs}
              </span>
              <span className="text-[#2FE92B] font-mono whitespace-nowrap ml-2">
                进入预览 →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Design System Tokens Summary Footer */}
      <div className="max-w-7xl mx-auto mt-10 p-5 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] grid grid-cols-1 md:grid-cols-4 gap-4 text-[12px]">
        <div>
          <span className="text-[#BBCBB2] font-mono block mb-1">主背景与卡片基底</span>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-xs bg-[#000000] border border-white/20" />
            <span className="font-mono text-white">#000000 (Pure Black)</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-4 h-4 rounded-xs bg-[#0F0F0F] border border-white/20" />
            <span className="font-mono text-white">#0F0F0F (Card Base)</span>
          </div>
        </div>

        <div>
          <span className="text-[#BBCBB2] font-mono block mb-1">主强调品牌色</span>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-xs bg-[#2FE92B] shadow-[0_0_8px_#2FE92B]" />
            <span className="font-mono text-[#2FE92B] font-bold">#2FE92B (Vinyl Neon)</span>
          </div>
          <p className="text-[10.5px] text-white/40 mt-1">
            用于选中、播放按键、转盘指示、弱光环
          </p>
        </div>

        <div>
          <span className="text-[#BBCBB2] font-mono block mb-1">微量辅助色 (警告/价格)</span>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-xs bg-[#FF9821]" />
            <span className="font-mono text-[#FF9821]">#FF9821 (Price & Mint)</span>
          </div>
          <p className="text-[10.5px] text-white/40 mt-1">
            严禁大面积泛滥，仅用于小尺寸标价
          </p>
        </div>

        <div>
          <span className="text-[#BBCBB2] font-mono block mb-1">圆角与构图法则</span>
          <p className="text-white font-mono">--radius: 0.25rem (4px/6px)</p>
          <p className="text-[10.5px] text-white/40 mt-1">
            克制直角边缘 · 实体黑胶唱片为绝对视觉中心
          </p>
        </div>
      </div>
    </div>
  );
};
