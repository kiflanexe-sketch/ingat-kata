import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Menulis sw.js saat build dengan daftar semua file keluaran (aset ber-hash dan isi
// public/) supaya aplikasi langsung bisa dibuka offline setelah kunjungan pertama.
function serviceWorker(): Plugin {
  return {
    name: 'ingatkata-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = [
        'index.html',
        ...Object.keys(bundle).filter(f => f !== 'index.html' && !f.endsWith('.map')),
        ...readdirSync('public'),
      ];
      const precache = Array.from(new Set(files)).sort();
      const version = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12);
      const source = readFileSync('pwa/sw.js', 'utf8')
        .replace('const VERSION = __VERSION__;', `const VERSION = ${JSON.stringify(version)};`)
        .replace('const PRECACHE = __PRECACHE__;', `const PRECACHE = ${JSON.stringify(precache)};`);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  // Path relatif supaya bisa di-deploy di subfolder (mis. GitHub Pages).
  base: './',
  plugins: [react(), serviceWorker()],
});
