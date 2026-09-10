import React, { useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { CollectionBrowseState, genres, SortOption } from '../../hooks/useCollectionBrowseState';
import type { CollectionThemeState } from './themes/useCollectionTheme';
import { collectionThemes } from './themes/collectionThemeRegistry';
import type { CollectionThemeId, CollectionViewMode } from './themes/CollectionTheme';

export const collectionModes = [{id:'default',label:'主题陈列'},{id:'gallery-grid',label:'封面矩阵墙'},{id:'spine-carousel',label:'唱片长廊'}] as const;
export function CollectionActionMenu({open,onClose,filters,preference,onAddVinyl}:{open:boolean;onClose:()=>void;filters:CollectionBrowseState;preference:CollectionThemeState;onAddVinyl:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(open && !dialog.current?.open) dialog.current?.showModal();else if(!open && dialog.current?.open) dialog.current.close();},[open]);
  return <dialog ref={dialog} className="ct-action-menu" aria-labelledby="collection-actions-title" onCancel={onClose} onClose={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div className="ct-action-menu__content">
      <header><h2 id="collection-actions-title">收藏选项</h2><button type="button" aria-label="关闭收藏选项" onClick={onClose}><X size={18}/></button></header>
      <button type="button" className="ct-action-menu__add" onClick={()=>{onClose();onAddVinyl();}}><Plus size={17}/>新增唱片</button>
      <label>排序方式<select aria-label="排序方式" value={filters.sort} onChange={event=>filters.setSort(event.target.value as SortOption)}><option value="recent">最近收藏</option><option value="artist">艺术家</option><option value="year">发行年份</option></select></label>
      <fieldset><legend>分类筛选</legend><div className="ct-action-menu__genres">{genres.map(genre=><button type="button" key={genre} aria-pressed={genre===filters.genre} onClick={()=>filters.setGenre(genre)}>{genre}</button>)}</div></fieldset>
      <label>浏览模式<select aria-label="浏览模式" value={preference.viewMode} onChange={event=>preference.setViewMode(event.target.value as CollectionViewMode)}>{collectionModes.map(mode=><option key={mode.id} value={mode.id}>{mode.label}</option>)}</select></label>
      <label>收藏页主题<select aria-label="收藏页主题" value={preference.themeId} onChange={event=>preference.setTheme(event.target.value as CollectionThemeId)}>{collectionThemes.map(theme=><option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label>
      {(preference.message || preference.viewMessage) && <p role="status">{preference.message || preference.viewMessage}</p>}
      <button type="button" className="ct-action-menu__done" onClick={onClose}>完成</button>
    </div>
  </dialog>;
}
