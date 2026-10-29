import express from 'express';
import http from 'http';
import os from 'os';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { registerApiGuards } from './server/middleware/apiGuards';
import { registerAccountRoutes } from './server/routes/accountRoutes';
import {
  handleFounderPasses,
  handleRevenueCatWebhook,
  handleSyncEntitlements,
} from './server/routes/billingWebhookHandler';
import { handleFreeAccessMe, handleFreeAccessSpots } from './server/routes/freeAccess';
import { registerDevPreview } from './server/devPreview';
import { registerFuelRoutes } from './server/routes/fuelRoutes';
import { registerPublicPages } from './server/routes/publicPages';
import { registerStripeRoutes } from './server/routes/stripeRoutes';
import { registerVisionRoutes } from './server/routes/visionRoutes';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

/**
 * Entry point. Each group of routes lives in server/routes; this file only wires them together.
 * Order matters: guards and body parsing first, API routes next, static pages and the app last.
 */
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  registerApiGuards(app);

  // Configure JSON parser with larger limit and rawBody verification for Stripe webhooks
  app.use(
    express.json({
      limit: '50mb',
      verify: (
        req: http.IncomingMessage & { originalUrl?: string; rawBody?: Buffer },
        _res,
        buf,
      ) => {
        if (req.originalUrl?.startsWith('/api/stripe/webhook')) {
          req.rawBody = buf;
        }
      },
    }),
  );
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Fuel OS Backend', time: new Date().toISOString() });
  });

  registerVisionRoutes(app);
  registerFuelRoutes(app);

  // RevenueCat store webhooks and entitlement sync
  app.post('/api/revenuecat/webhook', handleRevenueCatWebhook);
  app.get('/api/billing/founder-passes', handleFounderPasses);
  app.get('/api/billing/free-access', handleFreeAccessSpots);
  app.get('/api/billing/free-access/me', handleFreeAccessMe);
  app.get('/api/billing/sync-entitlements', handleSyncEntitlements);

  registerAccountRoutes(app);

  // Stripe Connect and coach payouts (every /api/stripe/* needs a Supabase Bearer JWT; webhook uses signature)
  registerStripeRoutes(app);

  // Privacy, delete-account and terms pages (Google Play and Apple review)
  registerPublicPages(app);

  const phoneHost = lanIPv4();
  const httpServer = http.createServer(app);
  if (process.env.NODE_ENV !== 'production') {
    registerDevPreview(app);
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: true,
        allowedHosts: true as const,
        hmr: process.env.DISABLE_HMR !== 'true',
        ws: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    process.stdout.write(`[O1 Fuel OS] Full-stack server active on http://0.0.0.0:${PORT}\n`);
    if (phoneHost) process.stdout.write(`[O1 Fuel OS] Phone: http://${phoneHost}:${PORT}/\n`);
  });
}

function lanIPv4(): string | null {
  const nets = os.networkInterfaces();
  const addresses: string[] = [];
  for (const list of Object.values(nets)) {
    for (const net of list || []) {
      const family = String(net.family);
      if ((family === 'IPv4' || family === '4') && !net.internal) addresses.push(net.address);
    }
  }
  return (
    addresses.find((address) => address.startsWith('10.') || address.startsWith('192.168.')) ||
    addresses.find((address) => !address.startsWith('169.254.')) ||
    null
  );
}

startServer().catch((err) => {
  console.error('Failed to start Fuel OS server:', err);
});
