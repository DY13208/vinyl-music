import React from 'react';
import { GalleryHorizontalEnd, LayoutGrid, PanelsTopLeft } from 'lucide-react';
import { BrowseMode } from '../../hooks/useAlbumBrowserState';
import { GooeyNav, type GooeyNavItem } from '../rare-ui/GooeyNav';

export function BrowseModeSwitch({ mode, onChange, allowDefault = false }: { mode: BrowseMode; onChange: (mode: BrowseMode) => void; allowDefault?: boolean }) {
  const items: GooeyNavItem<BrowseMode>[] = [
    ...(allowDefault ? [{ value: 'default' as const, label: '主题陈列', icon: <PanelsTopLeft size={17} aria-hidden="true" /> }] : []),
    { value: 'grid', label: '封面矩阵墙', icon: <LayoutGrid size={17} aria-hidden="true" /> },
    { value: 'spine', label: '唱片长廊', icon: <GalleryHorizontalEnd size={17} aria-hidden="true" /> },
  ];
  return <div className="browse-mode-switch">
    <GooeyNav items={items} value={mode} onChange={onChange} label="横屏浏览模式" />
  </div>;
}
