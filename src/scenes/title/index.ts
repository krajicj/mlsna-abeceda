import { playStartChime } from '../../audio/chime';
import type { Scene } from '../../stage/scenes';
import './style.css';

/** Audio must never hold the game up (rule 2): after this the game moves on, silent if need be. */
const UNLOCK_TIMEOUT_MS = 300;

// Flat cake in the house style: outline #3B2A1A, rounded shapes, palette from the design canvas.
const CAKE_SVG = `
<svg class="title-cake" viewBox="0 0 260 230" width="260" height="230" aria-hidden="true"
     fill="none" stroke="#3B2A1A" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
  <ellipse cx="130" cy="200" rx="122" ry="24" fill="#FFFFFF"></ellipse>
  <ellipse cx="130" cy="200" rx="96" ry="15" stroke="#DCD3C8" stroke-width="3"></ellipse>
  <rect x="36" y="122" width="188" height="72" rx="16" fill="#F7B7C8"></rect>
  <ellipse cx="130" cy="124" rx="94" ry="22" fill="#FBD1DC"></ellipse>
  <rect x="62" y="62" width="136" height="62" rx="14" fill="#FDE6B5"></rect>
  <path d="M62 76 C70 96 80 96 88 76 C96 96 106 96 114 76 C122 96 132 96 140 76 C148 96 158 96
           166 76 C174 96 184 96 192 76 L198 76 L198 62 L62 62 Z" fill="#F7B7C8" stroke="none"></path>
  <ellipse cx="130" cy="64" rx="68" ry="17" fill="#FFF3D6"></ellipse>
  <path d="M132 40 Q140 24 154 22" stroke="#3F8F3A" stroke-width="5"></path>
  <circle cx="130" cy="46" r="17" fill="#E5484D"></circle>
  <circle cx="124" cy="41" r="4" fill="#FFFFFF" stroke="none"></circle>
</svg>`;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Touch devices only: on a desktop the browser would just flash a permission-looking banner. */
function requestFullscreenOnTouch(): void {
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  const target = document.documentElement;
  if (document.fullscreenElement || typeof target.requestFullscreen !== 'function') return;
  void target.requestFullscreen().catch(() => undefined);
}

/** Tap screen: wordmark + pulsing cake. The first tap unlocks audio (CLAUDE.md rule 6). */
export const titleScene: Scene = (ctx) => {
  const el = document.createElement('div');
  el.className = 'scene-title';

  const tap = document.createElement('button');
  tap.type = 'button';
  tap.className = 'title-tap';
  tap.innerHTML = `<span class="title-wordmark">Mlsná abeceda</span>${CAKE_SVG}`;
  el.append(tap);

  let started = false;

  async function onClick(): Promise<void> {
    if (started) return; // a double tap must not run the sequence twice
    started = true;
    // Both want this one gesture, so the audio asks first: on an iPad (the only device with both a
    // coarse pointer and Element.requestFullscreen) the fullscreen transition used to run before
    // the context was even created, and the game stayed silent for the whole run.
    const unlocking = ctx.audio.unlock();
    requestFullscreenOnTouch();
    const unlocked = await Promise.race([unlocking, delay(UNLOCK_TIMEOUT_MS).then(() => false)]);
    if (unlocked) playStartChime(ctx.audio);
    ctx.go('kitchen'); // always – even when the audio stayed locked
  }

  const onClickHandler = (): void => void onClick();
  tap.addEventListener('click', onClickHandler);

  return {
    el,
    destroy() {
      tap.removeEventListener('click', onClickHandler);
    },
  };
};
