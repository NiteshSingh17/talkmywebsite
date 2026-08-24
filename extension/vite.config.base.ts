import { ManifestV3Export } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { BuildOptions, defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { crxI18n, stripDevIcons } from './custom-vite-plugins';
import manifest from './manifest.json';
import pkg from './package.json';

const isDev = process.env.__DEV__ === 'true';
const localize = false;

export const baseManifest = {
  ...manifest,
  version: pkg.version,
  ...(isDev ? manifest : ({} as ManifestV3Export)),
} as ManifestV3Export;

export const baseBuildOptions: BuildOptions = {
  sourcemap: isDev,
  emptyOutDir: !isDev,
};

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    react(),
    stripDevIcons(isDev),
    crxI18n({ localize, src: './src/locales' }),
  ],
  publicDir: resolve(__dirname, 'public'),
  build: {
    rollupOptions: {
      input: {
        popup: resolve(
          __dirname,
          'src/pages/popup/index.html',
        ),
        sidepanel: resolve(
          __dirname,
          'src/pages/sidepanel/index.html',
        ),
      },
    },
    outDir: 'dist_chrome',
    emptyOutDir: true,
  },
});
