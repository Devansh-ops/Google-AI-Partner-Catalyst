import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx, defineManifest } from '@crxjs/vite-plugin';

const manifest = defineManifest({
  manifest_version: 3,
  name: 'Gemini LeetCode Mentor',
  version: '1.0.0',
  permissions: ['activeTab'],
  host_permissions: ['http://localhost:*/*', 'https://leetcodementor.devanshsehgal.com/*'],
  content_scripts: [{
    js: ['src/content.tsx'],
    matches: ['https://leetcode.com/problems/*']
  }],
  web_accessible_resources: [{
    resources: ['inject.js'],
    matches: ['https://leetcode.com/*']
  }]
});

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
      clientPort: 5173,
    },
    cors: true
  }
});