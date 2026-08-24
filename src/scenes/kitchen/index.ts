import type { Scene } from '../../stage/scenes';
import './style.css';

// Temporary way back to the title screen – shape only, no text. STEP-04 removes it.
const STAR_SVG = `
<svg viewBox="0 0 24 24" width="56" height="56" aria-hidden="true">
  <path d="M12 2.5l2.9 6.1 6.7.8-4.9 4.6 1.2 6.6L12 17.3l-5.9 3.3 1.2-6.6L2.4 9.4l6.7-.8z"
        fill="#FFC53D" stroke="#3B2A1A" stroke-width="2" stroke-linejoin="round"></path>
</svg>`;

/**
 * Placeholder kitchen: wall, counter, floor and the three anchored blocks STEP-04 fills in
 * (customer left, product in the middle, shelf right). Only the gaps stretch with the width.
 */
export const kitchenScene: Scene = (ctx) => {
  const el = document.createElement('div');
  el.className = 'scene-kitchen';
  el.innerHTML = `
    <div class="kitchen-counter"></div>
    <div class="kitchen-floor"></div>
    <div class="anchor-left kitchen-slot customer-slot"></div>
    <div class="anchor-center kitchen-slot product-slot"></div>
    <div class="anchor-right kitchen-slot shelf-slot"></div>
    ${import.meta.env.DEV ? '<div class="kitchen-dev-guide"></div>' : ''}
  `;

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-tile';
  back.setAttribute('aria-label', 'Zpět');
  back.innerHTML = STAR_SVG;
  el.append(back);

  const onClick = (): void => ctx.go('title');
  back.addEventListener('click', onClick);

  return {
    el,
    destroy() {
      back.removeEventListener('click', onClick);
    },
  };
};
