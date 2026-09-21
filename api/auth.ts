export default function retiredAuthRoute(_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  res.status(410).json({ error: { code: 'AUTH_ROUTE_RETIRED', message: '请使用 /api/v1/auth/*' } });
}
export const config = { maxDuration: 15 };
