import type { Track } from '../../../../types';
import type { OrbitThemeId } from '../PlayerTheme';
export interface Point { x: number; y: number }
export interface OrbitItem extends Point { track: Track; size: number; active: boolean }
const points: Record<OrbitThemeId, Point[]> = {
  crescent: [{x:78,y:40},{x:168,y:77},{x:231,y:133},{x:251,y:205},{x:228,y:277},{x:167,y:334},{x:78,y:367}],
  halo: [{x:78,y:91},{x:168,y:59},{x:253,y:110},{x:273,y:208},{x:225,y:304},{x:124,y:333},{x:44,y:240}],
  nocturne: [{x:43,y:340},{x:120,y:300},{x:189,y:254},{x:247,y:195},{x:192,y:129},{x:115,y:87},{x:42,y:50}],
};

/** A bounded window of the real queue; never invent or duplicate tracks to fill a ring. */
export function getOrbitItems(queue: Track[], currentTrack: Track, theme: OrbitThemeId): OrbitItem[] {
  const unique = queue.filter((track, index) => queue.findIndex(item => item.id === track.id) === index);
  if (!unique.some(track => track.id === currentTrack.id)) unique.push(currentTrack);
  const index = unique.findIndex(track => track.id === currentTrack.id);
  const start = Math.max(0, Math.min(index - 3, unique.length - 7));
  return unique.slice(start, start + 7).map((track, i, items) => {
    // Stable slots inside each seven-track window let the pointer visibly follow selection.
    const slot = items.length === 1 ? 3 : Math.round(i * 6 / (items.length - 1));
    return { ...points[theme][slot], track, active: track.id === currentTrack.id, size: track.id === currentTrack.id ? 70 : 55 };
  });
}

/** Orthogonal visibility graph routes the leader around every sleeve, in the stage's coordinates. */
export function getPointerPath(items: OrbitItem[]): string {
  const active = items.find(item => item.active);
  if (!active) return '';
  const boxes = items.map(item => ({ left: item.x-item.size/2-5, right:item.x+item.size/2+5, top:item.y-item.size/2-5, bottom:item.y+item.size/2+5 }));
  const start = {x:326,y:200};
  const end = {x:active.x+active.size/2+6,y:active.y};
  const xs = [...new Set([start.x,end.x, ...boxes.flatMap(b=>[b.left-1,b.right+1])])].sort((a,b)=>a-b);
  const ys = [...new Set([start.y,end.y, ...boxes.flatMap(b=>[b.top-1,b.bottom+1])])].sort((a,b)=>a-b);
  const clear = (a:Point,b:Point) => !boxes.some(box => a.x===b.x
    ? a.x>box.left && a.x<box.right && Math.max(a.y,b.y)>box.top && Math.min(a.y,b.y)<box.bottom
    : a.y>box.top && a.y<box.bottom && Math.max(a.x,b.x)>box.left && Math.min(a.x,b.x)<box.right);
  const nodes = xs.flatMap(x=>ys.map(y=>({x,y})));
  const source = nodes.findIndex(p=>p.x===start.x && p.y===start.y);
  const target = nodes.findIndex(p=>p.x===end.x && p.y===end.y);
  const distances = nodes.map(()=>Infinity), previous = nodes.map(()=>-1), visited = new Set<number>();
  distances[source]=0;
  for(let count=0;count<nodes.length;count++) {
    let best=-1;
    for(let i=0;i<nodes.length;i++) if(!visited.has(i) && (best<0 || distances[i]<distances[best])) best=i;
    if(best<0 || !Number.isFinite(distances[best]) || best===target) break;
    visited.add(best);
    const xi=Math.floor(best/ys.length), yi=best%ys.length;
    const neighbors=[xi>0?best-ys.length:-1,xi<xs.length-1?best+ys.length:-1,yi>0?best-1:-1,yi<ys.length-1?best+1:-1];
    for(const next of neighbors) if(next>=0 && !visited.has(next) && clear(nodes[best],nodes[next])) {
      const distance=distances[best]+Math.abs(nodes[best].x-nodes[next].x)+Math.abs(nodes[best].y-nodes[next].y);
      if(distance<distances[next]) {distances[next]=distance;previous[next]=best;}
    }
  }
  if(!Number.isFinite(distances[target])) return '';
  const route:Point[]=[];
  for(let at=target;at!==-1;at=previous[at]) route.unshift(nodes[at]);
  route.push({x:active.x+active.size/2+2,y:active.y});
  return route.map((point,i)=>`${i?'L':'M'} ${point.x} ${point.y}`).join(' ');
}
