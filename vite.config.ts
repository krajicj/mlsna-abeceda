import { defineConfig } from 'vitest/config';

const usePolling = process.env['VITE_POLL'] === '1'; // fallback when bind-mount file events do not reach the container

// Extra Host headers the dev server accepts, comma separated. Empty by default, which
// matches Vite's own default; localhost and direct IPs are always allowed. Set it when
// the server runs on another machine reached by name (e.g. a Tailscale MagicDNS host).
const allowedHosts = (process.env['VITE_ALLOWED_HOSTS'] ?? '').split(',').filter(Boolean);

export default defineConfig({
  base: '/mlsna-abeceda/',
  server: {
    host: true, // listen on 0.0.0.0 inside the container (reached through the socat proxy)
    allowedHosts,
    port: 5173,
    strictPort: true,
    watch: usePolling ? { usePolling: true, interval: 500 } : undefined,
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
