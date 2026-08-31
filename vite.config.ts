import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import type {Plugin} from 'vite';
import {handleSearch} from './src/utils/searchHandlers';

// Dev-only plugin: exposes /api/search/:kind in dev mode without running Express
function liveSearchDevPlugin(): Plugin {
  return {
    name: 'live-search-dev',
    configureServer(server) {
      server.middlewares.use('/api/search', (req, res) => {
        // Extract kind from URL: /api/search/web?q=...
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const parts = url.pathname.split('/').filter(Boolean);
        const kind = parts[0] || '';
        // Reconstruct Express-compatible req/res shape
        const fakeReq = {
          params: { kind },
          query: Object.fromEntries(url.searchParams.entries()),
          headers: req.headers,
        } as any;
        const fakeRes = {
          setHeader: (k: string, v: string) => res.setHeader(k, v),
          status: (code: number) => {
            res.statusCode = code;
            return fakeRes;
          },
          json: (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          },
        } as any;
        handleSearch(fakeReq, fakeRes);
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), liveSearchDevPlugin()],
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-motion': ['motion/react'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-lucide': ['lucide-react'],
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
