import { WebIndexedDBAdapter, VINYL_DB_NAME } from '../db/VinylDatabase';
import { activeAccountId } from './accountScope';
import type { Album } from '../../types';

const legacyDatabase = new WebIndexedDBAdapter(VINYL_DB_NAME);

export async function importLegacyCollection(save: (albums: Album[]) => Promise<unknown>): Promise<number> {
  const account = activeAccountId();
  if (!account) throw new Error('请先登录');
  // Claim explicitly before copying, so concurrent accounts cannot both inherit
  // an anonymous collection. Originals remain intact as a recovery copy.
  const albums = await legacyDatabase.transaction(['collections', 'meta'], 'readwrite', async tx => {
    const owner = await tx.get<string>('meta', 'legacy-collection-owner');
    if (owner && owner !== account) throw new Error('此设备原有馆藏已归属另一个账户');
    let albums = await tx.get<Album[]>('collections', 'vinyl_user_collection');
    if (!Array.isArray(albums)) {
      try { albums = JSON.parse(window.localStorage.getItem('vinyl_user_collection') || '[]'); }
      catch { throw new Error('原有馆藏无法读取，原始数据已保留'); }
    }
    if (!Array.isArray(albums)) throw new Error('原有馆藏格式不正确');
    await tx.put('meta', 'legacy-collection-owner', account);
    return albums;
  });
  if (albums.length) await save(albums);
  return albums.length;
}
