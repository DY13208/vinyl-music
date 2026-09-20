let accountId: string | null = null;

// Set once before importing the application. Account changes reload the document
// so pending work and React state can never migrate into another user's store.
export function activateAccountStorage(id: string) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new Error('账户标识无效');
  if (accountId && accountId !== id) throw new Error('切换账户需要重新加载页面');
  accountId = id;
}
export function accountStorageName(base: string): string {
  return accountId ? `${base}:account:${accountId}` : `${base}:locked`;
}
export function activeAccountId() { return accountId; }
