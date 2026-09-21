// 仅用于 Pen 导出：大体积远程中文字体超时时读取本设计用字的官方字体子集。
// 不修改 Pen 安装文件、系统字体或系统网络设置。
import { readFile } from 'node:fs/promises';

const originalFetch = globalThis.fetch;
const fontCache = new Map();
globalThis.fetch = async (input, init) => {
  const address = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(address);
  if (url.hostname === 'fonts.gstatic.com' && /\/s\/noto(sans(sc|tc|jp|kr)|serifsc)\//.test(url.pathname)) {
    const path = new URL(url.pathname.includes('serifsc')
      ? '../assets/fonts/NotoSerifSC-subset.ttf'
      : '../assets/fonts/NotoSansSC.ttf', import.meta.url);
    try {
      if (!fontCache.has(path)) fontCache.set(path, await readFile(path));
      return new Response(fontCache.get(path), { status: 200, headers: { 'content-type': 'font/ttf' } });
    } catch {
      return originalFetch(input, init);
    }
  }
  return originalFetch(input, init);
};
