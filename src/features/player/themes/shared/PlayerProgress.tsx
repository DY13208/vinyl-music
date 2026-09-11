import React from 'react';
const formatTime=(seconds:number)=>{const safe=Number.isFinite(seconds)?Math.max(0,seconds):0;return `${Math.floor(safe/60)}:${String(Math.floor(safe%60)).padStart(2,'0')}`;};
export function PlayerProgress({progress,currentTime,duration,onSeek,animated=false}:{progress:number;currentTime:number;duration:number;onSeek:(percent:number)=>void;animated?:boolean}) {
  const value=Number.isFinite(progress)?Math.min(100,Math.max(0,progress)):0;
  return <div className="full-player__progress pt-progress" style={{'--played':`${value}%`} as React.CSSProperties}>
    {animated && <span className="pt-progress__wave" aria-hidden="true">
      <svg viewBox="0 0 100 12" preserveAspectRatio="none">
        <path className="pt-progress__wave-base" d="M0 6 C8 5 12 4 17 6 S26 8 34 6 S45 4 53 7 S64 4 73 6 S84 5 100 6" pathLength="100" />
        <path className="pt-progress__wave-played" d="M0 6 C8 5 12 4 17 6 S26 8 34 6 S45 4 53 7 S64 4 73 6 S84 5 100 6" pathLength="100" strokeDasharray={`${value} 100`} />
      </svg>
      <i className="pt-progress__wave-thumb" style={{ left: `${value}%` }} />
    </span>}
    <input id="player-progress-track" type="range" min="0" max="100" step="0.1" aria-label="播放进度" aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`} value={value} onChange={event=>onSeek(Number(event.target.value))}/>
    <div><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
  </div>;
}
