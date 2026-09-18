import express from 'express';
import { registerVinylSearchRoutes } from '../src/server/vinylSearch/registerVinylSearchRoutes.js';
const app = express();
app.use((req, _res, next) => {
  const url = new URL(req.url, 'https://vinyl.invalid');
  const route = url.searchParams.get('route');
  if (route) { url.searchParams.delete('route'); req.url = `/api/releases/${route}?${url.searchParams}`; }
  next();
});
registerVinylSearchRoutes(app);
app.use((_req, res) => res.status(404).json({ error: '公共唱片接口不存在' }));
app.use((_error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(502).json({ error: '公共唱片服务暂时不可用' }));
export default app;
export const config = { maxDuration: 60 };
