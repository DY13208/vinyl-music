import express from 'express';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Album } from './src/types.js';
import { registerVinylSearchRoutes } from './src/server/vinylSearch/registerVinylSearchRoutes.js';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(rootDir, 'data', 'vinyl-collection.json');
const app = express();
const port = Number(process.env.API_PORT || process.env.PORT || 3001);
app.use(express.json({ limit: '8mb' }));
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

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

// Register the provider-backed lookup before the static app fallback.
registerVinylSearchRoutes(app);

app.use(express.static(path.join(rootDir, 'dist')));
app.get('*', (_req, res) => res.sendFile(path.join(rootDir, 'dist', 'index.html')));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(502).json({ error: '唱片服务暂时不可用，请稍后重试' });
});
app.listen(port, '0.0.0.0', () => console.log(`Vinyl Shelf API listening on http://0.0.0.0:${port}`));
