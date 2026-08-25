import type { AudioEngine } from '../audio/context';
import type { VoicePlayer } from '../audio/voice';
import type { Session } from '../game/session';
import type { StageSize } from './layout';
import type { Stage } from './stage';

export type SceneName = 'title' | 'kitchen';

/** What every scene is handed. Owned by main.ts – a scene never builds one of these itself. */
export interface SceneDeps {
  readonly stage: Stage;
  readonly audio: AudioEngine;
  /** The narrator; a scene may speak and stop it, but it lives longer than any scene. */
  readonly voice: VoicePlayer;
  /** The saved game and the current order; scenes never touch localStorage themselves. */
  readonly session: Session;
}

export interface SceneContext extends SceneDeps {
  /** Switch scenes; a no-op for the current scene or while a transition runs. */
  go(name: SceneName): void;
}

export interface SceneHandle {
  /** Root element of the scene, mounted into stage.root. */
  readonly el: HTMLElement;
  /** Called before removal: clear timers, detach listeners. */
  destroy?(): void;
  /** Called right after mount and on every stage resize while mounted. */
  resize?(size: StageSize): void;
}

export type Scene = (ctx: SceneContext) => SceneHandle;

export interface SceneManager {
  readonly current: SceneName | null;
  /** Unknown name (only reachable from the dev console): no-op + console.warn in DEV. */
  go(name: SceneName): void;
  destroy(): void;
}

const CROSSFADE_MS = 180;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createSceneManager(
  deps: SceneDeps,
  scenes: Readonly<Record<SceneName, Scene>>,
): SceneManager {
  const stage = deps.stage;
  let current: SceneName | null = null;
  let active: SceneHandle | null = null;
  let transitioning = false;

  const unsubscribe = stage.subscribe((size) => active?.resize?.(size));

  function go(name: SceneName): void {
    const factory: Scene | undefined = scenes[name];
    if (!factory) {
      if (import.meta.env.DEV) console.warn(`[scenes] unknown scene: ${String(name)}`);
      return;
    }
    if (name === current || transitioning) return;

    const next = factory({ ...deps, go });
    next.el.classList.add('scene');
    stage.root.append(next.el);
    next.resize?.(stage.size);

    const previous = active;
    active = next;
    current = name;
    if (!previous) return; // first mount: nothing to fade out

    previous.el.style.pointerEvents = 'none';
    transitioning = true;
    let settled = false;
    let fallback = 0;
    const done = (): void => {
      if (settled) return;
      settled = true;
      clearTimeout(fallback);
      previous.el.remove();
      previous.destroy?.();
      transitioning = false;
    };

    if (prefersReducedMotion()) {
      done();
      return;
    }
    try {
      const options: KeyframeAnimationOptions = { duration: CROSSFADE_MS, easing: 'ease-out' };
      next.el.animate([{ opacity: 0 }, { opacity: 1 }], options);
      const fadeOut = previous.el.animate([{ opacity: 1 }, { opacity: 0 }], options);
      fadeOut.addEventListener('finish', done);
      fadeOut.addEventListener('cancel', done);
      // A hidden document freezes Web Animations and the finish event may never arrive; without
      // this the manager would stay `transitioning` for good and ignore every later go().
      fallback = window.setTimeout(done, CROSSFADE_MS + 120);
    } catch {
      done(); // no Web Animations API: swap instantly rather than get stuck mid-transition
    }
  }

  return {
    get current() {
      return current;
    },
    go,
    destroy() {
      unsubscribe();
      active?.el.remove();
      active?.destroy?.();
      active = null;
      current = null;
    },
  };
}
