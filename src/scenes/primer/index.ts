/** A free, read-only board of letters and digits. Nothing here changes a learning score. */
import { primerBoardArt, primerCaseToggle, primerTile } from '../../art/primer';
import { primerLayout, type PrimerLayout } from '../../art/layout';
import { shopDoor } from '../../art/shop';
import { isLetter } from '../../data/curriculum';
import { primerBoard } from '../../game/primer';
import { primerDigitSpeech, primerLetterSpeech } from '../../game/speech';
import { STAGE_HEIGHT } from '../../stage/layout';
import type { Scene } from '../../stage/scenes';
import { layer, place } from '../kitchen/dom';
import './style.css';

export const primerScene: Scene = (ctx) => {
  const el = document.createElement('div');
  el.className = 'scene-primer';
  const boardEl = layer('primer-board');
  const doorEl = layer('primer-door');
  const caseEl = layer('primer-case');
  const board = primerBoard(ctx.session.save.tracks);
  const tiles = [...board.letters, ...board.digits].map((tile) => {
    const target = layer(`primer-tile is-${tile.state}`);
    target.innerHTML = primerTile(tile.element, tile.state);
    target.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary) return;
      event.preventDefault();
      ctx.voice.stop();
      ctx.sfx.play('pling');
      ctx.voice.say(
        isLetter(tile.element)
          ? primerLetterSpeech(tile.element, ctx.session.save.settings)
          : primerDigitSpeech(tile.element),
      );
    });
    return target;
  });
  let lowercase = false;
  el.append(boardEl, ...tiles, doorEl, caseEl);

  doorEl.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    ctx.go('kitchen');
  });

  caseEl.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary) return;
    event.preventDefault();
    lowercase = !lowercase;
    for (const [index, tile] of board.letters.entries()) {
      const target = tiles[index];
      if (target)
        target.innerHTML = primerTile(
          lowercase ? tile.element.toLowerCase() : tile.element,
          tile.state,
        );
    }
    caseEl.innerHTML = primerCaseToggle(lowercase);
    ctx.sfx.play('pling');
  });

  function draw(layout: PrimerLayout, width: number): void {
    place(boardEl, { x: 0, y: 0, width, height: STAGE_HEIGHT });
    boardEl.innerHTML = primerBoardArt(width, STAGE_HEIGHT);
    const positions = [...layout.letters, ...layout.digits];
    for (const [index, tile] of tiles.entries()) {
      const position = positions[index];
      if (position) place(tile, position);
    }
    place(doorEl, layout.back);
    doorEl.innerHTML = shopDoor(layout.back);
    place(caseEl, layout.letterCase);
    caseEl.innerHTML = primerCaseToggle(lowercase);
  }

  return {
    el,
    resize(size) {
      draw(primerLayout(size.width), size.width);
    },
    destroy() {
      ctx.voice.stop();
    },
  };
};
