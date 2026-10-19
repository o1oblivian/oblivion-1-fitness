import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

/** Sample people used by the local dev preview must never ship inside the installed app. */
const stripDevPreviewAssets = () => ({
  name: 'strip-dev-preview-assets',
  apply: 'build' as const,
  closeBundle() {
    fs.rmSync(path.resolve(import.meta.dirname, 'dist', 'preview-data.json'), { force: true });
  },
});

/** Commit and CI build number, so a screenshot from a phone says exactly which code it ran. */
function buildStamp(): string {
  let commit = 'nogit';
  try {
    commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    /* built outside a git checkout */
  }
  const number = process.env.BUILD_NUMBER;
  return number ? `${commit} #${number}` : commit;
}

export default defineConfig(() => {
  return {
    define: { __BUILD_STAMP__: JSON.stringify(buildStamp()) },
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
