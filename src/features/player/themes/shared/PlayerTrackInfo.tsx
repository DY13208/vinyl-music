import React from 'react';
import { Heart, Upload } from 'lucide-react';
import type { TrackSource } from '../../../../music';
import type { Album, Track } from '../../../../types';
interface Props {album:Album;currentTrack:Track;favorite:boolean;onToggleFavorite:()=>void;playbackSource:TrackSource|null;playbackMessage:string;loading:boolean;onImportLocalSource:()=>void;localImportPending:boolean}
export function PlayerTrackInfo(props:Props) {
  return <div className="full-player__info pt-track-info">
    <div className="pt-track-info__heading"><h2 title={props.currentTrack.title}>{props.currentTrack.title}</h2><button type="button" id="player-favorite" aria-label={props.favorite?'取消收藏当前专辑':'收藏当前专辑'} aria-pressed={props.favorite} onClick={props.onToggleFavorite}><Heart size={20} fill={props.favorite?'currentColor':'none'}/></button></div>
    <p title={`${props.album.artist} · ${props.album.title}`}>{props.album.artist} · {props.album.title}</p>
    <div className="full-player__source" aria-live="polite" aria-busy={props.loading}>
      <span>{props.playbackMessage}</span>
      {props.playbackSource?.metadata.storeUrl && <a href={props.playbackSource.metadata.storeUrl} target="_blank" rel="noreferrer">在 Apple Music 查看</a>}
      <button type="button" onClick={props.onImportLocalSource} disabled={props.loading}><Upload/>{props.localImportPending?'确认绑定本地音源':'导入本地音源'}</button>
    </div>
  </div>;
}
