import type { Album } from '../types';

const jsonHeaders = { 'Content-Type': 'application/json' };

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((body as { error?: string }).error || `请求失败 (${response.status})`);
  return body as T;
}

export async function loadServerCollection() {
  return readJson<Album[]>(await fetch('/api/collection'));
}

export async function saveAlbumToServer(album: Album) {
  return readJson<Album>(await fetch('/api/collection', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(album) }));
}

export async function saveAlbumsToServer(albums: Album[]) {
  return readJson<Album[]>(await fetch('/api/collection/import', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ albums }) }));
}

export async function removeAlbumFromServer(albumId: string) {
  await readJson(await fetch(`/api/collection/${encodeURIComponent(albumId)}`, { method: 'DELETE' }));
}

export async function lookupVinylBarcode(barcode: string) {
  return readJson<Album>(await fetch(`/api/releases/barcode/${encodeURIComponent(barcode)}`));
}
