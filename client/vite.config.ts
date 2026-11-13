import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths()
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') }
    ]
  },
  preview: {
    headers: {
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex'
    }
  },
  server: {
    headers: {
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex'
    },
    allowedHosts: [
      'localhost'
    ],
    host: true,
    port: 3000
  }
});