import type { Album } from '../../types';
import type { CollectionRepository } from './CollectionRepository';
import type { StorageService } from '../../platform/storage/StorageService';
import { idbGet, idbPut } from '../../platform/db/VinylDatabase';
import { cleanLegacyAlbum } from '../../utils/legacyAlbumMetadata';
const KEY='vinyl_user_collection';
export class IndexedDBCollectionRepository implements CollectionRepository {
 private albums: Album[]; private ready=false;
 private readonly initialization: Promise<void>;
 constructor(private storage:StorageService, defaults:Album[], private db = { get: idbGet, put: idbPut }) {
   this.albums = defaults;
   try {
     const raw = storage.getItem(KEY);
     const parsed = raw ? JSON.parse(raw) : null;
     if (Array.isArray(parsed)) this.albums = parsed.map(cleanLegacyAlbum);
   } catch (error) { console.warn('Unable to read legacy collection', error); }
   this.initialization = this.migrate();
 }
 private async migrate() {
   try {
     const done = await this.db.get<boolean>('meta', 'collection-migration-v1');
     let data = await this.db.get<Album[]>('collections', KEY);
     if (!data && !done) {
       const raw = this.storage.getItem(KEY);
       const parsed = raw ? JSON.parse(raw) : null;
       if (Array.isArray(parsed)) { data = parsed; await this.db.put('collections', KEY, parsed); }
       await this.db.put('meta', 'collection-migration-v1', true);
     }
     if (Array.isArray(data)) this.albums = data.map(cleanLegacyAlbum);
   } catch (error) { console.warn('IndexedDB migration failed; retaining local data', error); }
   finally { this.ready = true; }
 }
 whenReady() { return this.initialization; }
 getAlbums(){ return this.albums; }
 saveAlbum(a:Album){ return this.commit([a,...this.albums.filter(x=>x.id!==a.id)]); }
 saveAlbums(as:Album[]){const ids=new Set(this.albums.map(x=>x.id)); const titles=new Set(this.albums.map(x=>x.title.toLowerCase().trim())); return this.commit([...as.filter(x=>!ids.has(x.id)&&!titles.has(x.title.toLowerCase().trim())),...this.albums]);}
 updateAlbum(a:Album){return this.commit(this.albums.map(x=>x.id===a.id?a:x));}
 deleteAlbum(id:string){return this.commit(this.albums.filter(x=>x.id!==id));}
 private commit(v:Album[]){if(!this.ready) throw new Error('馆藏正在加载，请稍后重试'); this.albums=v.map(cleanLegacyAlbum); void this.db.put('collections',KEY,this.albums).catch(e=>console.error('collection save failed',e)); return this.albums;}
}
