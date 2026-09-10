import type { Track } from '../../../../types';
import type { OrbitThemeId } from '../PlayerTheme';
export interface Point { x: number; y: number }
export interface OrbitItem extends Point { track: Track; size: number; active: boolean }
// One coordinate system for the wheel, sleeves and pointer, at every viewport size.
export const ORBIT_STAGE = { width: 400, height: 520, centerX: 0, centerY: 260, radius: 248, sleeveRadius: 207 };
const orbitPoints: Point[] = [-70, -35, 0, 35, 70].map(degrees => {
  const angle = degrees * Math.PI / 180;
  return { x: ORBIT_STAGE.centerX + ORBIT_STAGE.sleeveRadius * Math.cos(angle), y: ORBIT_STAGE.centerY + ORBIT_STAGE.sleeveRadius * Math.sin(angle) };
});
const points: Record<OrbitThemeId, Point[]> = {crescent:orbitPoints,halo:orbitPoints,nocturne:orbitPoints};

/** A bounded window of the real queue; never invent or duplicate tracks to fill a ring. */
export function getOrbitItems(queue: Track[], currentTrack: Track, theme: OrbitThemeId): OrbitItem[] {
  const unique = queue.filter((track, index) => queue.findIndex(item => item.id === track.id) === index);
  if (!unique.some(track => track.id === currentTrack.id)) unique.push(currentTrack);
  const index = unique.findIndex(track => track.id === currentTrack.id);
  const offsets = [-2,-1,0,1,2];
  return offsets.flatMap((offset, slot) => {
    if (!unique.length) return [];
    const track = unique[(index + offset + unique.length) % unique.length];
    const closerDuplicate = offsets.some(other => (Math.abs(other) < Math.abs(offset) || (Math.abs(other) === Math.abs(offset) && other < offset))
      && unique[(index + other + unique.length) % unique.length].id === track.id);
    if (closerDuplicate) return [];
    return [{ ...points[theme][slot], track, active: offset === 0, size: offset === 0 ? 72 : 54 }];
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
