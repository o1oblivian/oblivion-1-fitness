import type { Express } from 'express';

/** CORS for the native app origins, plus a per-address cap on the routes that cost money per call. */
export function registerApiGuards(app: Express): void {
  const APP_ORIGINS = new Set([
    'https://localhost',
    'http://localhost',
    'capacitor://localhost',
    'ionic://localhost',
  ]);
  app.use('/api', (req, res, next) => {
    const origin = String(req.headers.origin || '');
    if (APP_ORIGINS.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Image-analysis routes cost money per call. Cap how often one address can use them.
  app.set('trust proxy', 1);
  const scanHits = new Map<string, { count: number; resetAt: number }>();
  const SCAN_LIMIT_PER_MINUTE = 40;
  setInterval(() => {
    const now = Date.now();
    for (const [key, hit] of scanHits) if (hit.resetAt <= now) scanHits.delete(key);
  }, 60_000).unref();
  app.use(['/api/vision', '/api/fuel', '/api/cardio', '/api/workout'], (req, res, next) => {
    if (req.method !== 'POST') return next();
    const now = Date.now();
    const key = req.ip || 'unknown';
    const hit = scanHits.get(key);
    if (!hit || hit.resetAt <= now) {
      scanHits.set(key, { count: 1, resetAt: now + 60_000 });
      return next();
    }
    hit.count += 1;
    if (hit.count > SCAN_LIMIT_PER_MINUTE) {
      res.setHeader('Retry-After', String(Math.ceil((hit.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many scans. Wait a minute and try again.' });
    }
    return next();
  });
}
