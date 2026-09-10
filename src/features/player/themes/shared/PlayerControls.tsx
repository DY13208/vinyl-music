import React from 'react';
import { Pause, Play, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { hapticsService } from '../../../../platform/platformService';
import type { RepeatMode } from '../PlayerTheme';
interface Props {
  isPlaying:boolean; loading:boolean; shuffle:boolean; repeatMode:RepeatMode;
  artwork?:string;
  onTogglePlay:()=>void; onPrevTrack:()=>void; onNextTrack:()=>void;
  onShuffleChange:(value:boolean)=>void; onRepeatChange:(value:RepeatMode)=>void;
}
export function PlayerControls(props:Props) {
  const invoke=(action:()=>void)=>{action();hapticsService.triggerHaptic('light');};
  return <div className="full-player__transport pt-transport">
    <button id="player-btn-shuffle" type="button" title="随机播放" aria-label="随机播放" aria-pressed={props.shuffle} onClick={()=>invoke(()=>props.onShuffleChange(!props.shuffle))}><Shuffle size={18}/></button>
    <button id="player-btn-prev" type="button" title="上一首" aria-label="上一首" onClick={()=>invoke(props.onPrevTrack)}><SkipBack size={23}/></button>
    <button id="player-btn-play-pause" type="button" className="full-player__play" data-playing={props.isPlaying} aria-label={props.loading?'正在加载试听':props.isPlaying?'暂停':'播放'} disabled={props.loading} onClick={()=>invoke(props.onTogglePlay)}>
      {props.artwork && <img src={props.artwork} alt="" draggable={false}/>}<span aria-hidden="true">{props.isPlaying?<Pause size={20} fill="currentColor"/>:<Play size={20} fill="currentColor"/>}</span>
    </button>
    <button id="player-btn-next" type="button" title="下一首" aria-label="下一首" onClick={()=>invoke(props.onNextTrack)}><SkipForward size={23}/></button>
    <button id="player-btn-repeat" type="button" title="循环模式" aria-label={`循环模式：${props.repeatMode==='off'?'关闭':props.repeatMode==='all'?'全部':'单曲'}`} aria-pressed={props.repeatMode!=='off'} data-repeat-mode={props.repeatMode} onClick={()=>invoke(()=>props.onRepeatChange(props.repeatMode==='off'?'all':props.repeatMode==='all'?'one':'off'))}>{props.repeatMode==='one'?<Repeat1 size={18}/>:<Repeat size={18}/>}</button>
  </div>;
}
