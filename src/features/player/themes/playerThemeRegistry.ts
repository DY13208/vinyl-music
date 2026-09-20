import { CrescentPlayer } from './themes/crescent/CrescentPlayer';
import { HaloOrbitPlayer } from './themes/halo/HaloOrbitPlayer';
import { NocturnePlayer } from './themes/nocturne/NocturnePlayer';
import { ClassicPlayer } from './themes/ClassicPlayer';
import type { PlayerThemeDefinition, PlayerThemeId, PlayerTokens } from './PlayerTheme';
const base:PlayerTokens={
  '--player-bg':'#101110','--player-surface':'#1a1d1a','--player-text':'#eeeade','--player-muted':'#a6afa4',
  '--player-accent':'#b6d497','--player-glow':'#a1c08030','--player-control-bg':'#f1f2ed','--player-control-border':'#3c4436',
  '--player-vinyl':'#0a0b0a','--player-waveform':'#77846e',
};
export const playerThemeRegistry:Record<PlayerThemeId,PlayerThemeDefinition>={
  crescent:{id:'crescent',name:'半幅黑胶',description:'专辑原色 · 流光进度',tokens:{...base,'--player-bg':'#111413','--player-vinyl':'#090b0a','--player-accent':'#bddcd1','--player-waveform':'#bddcd1'},Stage:CrescentPlayer},
  halo:{id:'halo',name:'苔绿轨道',description:'深绿唱盘 · 柔和状态光',tokens:{...base,'--player-bg':'#050706','--player-accent':'#b8d6a4','--player-glow':'#85b56d2b','--player-control-bg':'#f2f3ee','--player-control-border':'#30362f','--player-vinyl':'#213329','--player-waveform':'#81b79b'},Stage:HaloOrbitPlayer},
  nocturne:{id:'nocturne',name:'午夜轨道',description:'黑胶唱盘 · 冷蓝声纹',tokens:{...base,'--player-bg':'#040506','--player-accent':'#dce6ff','--player-control-bg':'#f4f5f7','--player-control-border':'#292d35','--player-vinyl':'#050608','--player-waveform':'#4f8dff','--player-glow':'#397cff2b'},Stage:NocturnePlayer},
  classic:{id:'classic',name:'经典实体唱机',description:'原始唱盘 · 实体唱臂',tokens:{...base,'--player-bg':'#070706','--player-accent':'#f0eee5','--player-control-bg':'#f0eee8','--player-vinyl':'#090909','--player-waveform':'#bbb593'},Stage:ClassicPlayer},
};
