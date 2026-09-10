import React from 'react';
import { Check } from 'lucide-react';
import { CollectionThemeState } from './useCollectionTheme';
import { collectionThemes } from './collectionThemeRegistry';
import { CollectionThemePreview } from './CollectionThemePreview';
import './collectionThemes.css';
export function CollectionThemePicker({ preference }: { preference: CollectionThemeState }) {
  return <section className="ct-picker" aria-labelledby="collection-theme-title"><h2 id="collection-theme-title">收藏页主题</h2><div className="ct-picker__choices" role="group" aria-label="收藏页主题">{collectionThemes.map(theme => <button key={theme.id} type="button" className="ct-picker__option" aria-pressed={preference.themeId === theme.id} onClick={() => preference.setTheme(theme.id)}><CollectionThemePreview theme={theme} /><span className="ct-picker__name">{theme.name}{preference.themeId === theme.id && <Check size={16} aria-hidden="true" />}</span><span className="ct-picker__description">{theme.description}</span></button>)}</div>{preference.message && <p role="status">{preference.message}</p>}</section>;
}
