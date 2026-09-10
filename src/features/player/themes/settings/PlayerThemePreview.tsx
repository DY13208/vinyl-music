import React from 'react';
import type { PlayerThemeId } from '../PlayerTheme';
const arrangements:Record<PlayerThemeId,number[][]>={crescent:[],halo:[[18,14],[38,30],[46,50],[38,70],[18,86]],nocturne:[[18,14],[38,30],[46,50],[38,70],[18,86]],classic:[]};
export function PlayerThemePreview({themeId}:{themeId:PlayerThemeId}) {
  return <span className={`pt-preview pt-preview--${themeId}`} aria-hidden="true"><span className="pt-preview__disc"/>{arrangements[themeId].map(([x,y],index)=><span key={index} className={`pt-preview__card ${index===1?'is-current':''}`} style={{left:`${x}%`,top:`${y}%`,backgroundImage:`url('/assets/browse-demo/cover-0${index+1}.svg')`}}/>)}<span className="pt-preview__line"/></span>;
}
