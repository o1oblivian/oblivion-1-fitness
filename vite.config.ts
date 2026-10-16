import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

/** Sample people used by the local dev preview must never ship inside the installed app. */
const stripDevPreviewAssets = () => ({
  name: 'strip-dev-preview-assets',
  apply: 'build' as const,
  closeBundle() {
    for (const name of ['preview-data.json', 'preview-buddies']) {
      fs.rmSync(path.resolve(import.meta.dirname, 'dist', name), { recursive: true, force: true });
    }
  },
});

export default defineConfig(() => {
  return {
    envPrefix: ['VITE_', 'REVENUECAT_', 'GEMINI_'],
    plugins: [react(), tailwindcss(), stripDevPreviewAssets()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        external: [],
      },
    },
    server: {
      host: true,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
