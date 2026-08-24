import { computeStage, type StageSize } from './layout';

export interface Stage {
  /** The scaled element scenes mount into: size.width × 768 logical px. */
  readonly root: HTMLElement;
  /** Current logical size; a new object on every change. */
  readonly size: StageSize;
  /** Subscribe to size changes; returns an unsubscribe function. */
  subscribe(listener: (size: StageSize) => void): () => void;
  destroy(): void;
}

/**
 * Builds `.viewport > .stage` inside `host` and keeps the stage fitted to the viewport.
 *
 * `.viewport` is inset by the safe-area, so watching it with a ResizeObserver folds in the
 * notch, the home indicator and a hiding address bar – no `resize` or `orientationchange`
 * listener needed, and the observer already coalesces to one callback per frame.
 */
export function createStage(host: HTMLElement): Stage {
  const viewport = document.createElement('div');
  viewport.className = 'viewport';
  const root = document.createElement('div');
  root.className = 'stage';
  viewport.append(root);
  host.append(viewport);

  const listeners = new Set<(size: StageSize) => void>();
  let size = computeStage({ width: viewport.clientWidth, height: viewport.clientHeight });

  function apply(next: StageSize): void {
    root.style.setProperty('--stage-w', `${next.width}px`);
    root.style.setProperty('--stage-scale', String(next.scale));
  }
  apply(size);

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    size = computeStage({ width: entry.contentRect.width, height: entry.contentRect.height });
    apply(size);
    for (const listener of [...listeners]) listener(size);
  });
  observer.observe(viewport);

  return {
    root,
    get size() {
      return size;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    destroy() {
      observer.disconnect();
      listeners.clear();
      viewport.remove();
    },
  };
}
