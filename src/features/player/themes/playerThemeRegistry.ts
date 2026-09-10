import { CrescentPlayer } from './themes/crescent/CrescentPlayer';
import { HaloOrbitPlayer } from './themes/halo/HaloOrbitPlayer';
import { NocturnePlayer } from './themes/nocturne/NocturnePlayer';
import { ClassicPlayer } from './themes/ClassicPlayer';
import type { PlayerThemeDefinition, PlayerThemeId, PlayerTokens } from './PlayerTheme';
const base:PlayerTokens={
  '--player-bg':'#101110','--player-surface':'#1a1d1a','--player-text':'#eeeade','--player-muted':'#a6afa4',
  '--player-accent':'#b6d497','--player-glow':'#a1c08030','--player-control-bg':'#22261f','--player-control-border':'#3c4436',
  '--player-vinyl':'#0a0b0a','--player-waveform':'#77846e',
};
export const playerThemeRegistry:Record<PlayerThemeId,PlayerThemeDefinition>={
  crescent:{id:'crescent',name:'新月唱片轨道',description:'象牙微光 · 沿弧聆听',tokens:base,Stage:CrescentPlayer},
  halo:{id:'halo',name:'光环轨道',description:'环绕唱片 · 绿光低回',tokens:{...base,'--player-bg':'#090f0d','--player-accent':'#9bc5aa','--player-glow':'#70af8d30','--player-control-bg':'#182820','--player-waveform':'#668d78'},Stage:HaloOrbitPlayer},
  nocturne:{id:'nocturne',name:'夜航指针',description:'夜色留白 · 唱片漫游',tokens:{...base,'--player-bg':'#080b0a','--player-accent':'#c1ceac','--player-control-bg':'#252c23','--player-glow':'#afc39724'},Stage:NocturnePlayer},
  classic:{id:'classic',name:'经典唱机',description:'保留原有实体唱盘',tokens:base,Stage:ClassicPlayer},
};
