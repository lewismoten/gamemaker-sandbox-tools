// Every text PLAYGAME draws over a Sandbox game's pictures lands on plain paper
// (games/kit/textfit.ts): text pages, the menu, the high scores, load and save.
import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { checkTextScreen, readDisk, textScreens } from '../src/kit/textfit';

const GAMES = ['blaster', 'logic', 'maximus', 'sandcast', 'sleuth', 'snowbound', 'teddy'];

describe('text fit', () => {
  for (const id of GAMES)
    it(`${id}: no text over art`, () => {
      const screens = textScreens(readDisk(join(__dirname, '..', '..', 'games', id, 'disk')));
      expect(screens.length).toBeGreaterThan(5);
      expect(screens.flatMap((s) => checkTextScreen(s)).map((i) => `${i.screen} "${i.text}": ${i.problems.join(', ')}`)).toEqual([]);
    });
});
