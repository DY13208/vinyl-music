import type { IncomingMessage, ServerResponse } from 'node:http';
export default function retiredCollection(_req: IncomingMessage, res: ServerResponse) {
  res.writeHead(410, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify({ error: '个人馆藏仅保存在当前设备，不提供服务器存取接口' }));
}
