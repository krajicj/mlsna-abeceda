import type { VoicePlayer } from '../audio/voice';
import { TURN_LINE } from '../data/lines.cs';

export interface OrientationGuard {
  readonly portrait: boolean;
  destroy(): void;
}

// A phone that tips from portrait to landscape. No text – the player cannot read (rule 1); the
// picture is carried by "Otoč mě!" (STEP-09), said whenever the overlay comes up.
const PHONE_SVG = `
<svg class="rotate-phone" viewBox="0 0 200 200" width="200" height="200" aria-hidden="true"
     fill="none" stroke="#3B2A1A" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
  <g class="rotate-phone-body">
    <rect x="66" y="30" width="68" height="140" rx="14" fill="#FFF1DC"></rect>
    <rect x="74" y="46" width="52" height="108" rx="6" fill="#8FD3E8" stroke-width="4"></rect>
    <circle cx="100" cy="163" r="4" fill="#3B2A1A" stroke="none"></circle>
  </g>
  <path d="M159 30 A92 92 0 0 1 159 170" stroke-width="7"></path>
  <path d="M146 158 L159 172 L172 158" stroke-width="7"></path>
</svg>`;

/**
 * Full-screen overlay with a rotating phone; shown while the viewport is portrait. With a narrator
 * it also says "Otoč mě!" – but only once the audio is unlocked, which is what `speaking` cannot
 * tell us; the player itself stays silent while it is locked (rule 6), so saying it is harmless.
 */
export function createOrientationGuard(
  host: HTMLElement,
  options?: { readonly voice?: VoicePlayer },
): OrientationGuard {
  const el = document.createElement('div');
  el.className = 'orientation-guard';
  el.innerHTML = PHONE_SVG;
  host.append(el);

  // Read the media query, not stage.size: the stage is always landscape, the device is not.
  const query = window.matchMedia('(orientation: portrait)');
  let portrait = query.matches;

  const update = (announce: boolean): void => {
    const was = portrait;
    portrait = query.matches;
    el.hidden = !portrait;
    // Only on the way into portrait: a repeat on every media-query event would nag.
    if (announce && portrait && !was) options?.voice?.say(TURN_LINE);
  };
  const onChange = (): void => update(true);
  update(false);
  query.addEventListener('change', onChange);

  return {
    get portrait() {
      return portrait;
    },
    destroy() {
      query.removeEventListener('change', onChange);
      el.remove();
    },
  };
}
