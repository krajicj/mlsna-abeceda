export interface OrientationGuard {
  readonly portrait: boolean;
  destroy(): void;
}

// A phone that tips from portrait to landscape. No text – the player cannot read (rule 1).
// TODO STEP-07: play the "Otoč mě!" voice line while the overlay is up.
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

/** Full-screen overlay with a rotating phone; shown while the viewport is portrait. */
export function createOrientationGuard(host: HTMLElement): OrientationGuard {
  const el = document.createElement('div');
  el.className = 'orientation-guard';
  el.innerHTML = PHONE_SVG;
  host.append(el);

  // Read the media query, not stage.size: the stage is always landscape, the device is not.
  const query = window.matchMedia('(orientation: portrait)');
  let portrait = query.matches;

  const update = (): void => {
    portrait = query.matches;
    el.hidden = !portrait;
  };
  update();
  query.addEventListener('change', update);

  return {
    get portrait() {
      return portrait;
    },
    destroy() {
      query.removeEventListener('change', update);
      el.remove();
    },
  };
}
