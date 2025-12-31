import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx, defineManifest } from '@crxjs/vite-plugin';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production' || process.env.VITE_BUILD_ENV === 'prod';

  const manifest = defineManifest({
    manifest_version: 3,
    name: 'Gemini LeetCode Mentor',
    version: '1.0.0',
    permissions: ['activeTab'],
    // Use minimal permissions in production; include localhost/WS only for dev/HMR
    host_permissions: isProd
      ? ['https://leetcodementor.devanshsehgal.com/*']
      : ['http://localhost:*/*', 'ws://localhost:*/*', 'ws://127.0.0.1:*/*', 'https://leetcodementor.devanshsehgal.com/*'],
    content_scripts: [
      {
        js: ['src/content.tsx'],
        matches: ['https://leetcode.com/problems/*'],
      },
    ],
    web_accessible_resources: [
      {
        resources: ['inject.js'],
        matches: ['https://leetcode.com/*'],
      },
    ],
  });

  return {
    plugins: [react(), crx({ manifest })],
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
        clientPort: 5173,
      },
      cors: true,
    },
  };
});
