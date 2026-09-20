import React from 'react';
import { Pause, Play } from 'lucide-react';
import { AlbumArtwork } from '../../../../components/AlbumArtwork';
import { ORBIT_STAGE, type OrbitItem } from './orbitGeometry';
export const PlayerOrbitCard: React.FC<{item:OrbitItem; artwork:string; isPlaying:boolean; loading:boolean; onActivate:()=>void}> = ({item,artwork,isPlaying,loading,onActivate}) => <button
  type="button" className={`pt-orbit-card ${item.active?'is-current':''}`} data-track-id={item.track.id} aria-current={item.active?'true':undefined}
  aria-label={item.active?`${loading?'正在加载':isPlaying?'暂停':'播放'}：${item.track.title}`:`播放曲目：${item.track.title}`}
  disabled={item.active && loading} title={item.track.title} onClick={onActivate}
  style={{left:`${item.x/ORBIT_STAGE.width*100}%`,top:`${item.y/ORBIT_STAGE.height*100}%`,width:`${item.size/ORBIT_STAGE.width*100}%`}}>
  <AlbumArtwork src={artwork} loading="eager" />
  <span className="pt-orbit-card__number">{String(item.track.number).padStart(2,'0')}</span>
  {item.active && <span className="pt-orbit-card__hotspot" aria-hidden="true">{isPlaying?<Pause size={12}/>:<Play size={12}/>}</span>}
</button>;
