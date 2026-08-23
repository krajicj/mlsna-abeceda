import { defineConfig } from 'vitest/config';

const usePolling = process.env['VITE_POLL'] === '1'; // fallback when bind-mount file events do not reach the container

export default defineConfig({
  base: '/mlsna-abeceda/',
  server: {
    host: true, // listen on 0.0.0.0 inside the container (reached through the socat proxy)
    port: 5173,
    strictPort: true,
    watch: usePolling ? { usePolling: true, interval: 500 } : undefined,
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
