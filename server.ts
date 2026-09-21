import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { artworkHandler } from './src/server/artwork.js';
import { authHandler } from './src/server/auth.js';
import { registerVinylSearchRoutes } from './src/server/vinylSearch/registerVinylSearchRoutes.js';

// Vercel's `vercel env pull` commonly writes .env.development.local. Load the
// local variants for development; existing process environment variables win.
// .env.auth.local is a safe local-only override for the app's own auth values.
dotenv.config({ path: '.env.auth.local', quiet: true });
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ path: '.env.development.local', quiet: true });
dotenv.config({ path: '.env', quiet: true });
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.API_PORT || process.env.PORT || 3001);
// Auth parses its own small JSON body and returns sanitized errors. Do not let
// a generic JSON-parser error log include a submitted password.
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

// Private collections must never be read from or written to server storage.
app.use('/api/collection', (_req, res) => res.status(410).json({ error: '个人馆藏仅保存在当前设备，不提供服务器存取接口' }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.all('/api/artwork', artworkHandler);
app.all('/api/v1/auth/*', authHandler);
app.all('/api/v1/auth', authHandler);

// Register the provider-backed lookup before the static app fallback.
registerVinylSearchRoutes(app);

app.use(express.static(path.join(rootDir, 'dist')));
app.get('*', (_req, res) => res.sendFile(path.join(rootDir, 'dist', 'index.html')));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(502).json({ error: '唱片服务暂时不可用，请稍后重试' });
});
app.listen(port, '0.0.0.0', () => console.log(`Vinyl Shelf API listening on http://0.0.0.0:${port}`));
