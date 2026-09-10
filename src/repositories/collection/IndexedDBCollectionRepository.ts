import type { Album } from '../../types';
import type { CollectionRepository } from './CollectionRepository';
import type { StorageService } from '../../platform/storage/StorageService';
import { idbGet, idbPut } from '../../platform/db/VinylDatabase';
const KEY='vinyl_user_collection';
export class IndexedDBCollectionRepository implements CollectionRepository {
 private albums: Album[]; private ready=false;
 constructor(private storage:StorageService, private defaults:Album[]){ this.albums=defaults; void this.migrate(); }
 private async migrate(){ try { const done=await idbGet<boolean>('meta','collection-migration-v1'); let data=await idbGet<Album[]>('collections',KEY); if(!data && !done){ const raw=this.storage.getItem(KEY); const parsed=raw?JSON.parse(raw):null; if(Array.isArray(parsed)){ data=parsed; await idbPut('collections',KEY,parsed); } await idbPut('meta','collection-migration-v1',true); } if(Array.isArray(data)&&data.length)this.albums=data; } catch(e){ console.warn('IndexedDB migration failed; retaining local data',e); } finally {this.ready=true;} }
 getAlbums(){ return this.albums; }
 saveAlbum(a:Album){ return this.commit([a,...this.albums.filter(x=>x.id!==a.id)]); }
 saveAlbums(as:Album[]){const ids=new Set(this.albums.map(x=>x.id)); const titles=new Set(this.albums.map(x=>x.title.toLowerCase().trim())); return this.commit([...as.filter(x=>!ids.has(x.id)&&!titles.has(x.title.toLowerCase().trim())),...this.albums]);}
 updateAlbum(a:Album){return this.commit(this.albums.map(x=>x.id===a.id?a:x));}
 deleteAlbum(id:string){return this.commit(this.albums.filter(x=>x.id!==id));}
 private commit(v:Album[]){this.albums=v; void idbPut('collections',KEY,v).catch(e=>console.error('collection save failed',e)); return v;}
}
