import type { Express } from 'express';
import { VinylSearchService } from './VinylSearchService.js';
import { normalizeBarcode, parseSearchQuery } from './utils.js';

const service = new VinylSearchService();

export function registerVinylSearchRoutes(app: Express) {
  app.get('/api/releases/search', async (req, res, next) => {
    try {
      const input = parseSearchQuery({
        query: String(req.query.q ?? req.query.query ?? ''),
        barcode: String(req.query.barcode ?? ''),
        catalogNumber: String(req.query.catalogNumber ?? ''),
        artist: String(req.query.artist ?? ''),
        album: String(req.query.album ?? ''),
        year: req.query.year ? Number(req.query.year) : undefined,
      });
      if (!input.query && !input.barcode && !input.catalogNumber && !input.album) return res.status(400).json({ error: '请输入 UPC / EAN、Catalog Number、歌手或专辑名称' });
      const response = await service.search(input);
      const first = response.results[0];
      if (!first) {
        const hadSuccessfulProvider = response.providers.some(provider => provider.attempted && !provider.errorCode);
        return res.status(hadSuccessfulProvider ? 404 : 502).json({ error: hadSuccessfulProvider ? '未找到匹配的唱片或专辑' : '所有可用唱片数据源均请求失败', ...response });
      }
      return res.json({ ...response, ...first });
    } catch (error) { return next(error); }
  });

  app.get('/api/releases/barcode/:barcode', async (req, res, next) => {
    const barcode = normalizeBarcode(req.params.barcode);
    if (!/^\d{8,14}$/.test(barcode)) return res.status(400).json({ error: '请输入 8–14 位 EAN / UPC 条码' });
    try {
      const response = await service.search(parseSearchQuery({ query: barcode, barcode }));
      const first = response.results[0];
      if (!first) {
        const hadSuccessfulProvider = response.providers.some(provider => provider.attempted && !provider.errorCode);
        return res.status(hadSuccessfulProvider ? 404 : 502).json({ error: hadSuccessfulProvider ? '未找到与该条码匹配的唱片或专辑' : '所有可用唱片数据源均请求失败', barcode, providers: response.providers });
      }
      const physicalMatches = response.results.flatMap(result => result.alternatives);
      const matches = physicalMatches.length ? physicalMatches : [first.album];
      return res.json({
        barcode,
        source: first.sources[0] ?? 'local',
        matches,
        album: first.album,
        vinylRelease: first.vinylRelease,
        vinylReleaseFound: first.vinylReleaseFound,
        matchConfidence: first.matchConfidence,
        sources: first.sources,
        sourceIds: first.sourceIds,
        message: first.message,
        providers: response.providers,
        cached: response.cached,
      });
    } catch (error) { return next(error); }
  });
}
