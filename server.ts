import express from 'express';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Album, Track, VinylRecord } from './src/types.js';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(rootDir, 'data', 'vinyl-collection.json');
const app = express();
const port = Number(process.env.API_PORT || process.env.PORT || 3001);
app.use(express.json({ limit: '8mb' }));

async function readCollection(): Promise<Album[]> {
  try {
    const value = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

let writeQueue = Promise.resolve();
function writeCollection(albums: Album[]) {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    const tempFile = `${dataFile}.tmp`;
    await fs.writeFile(tempFile, `${JSON.stringify(albums, null, 2)}\n`, 'utf8');
    await fs.rename(tempFile, dataFile);
  });
  return writeQueue;
}

function validAlbum(value: unknown): value is Album {
  const item = value as Partial<Album> | null;
  return !!item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.artist === 'string' && Array.isArray(item.tracks);
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/collection', async (_req, res, next) => {
  try { res.json(await readCollection()); } catch (error) { next(error); }
});
app.post('/api/collection', async (req, res, next) => {
  try {
    if (!validAlbum(req.body)) return res.status(400).json({ error: '唱片数据不完整' });
    const albums = await readCollection();
    const index = albums.findIndex(item => item.id === req.body.id || (req.body.barcode && item.barcode === req.body.barcode));
    if (index >= 0) albums[index] = req.body; else albums.unshift(req.body);
    await writeCollection(albums);
    res.status(index >= 0 ? 200 : 201).json(req.body);
  } catch (error) { next(error); }
});
app.post('/api/collection/import', async (req, res, next) => {
  try {
    const incoming = Array.isArray(req.body?.albums) ? req.body.albums.filter(validAlbum) : [];
    if (!incoming.length) return res.status(400).json({ error: '没有可保存的唱片数据' });
    const albums = await readCollection();
    for (const album of incoming) {
      const index = albums.findIndex(item => item.id === album.id || (album.barcode && item.barcode === album.barcode));
      if (index >= 0) albums[index] = album; else albums.unshift(album);
    }
    await writeCollection(albums);
    res.status(201).json(incoming);
  } catch (error) { next(error); }
});
app.delete('/api/collection/:id', async (req, res, next) => {
  try {
    const albums = await readCollection();
    await writeCollection(albums.filter(item => item.id !== req.params.id));
    res.json({ ok: true });
  } catch (error) { next(error); }
});

type MbTrack = { title?: string; length?: number; position?: number; recording?: { title?: string; length?: number } };
type MbMedium = { position?: number; format?: string; tracks?: MbTrack[] };
type MbRelease = { id: string; title?: string; date?: string; country?: string; barcode?: string; media?: MbMedium[]; 'artist-credit'?: Array<{ name?: string }>; 'label-info'?: Array<{ 'catalog-number'?: string; label?: { name?: string } }> };
const duration = (milliseconds = 0) => `${Math.floor(milliseconds / 60000)}:${String(Math.floor(milliseconds / 1000) % 60).padStart(2, '0')}`;
let musicBrainzQueue = Promise.resolve();
let lastMusicBrainzRequestAt = 0;
function musicBrainzFetch(url: string, headers: Record<string, string>) {
  const task = musicBrainzQueue.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastMusicBrainzRequestAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(url, { headers });
      lastMusicBrainzRequestAt = Date.now();
      if (response.status !== 503 || attempt === 2) return response;
      await new Promise(resolve => setTimeout(resolve, 1200 * (attempt + 1)));
    }
    throw new Error('MusicBrainz unavailable');
  });
  musicBrainzQueue = task.then(() => undefined, () => undefined);
  return task;
}

app.get('/api/releases/barcode/:barcode', async (req, res, next) => {
  try {
    const barcode = req.params.barcode.replace(/\D/g, '');
    if (!/^\d{8,14}$/.test(barcode)) return res.status(400).json({ error: '请输入 8–14 位 EAN / UPC 条码' });
    const headers = { 'User-Agent': 'VinylShelf/1.0 (https://github.com/vinyl-shelf)', Accept: 'application/json' };
    const searchUrl = `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(`barcode:${barcode}`)}&fmt=json&limit=10`;
    const search = await musicBrainzFetch(searchUrl, headers);
    if (!search.ok) throw new Error(`MusicBrainz ${search.status}`);
    const releases = ((await search.json()) as { releases?: MbRelease[] }).releases ?? [];
    const release = releases.find(item => item.media?.some(medium => /vinyl|12\"|10\"|7\"/i.test(medium.format ?? ''))) ?? releases[0];
    if (!release) return res.status(404).json({ error: '公开唱片库中没有找到这个条码' });
    const detailResponse = await musicBrainzFetch(`https://musicbrainz.org/ws/2/release/${release.id}?fmt=json&inc=recordings+labels+release-groups`, headers);
    if (!detailResponse.ok) throw new Error(`MusicBrainz ${detailResponse.status}`);
    const detail = await detailResponse.json() as MbRelease;
    const media = detail.media ?? [];
    const allTracks: Track[] = [];
    const discs: VinylRecord[] = media.map((medium, discIndex) => {
      const sideGroups = new Map<string, Track[]>();
      for (const [trackIndex, source] of (medium.tracks ?? []).entries()) {
        const printedPosition = String(source.position ?? trackIndex + 1);
        const side = /^[A-Z]/i.test(printedPosition) ? printedPosition[0].toUpperCase() : String.fromCharCode(65 + discIndex * 2 + (trackIndex >= Math.ceil((medium.tracks?.length ?? 0) / 2) ? 1 : 0));
        const milliseconds = source.length ?? source.recording?.length ?? 0;
        const track: Track = { id: `mb-${release.id}-${discIndex}-${trackIndex}`, number: trackIndex + 1, title: source.title || source.recording?.title || `Track ${trackIndex + 1}`, duration: duration(milliseconds), durationSec: Math.round(milliseconds / 1000) };
        allTracks.push(track);
        sideGroups.set(side, [...(sideGroups.get(side) ?? []), track]);
      }
      return { disc: discIndex + 1, sides: [...sideGroups].map(([side, tracks]) => ({ side, tracks })) };
    });
    const totalSeconds = allTracks.reduce((sum, track) => sum + track.durationSec, 0);
    const labelInfo = detail['label-info']?.[0];
    const album: Album = {
      id: `mb-${release.id}`, title: detail.title || release.title || '未命名唱片', artist: (detail['artist-credit'] ?? release['artist-credit'])?.map(item => item.name).filter(Boolean).join(', ') || '未知艺术家', artistId: `mb-artist-${release.id}`, year: Number((detail.date || release.date)?.slice(0, 4)) || new Date().getFullYear(), genre: '其他', coverUrl: `https://coverartarchive.org/release/${release.id}/front-500`, label: labelInfo?.label?.name || '未知厂牌', rpm: '33 ⅓ RPM', weight: '标准', edition: [detail.country || release.country, media.map(item => item.format).filter(Boolean).join(' + ')].filter(Boolean).join(' · ') || '实体发行版', matrixCode: '', trackCount: allTracks.length, totalDuration: duration(totalSeconds * 1000), description: '资料来自 MusicBrainz 与 Cover Art Archive，请在保存前核对版本。', color: '#131316', tracks: allTracks, discs, isCollected: true, condition: 'Near Mint (NM)', vinylType: 'black', vinylVariant: 'black', vinylTexture: 'black', vinylColor: '#171719', vinylColors: ['#171719'], addedAt: new Date().toISOString().slice(0, 10), barcode: detail.barcode || release.barcode || barcode, catalogNumber: labelInfo?.['catalog-number'] || '', country: detail.country || release.country || '', collectionTags: [],
    };
    res.json(album);
  } catch (error) { next(error); }
});

app.use(express.static(path.join(rootDir, 'dist')));
app.get('*', (_req, res) => res.sendFile(path.join(rootDir, 'dist', 'index.html')));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(502).json({ error: '唱片服务暂时不可用，请稍后重试' });
});
app.listen(port, '0.0.0.0', () => console.log(`Vinyl Shelf API listening on http://0.0.0.0:${port}`));
