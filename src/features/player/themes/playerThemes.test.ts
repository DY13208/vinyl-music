import assert from 'node:assert/strict';
import test from 'node:test';
import { readPlayerTheme, PLAYER_THEME_KEY, PLAYER_THEME_IDS } from './playerThemePreference';
import { getOrbitItems, getPointerPath } from './shared/orbitGeometry';
import type { OrbitThemeId } from './PlayerTheme';
import type { Track } from '../../../types';
const tracks:Track[]=Array.from({length:30},(_,i)=>({id:`track-${i}`,number:i+1,title:`Track ${i}`,duration:'3:00',durationSec:180}));
test('player preference is isolated and survives storage round trips with safe invalid/denied fallback',()=>{
  const values:Record<string,string>={collection_theme:'glass',collection_view_mode:'spine-carousel'};
  const storage={getItem:(key:string)=>values[key]??null,setItem:(key:string,value:string)=>{values[key]=value;},removeItem:(key:string)=>{delete values[key];}};
  assert.equal(readPlayerTheme(storage),'crescent');
  for(const theme of PLAYER_THEME_IDS){storage.setItem(PLAYER_THEME_KEY,theme);assert.equal(readPlayerTheme(storage),theme);}
  assert.equal(values.collection_theme,'glass');assert.equal(values.collection_view_mode,'spine-carousel');
  for(const bad of ['__proto__','{}','future','']){storage.setItem(PLAYER_THEME_KEY,bad);assert.equal(readPlayerTheme(storage),'crescent');}
  assert.equal(readPlayerTheme({...storage,getItem:()=>{throw Error('denied');}}),'crescent');
});
test('orbit windows preserve the real queue and show exactly one current track, including empty/small queues',()=>{
  for(const length of [0,1,2,3,5,7,8,30]) for(const current of tracks.slice(0,Math.max(length,1))) {
    const queue=tracks.slice(0,length),before=JSON.stringify(queue);
    const items=getOrbitItems(queue,current,'halo');
    assert(items.length<=7);assert.equal(items.filter(item=>item.active).length,1);
    assert.equal(new Set(items.map(item=>item.track.id)).size,items.length);
    assert(items.some(item=>item.track===current));assert.equal(JSON.stringify(queue),before);
  }
});
test('pointer follows every current slot in every theme without crossing any sleeve',()=>{
  for(const theme of ['crescent','halo','nocturne'] as OrbitThemeId[]) for(const length of [1,2,3,4,5,6,7,12]) for(const current of tracks.slice(0,length)) {
    const items=getOrbitItems(tracks.slice(0,length),current,theme),path=getPointerPath(items);
    assert(path,`${theme}/${length}/${current.id} needs a route`);
    const pairs=[...path.matchAll(/[ML] ([\d.-]+) ([\d.-]+)/g)].map(match=>({x:Number(match[1]),y:Number(match[2])}));
    const active=items.find(item=>item.active)!;
    assert.deepEqual(pairs.at(-1),{x:active.x+active.size/2+2,y:active.y});
    assert(pairs.at(-2)!.x>pairs.at(-1)!.x,'arrow must face into the sleeve');
    for(let i=1;i<pairs.length;i++) for(const item of items) {
      const a=pairs[i-1],b=pairs[i],left=item.x-item.size/2,right=item.x+item.size/2,top=item.y-item.size/2,bottom=item.y+item.size/2;
      const intersects=a.x===b.x ? a.x>left && a.x<right && Math.max(a.y,b.y)>top && Math.min(a.y,b.y)<bottom : a.y>top && a.y<bottom && Math.max(a.x,b.x)>left && Math.min(a.x,b.x)<right;
      assert(!intersects,`${theme}/${length}/${current.id} crosses ${item.track.id}`);
    }
  }
});
