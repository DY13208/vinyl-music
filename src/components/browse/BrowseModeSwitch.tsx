import React from 'react';
import { GalleryHorizontalEnd, LayoutGrid, PanelsTopLeft } from 'lucide-react';
import { BrowseMode } from '../../hooks/useAlbumBrowserState';

export function BrowseModeSwitch({ mode, onChange, allowDefault = false }: { mode: BrowseMode; onChange: (mode: BrowseMode) => void; allowDefault?: boolean }) {
  return <div className="browse-modes" role="group" aria-label="横屏浏览模式">
    {allowDefault && <button type="button" aria-pressed={mode === 'default'} onClick={() => onChange('default')}><PanelsTopLeft size={17} aria-hidden="true" /><span>主题陈列</span></button>}
    <button type="button" aria-pressed={mode === 'grid'} onClick={() => onChange('grid')}><LayoutGrid size={17} aria-hidden="true" /><span>封面矩阵墙</span></button>
    <button type="button" aria-pressed={mode === 'spine'} onClick={() => onChange('spine')}><GalleryHorizontalEnd size={17} aria-hidden="true" /><span>唱片长廊</span></button>
  </div>;
}
