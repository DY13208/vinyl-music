import React from 'react';
import type { PlayerThemeId } from '../PlayerTheme';
const arrangements:Record<PlayerThemeId,number[][]>={crescent:[[58,14],[77,31],[82,56],[65,77]],halo:[[30,16],[68,20],[79,59],[44,80],[17,52]],nocturne:[[22,78],[47,61],[72,42],[53,17]],classic:[[72,23]]};
export function PlayerThemePreview({themeId}:{themeId:PlayerThemeId}) {
  return <span className={`pt-preview pt-preview--${themeId}`} aria-hidden="true"><span className="pt-preview__disc"/>{arrangements[themeId].map(([x,y],index)=><span key={index} className={`pt-preview__card ${index===1?'is-current':''}`} style={{left:`${x}%`,top:`${y}%`,backgroundImage:`url('/assets/browse-demo/cover-0${index+1}.svg')`}}/>)}<span className="pt-preview__line"/></span>;
}
