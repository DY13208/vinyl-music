import React from 'react';
import { CollectionTheme } from './CollectionTheme';
export function CollectionThemePreview({ theme }: { theme: CollectionTheme }) {
  return <div className="ct-preview" data-preview-theme={theme.id} style={theme.tokens} aria-hidden="true"><div className="ct-preview__header"><i /><i /></div><div className="ct-preview__albums">{(theme.coversOnly ? [1, 4, 7, 11, 2, 5, 8, 12, 3] : [1, 4, 7, 11]).map(index => <div key={index}><img src={`/assets/browse-demo/cover-${String(index).padStart(2, '0')}.svg`} alt="" loading="lazy" /><span /></div>)}</div><div className="ct-preview__nav"><i /><i /><i /><i /></div></div>;
}
