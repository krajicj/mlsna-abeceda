/**
 * The handful of Node built-ins the manifest test needs. We deliberately do not depend on
 * `@types/node` (CLAUDE.md › Supply-chain security: prefer writing lines over adding a package) –
 * this is a hand-written subset, not a replacement for the real types.
 *
 * Only test files may import these: `node:fs` in game code would break the browser build.
 */
declare module 'node:fs' {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function readdirSync(path: string): string[];
}
