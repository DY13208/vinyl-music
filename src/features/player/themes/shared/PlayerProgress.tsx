import React from 'react';
const formatTime=(seconds:number)=>{const safe=Number.isFinite(seconds)?Math.max(0,seconds):0;return `${Math.floor(safe/60)}:${String(Math.floor(safe%60)).padStart(2,'0')}`;};
export function PlayerProgress({progress,currentTime,duration,onSeek}:{progress:number;currentTime:number;duration:number;onSeek:(percent:number)=>void}) {
  const value=Number.isFinite(progress)?Math.min(100,Math.max(0,progress)):0;
  return <div className="full-player__progress pt-progress" style={{'--played':`${value}%`} as React.CSSProperties}>
    <input id="player-progress-track" type="range" min="0" max="100" step="0.1" aria-label="播放进度" aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`} value={value} onChange={event=>onSeek(Number(event.target.value))}/>
    <div><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
  </div>;
}
