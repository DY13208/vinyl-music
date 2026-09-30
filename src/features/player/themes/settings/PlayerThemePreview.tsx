import React from 'react';
import type { PlayerThemeId } from '../PlayerTheme';
const arrangements:Record<PlayerThemeId,number[][]>={crescent:[],halo:[[18,14],[38,30],[46,50],[38,70],[18,86]],nocturne:[[18,14],[38,30],[46,50],[38,70],[18,86]],classic:[],'luminous-card':[]};
export function PlayerThemePreview({themeId}:{themeId:PlayerThemeId}) {
  if (themeId === 'classic') {
    return <span className="pt-preview pt-preview--classic" aria-hidden="true">
      <span className="pt-preview__turntable">
        <span className="pt-preview__disc" />
        <span className="pt-preview__tonearm" />
      </span>
    </span>;
  }
  if (themeId === 'luminous-card') {
    return <span className="pt-preview pt-preview--luminous-card" aria-hidden="true">
      <span className="pt-preview__luminous-cover" />
      <span className="pt-preview__luminous-copy"><i /><i /></span>
      <span className="pt-preview__luminous-progress"><i /></span>
      <span className="pt-preview__luminous-play" />
    </span>;
  }
  return <span className={`pt-preview pt-preview--${themeId}`} aria-hidden="true"><span className="pt-preview__disc"/>{arrangements[themeId].map(([x,y],index)=><span key={index} className={`pt-preview__card ${index===1?'is-current':''}`} style={{left:`${x}%`,top:`${y}%`,backgroundImage:`url('/assets/browse-demo/cover-0${index+1}.svg')`}}/>)}<span className="pt-preview__line"/></span>;
}
