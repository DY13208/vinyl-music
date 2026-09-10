import React from 'react';
import type { PlayerStageProps,PlayerThemeId } from './PlayerTheme';
import { playerThemeRegistry } from './playerThemeRegistry';
export function PlayerThemeRenderer({themeId,...props}:PlayerStageProps & {themeId:PlayerThemeId}) {
  const Stage=playerThemeRegistry[themeId].Stage;
  return <Stage {...props}/>;
}
