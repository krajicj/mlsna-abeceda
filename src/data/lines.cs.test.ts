import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BASE_LETTERS, FRUITS, LETTER_WORDS, ROLE_WORDS } from './curriculum.ts';
import {
  CASTING_LINES,
  countAloudLine,
  countEnoughLine,
  bellLines,
  finishLines,
  hasLine,
  hintLine,
  letterWordLine,
  LINES,
  orderCountLine,
  orderDigitLine,
  orderLetterLine,
  orderNextCountLine,
  orderNextDigitLine,
  orderNextLetterLine,
  praiseLines,
  seekLine,
  starLines,
  TURN_LINE,
  wrongLine,
  type PraiseGender,
} from './lines.cs.ts';
import { DEFAULT_VOICE, VOICES, clipPath, voiceBySlug } from './voices.ts';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const GENDERS: readonly PraiseGender[] = ['neutral', 'female', 'male'];
const ID_PATTERN = /^[a-z0-9]+([.-][a-z0-9]+)*$/;

const byId = new Map(LINES.map((line) => [line.id, line]));

/** The spelled letter name always opens the sentence: "Ká jako kočka.", "Ká je tady!". */
function firstWord(text: string): string {
  return text.split(' ')[0] ?? '';
}

function textOf(id: string): string {
  const line = byId.get(id);
  expect(line, `missing line ${id}`).toBeDefined();
  return line?.text ?? '';
}

describe('manifest of voice lines', () => {
  it('holds exactly the groups the plan pays for', () => {
    // 254 clips ≈ 4 750 characters (docs/steps/STEP-07, +6 in STEP-09, +2 in STEP-10), +62 for
    // the second item of an order in STEP-12, +5 for the closed kitchen in STEP-14. Adding lines
    // means paying for them and regenerating – the number is here so that cost is a conscious
    // edit, not a surprise.
    expect(LINES).toHaveLength(321);
  });

  it('has unique ids usable as file names', () => {
    const seen = new Set<string>();
    for (const line of LINES) {
      expect(line.id).toMatch(ID_PATTERN);
      expect(seen.has(line.id), `duplicate id ${line.id}`).toBe(false);
      seen.add(line.id);
    }
  });

  it('has whole, speakable sentences', () => {
    for (const line of LINES) {
      expect(line.text, line.id).toBe(line.text.trim());
      expect(line.text.length, line.id).toBeGreaterThan(0);
      expect(line.text.length, line.id).toBeLessThanOrEqual(140);
      expect(line.text, line.id).toMatch(/[.!?]$/);
      expect(line.text, line.id).not.toMatch(/[\n"„“”]/);
      // A digit would be read out in some way of its own; the manifest always spells it.
      expect(line.text, line.id).not.toMatch(/[0-9]/);
    }
  });

  it('declines the fruit with the amount', () => {
    expect(textOf(orderCountLine(1, 'strawberry'))).toBe('Prosím jednu jahodu.');
    expect(textOf(orderCountLine(2, 'strawberry'))).toBe('Prosím dvě jahody.');
    expect(textOf(orderCountLine(5, 'strawberry'))).toBe('Prosím pět jahod.');
    expect(textOf(orderCountLine(4, 'cherry'))).toBe('Prosím čtyři třešně.');
    expect(textOf(orderCountLine(7, 'blueberry'))).toBe('Prosím sedm borůvek.');
    expect(textOf(countEnoughLine(1, 'cherry'))).toBe('Už máme jednu třešeň, to stačí!');
    expect(textOf(countEnoughLine(3, 'strawberry'))).toBe('Už máme tři jahody, to stačí!');
  });

  it('covers every letter of the curriculum', () => {
    for (const letter of BASE_LETTERS) {
      for (const id of [
        orderLetterLine(letter),
        wrongLine(letter),
        seekLine(letter),
        hintLine(letter),
      ]) {
        expect(hasLine(id), id).toBe(true);
      }
      const word = LETTER_WORDS[letter];
      const wordLine = textOf(letterWordLine(letter, word));
      expect(wordLine).toMatch(new RegExp(`^\\S+ jako ${word}\\.$`));
      expect(firstWord(wordLine), letter).toBe(firstWord(textOf(hintLine(letter))));
    }
  });

  it('covers every digit', () => {
    for (const digit of DIGITS) {
      const target = String(digit);
      for (const id of [
        orderDigitLine(digit),
        countAloudLine(digit),
        wrongLine(target),
        seekLine(target),
        hintLine(target),
      ]) {
        expect(hasLine(id), id).toBe(true);
      }
    }
    expect(textOf(countAloudLine(3))).toBe('Tři.');
    expect(textOf(wrongLine('5'))).toBe('To je pětka.');
    expect(textOf(seekLine('3'))).toBe('Hledáme trojku.');
    expect(textOf(hintLine('3'))).toBe('Trojka je tady!');
  });

  it('covers every fruit and amount', () => {
    for (const fruit of FRUITS) {
      for (const digit of DIGITS) {
        expect(hasLine(orderCountLine(digit, fruit))).toBe(true);
        expect(hasLine(countEnoughLine(digit, fruit))).toBe(true);
      }
    }
  });

  it('says the second item of an order as its own whole sentence (STEP-12)', () => {
    expect(textOf(orderNextCountLine(1, 'strawberry'))).toBe('A ještě jednu jahodu.');
    expect(textOf(orderNextCountLine(3, 'strawberry'))).toBe('A ještě tři jahody.');
    expect(textOf(orderNextCountLine(7, 'blueberry'))).toBe('A ještě sedm borůvek.');
    expect(textOf(orderNextDigitLine(4))).toBe('A ještě svíčku s číslem čtyři.');
    expect(textOf(orderNextLetterLine('K'))).toBe('A ještě perníček s písmenkem ká.');
    // The same declension tables as the first position, so the two forms cannot drift apart.
    for (const fruit of FRUITS) {
      for (const digit of DIGITS) {
        expect(hasLine(orderNextCountLine(digit, fruit))).toBe(true);
        expect(textOf(orderNextCountLine(digit, fruit))).toBe(
          textOf(orderCountLine(digit, fruit)).replace('Prosím ', 'A ještě '),
        );
      }
    }
    for (const digit of DIGITS) expect(hasLine(orderNextDigitLine(digit))).toBe(true);
    for (const letter of BASE_LETTERS) expect(hasLine(orderNextLetterLine(letter))).toBe(true);
  });

  it('has a sentence for every family word too', () => {
    for (const entry of ROLE_WORDS) {
      const text = textOf(letterWordLine(entry.letter, entry.word));
      expect(text).toMatch(new RegExp(`^\\S+ jako ${entry.word}\\.$`));
    }
  });

  it('has three sets of praise', () => {
    expect(praiseLines('neutral').length).toBeGreaterThanOrEqual(8);
    expect(praiseLines('female').length).toBeGreaterThanOrEqual(4);
    expect(praiseLines('male').length).toBeGreaterThanOrEqual(4);
    for (const gender of GENDERS) {
      for (const id of praiseLines(gender)) expect(hasLine(id), id).toBe(true);
    }
  });

  it('closes an order and hands over the star (STEP-09)', () => {
    expect(finishLines()).toEqual(['finish.1', 'finish.2', 'finish.3']);
    expect(starLines()).toEqual(['star.1', 'star.2']);
    expect(textOf('finish.1')).toBe('Hotovo!');
    expect(textOf('finish.2')).toBe('A je to!');
    expect(textOf('finish.3')).toBe('Dortík je hotový!');
    expect(textOf('star.1')).toBe('Máš hvězdičku!');
    expect(textOf('star.2')).toBe('Hvězdička je tvoje!');
    for (const id of [...finishLines(), ...starLines()]) expect(hasLine(id), id).toBe(true);
  });

  it('nudges towards the bell while the counter is empty (STEP-10)', () => {
    expect(bellLines()).toEqual(['bell.1', 'bell.2']);
    expect(textOf('bell.1')).toBe('Zazvoň na zvoneček!');
    expect(textOf('bell.2')).toBe('Klepni na zvoneček!');
    for (const id of bellLines()) expect(hasLine(id), id).toBe(true);
  });

  it('asks the child to turn the device over', () => {
    expect(TURN_LINE).toBe('guard.turn');
    expect(textOf(TURN_LINE)).toBe('Otoč mě!');
    expect(hasLine(TURN_LINE)).toBe(true);
  });

  it('has five casting sentences outside LINES', () => {
    expect(CASTING_LINES.map((line) => line.id)).toEqual([
      'casting.1',
      'casting.2',
      'casting.3',
      'casting.4',
      'casting.5',
    ]);
    for (const line of CASTING_LINES) {
      expect(line.text.length).toBeGreaterThan(0);
      expect(hasLine(line.id)).toBe(false);
    }
  });
});

describe('id helpers', () => {
  it('builds the ids the generator writes as file names', () => {
    expect(orderCountLine(3, 'strawberry')).toBe('order.count.3.strawberry');
    expect(orderDigitLine(3)).toBe('order.digit.3');
    expect(orderLetterLine('K')).toBe('order.letter.k');
    expect(orderNextCountLine(3, 'strawberry')).toBe('order.next.count.3.strawberry');
    expect(orderNextDigitLine(3)).toBe('order.next.digit.3');
    expect(orderNextLetterLine('K')).toBe('order.next.letter.k');
    expect(letterWordLine('K', 'kočka')).toBe('letter.word.k.kocka');
    expect(letterWordLine('B', 'brácha')).toBe('letter.word.b.bracha');
    expect(countAloudLine(3)).toBe('count.3');
    expect(countEnoughLine(3, 'cherry')).toBe('count.enough.3.cherry');
    expect(praiseLines('female')[0]).toBe('praise.female.1');
  });

  it('tells a letter from a digit by the track element', () => {
    expect(wrongLine('K')).toBe('wrong.letter.k');
    expect(wrongLine('3')).toBe('wrong.digit.3');
    expect(seekLine('K')).toBe('seek.letter.k');
    expect(seekLine('10')).toBe('seek.digit.10');
    expect(hintLine('K')).toBe('hint.letter.k');
    expect(hintLine('10')).toBe('hint.digit.10');
  });

  it('answers even for input out of range – an unknown element means silence, not a crash', () => {
    expect(hasLine(wrongLine('Ž'))).toBe(false);
    expect(hasLine(orderDigitLine(42))).toBe(false);
    expect(hasLine(orderNextDigitLine(42))).toBe(false);
    expect(hasLine(orderCountLine(0, 'cherry'))).toBe(false);
    expect(hasLine(letterWordLine('K', 'kolo'))).toBe(false);
  });
});

const VOICE_DIR = 'public/audio/voice';
const INDEX_FILE = `${VOICE_DIR}/index.json`;

interface VoiceIndex {
  readonly voices: Readonly<
    Record<
      string,
      {
        readonly elevenLabsId: string;
        readonly lines: Readonly<Record<string, { readonly hash: string; readonly text: string }>>;
      }
    >
  >;
}

describe('voice table', () => {
  it('has usable, unique folder names', () => {
    const seen = new Set<string>();
    for (const voice of VOICES) {
      expect(voice.slug).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(seen.has(voice.slug), `duplicate slug ${voice.slug}`).toBe(false);
      seen.add(voice.slug);
      expect(voice.elevenLabsId.length).toBeGreaterThan(0);
      expect(voice.label.length).toBeGreaterThan(0);
    }
    expect(VOICES.length).toBeGreaterThan(0);
    expect(voiceBySlug(DEFAULT_VOICE)).not.toBeNull();
    expect(voiceBySlug('nobody')).toBeNull();
  });

  it('builds the clip path the generator writes', () => {
    expect(clipPath('cook', 'count.3')).toBe('audio/voice/cook/count.3.mp3');
  });
});

/** `describe.skipIf` skips the run, not the collection – so the files are read inside the tests. */
function loadIndex(): VoiceIndex {
  return JSON.parse(readFileSync(INDEX_FILE, 'utf8')) as VoiceIndex;
}

/** Only once the clips have been generated; the step is buildable in parts (STEP-07). */
describe.skipIf(!existsSync(INDEX_FILE))('generated audio', () => {
  it('has a clip and an up-to-date index entry for every line of every voice', () => {
    const index = loadIndex();
    for (const voice of VOICES) {
      const section = index.voices[voice.slug];
      expect(section, `${voice.slug} is not in the index`).toBeDefined();
      expect(section?.elevenLabsId).toBe(voice.elevenLabsId);
      const files = new Set(
        readdirSync(`${VOICE_DIR}/${voice.slug}`).filter((name) => name.endsWith('.mp3')),
      );
      for (const line of LINES) {
        const entry = section?.lines[line.id];
        expect(
          entry,
          `${voice.slug}/${line.id} is missing – run: docker compose run --rm voice`,
        ).toBeDefined();
        // The text in the index is what was really spoken; a manifest edit without a regeneration
        // would otherwise stay unnoticed until the child heard the old sentence.
        expect(entry?.text, `${voice.slug}/${line.id}`).toBe(line.text);
        expect(files.has(`${line.id}.mp3`), `${voice.slug}/${line.id}.mp3 is missing`).toBe(true);
      }
    }
  });

  it('has nothing extra in the index', () => {
    const index = loadIndex();
    const knownLines = new Set(LINES.map((line) => line.id));
    const knownVoices = new Set(VOICES.map((voice) => voice.slug));
    for (const [slug, section] of Object.entries(index.voices)) {
      expect(knownVoices.has(slug), `orphan voice ${slug} in the index`).toBe(true);
      for (const id of Object.keys(section.lines)) {
        expect(knownLines.has(id), `orphan ${slug}/${id} in the index`).toBe(true);
      }
    }
  });
});
