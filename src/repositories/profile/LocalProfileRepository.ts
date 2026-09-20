import { vinylDatabase } from '../../platform/db/VinylDatabase';
import type { DatabaseAdapter } from '../../platform/db/DatabaseAdapter';

export type LocalProfile = { displayName: string; avatar: string };
const KEY = 'account-profile-v1';

/** Uses the active account's local database; never sends private images remotely. */
export class LocalProfileRepository {
  constructor(private readonly database: DatabaseAdapter = vinylDatabase) {}

  async get(): Promise<LocalProfile> {
    return this.database.transaction(['meta'], 'readonly', async tx => {
      const value = await tx.get<LocalProfile>('meta', KEY);
      return { displayName: value?.displayName || '', avatar: value?.avatar || '' };
    });
  }

  async save(profile: LocalProfile): Promise<LocalProfile> {
    const displayName = profile.displayName.trim();
    if (!displayName || Array.from(displayName).length > 30) throw new Error('昵称请输入 1–30 个字符');
    if (profile.avatar && (!/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(profile.avatar) || profile.avatar.length > 720000)) throw new Error('头像格式无效或图片过大，请重新选择');
    const next = { displayName, avatar: profile.avatar };
    try {
      await this.database.transaction(['meta'], 'readwrite', tx => tx.put('meta', KEY, next));
    } catch { throw new Error('资料保存失败，请检查本机存储空间后重试'); }
    return next;
  }
}

export const localProfileRepository = new LocalProfileRepository();
