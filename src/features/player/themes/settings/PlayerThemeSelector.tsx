import React from 'react';
import { Check } from 'lucide-react';
import { playerThemeRegistry } from '../playerThemeRegistry';
import type { PlayerThemePreference } from '../usePlayerTheme';
import { PlayerThemePreview } from './PlayerThemePreview';
import '../playerThemes.css';
export function PlayerThemeSelector({preference}:{preference:PlayerThemePreference}) {
  return <div className="pt-selector"><div className="pt-selector__options" role="group" aria-label="播放器样式">
    {[playerThemeRegistry.classic,...Object.values(playerThemeRegistry).filter(theme=>theme.id!=='classic')].map(theme=><button className="pt-selector__option" type="button" key={theme.id} aria-pressed={theme.id===preference.themeId} onClick={()=>preference.setTheme(theme.id)} style={theme.tokens}>
      <PlayerThemePreview themeId={theme.id}/><span className="pt-selector__name">{theme.name}{theme.id===preference.themeId && <Check size={15}/>}</span><small>{theme.description}</small>
    </button>)}
  </div>{preference.message && <p role="status">{preference.message}</p>}</div>;
}
