// Check the app's generated wooden nickels.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CUT, ENGRAVE } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';

const dir = join(__dirname, '../public/laser');
const games = existsSync(dir)
  ? readdirSync(dir).filter((g) => existsSync(join(dir, g, 'manifest.json')) && JSON.parse(readFileSync(join(dir, g, 'manifest.json'), 'utf8')).kind !== 'kit')
  : [];
const read = (g: string, f: string) => readFileSync(join(dir, g, f), 'utf8');

describe.skipIf(!games.length)('wooden nickels the build made', () => {
  for (const game of games)
    it(`${game}: colors, millimeters, cuts, series, spacing`, () => {
      const man = JSON.parse(read(game, 'manifest.json'));
      const holes = man.holes.length;
      for (const file of ['front', 'back', 'sheet', 'sheet-back']) {
        const svg = read(game, `${file}.svg`);
        const colors = new Set([...svg.matchAll(/(?:stroke|fill)="(#[0-9a-fA-F]{3,6})"/g)].map((m) => m[1].toLowerCase()));
        expect([...colors].every((c) => [CUT, ENGRAVE].includes(c))).toBe(true); // no magenta score on a coin
        expect(svg).not.toMatch(/<text|font-family|transform=|#ff00ff/);
        expect(svg).toContain(`<g id="engrave" fill="${ENGRAVE}" stroke="none">`);
        expect(svg).toContain(`<g id="cut" fill="none" stroke="${CUT}"`);
        expect(svg).not.toContain('id="score"'); // nothing on a coin is scored
        const m = svg.match(/width="([\d.]+)mm" height="([\d.]+)mm" viewBox="0 0 ([\d.]+) ([\d.]+)"/)!;
        expect([m[1], m[2]]).toEqual([m[3], m[4]]);
        const [w, h] = [Number(m[1]), Number(m[2])];
        if (file.startsWith('sheet')) expect([w <= 270, h <= 480]).toEqual([true, true]);
        else expect([w, h]).toEqual([38.1, 38.1]);
        // every cut is a circle or a path that closes with Z; the back files cut nothing
        const cut = svg.match(/<g id="cut"[^>]*>(.*?)<\/g>/s)![1];
        for (const p of cut.matchAll(/<path d="([^"]*)"/g)) expect(p[1].trim().endsWith('Z')).toBe(true);
        const cuts = (cut.match(/<circle/g) ?? []).length + (cut.match(/<path/g) ?? []).length;
        expect(cuts).toBe({ front: 1 + holes, back: 0, sheet: 13 + 12 * holes, 'sheet-back': 0 }[file]);
      }
      // the coin's cut circle encloses all its engraving (a little bleed allowed)
      const front = read(game, 'front.svg');
      const c = 19.05;
      const eng = front.match(/<g id="engrave"[^>]*>(.*)<\/g>/s)![1];
      for (const p of eng.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)) expect(Math.hypot(Number(p[1]) - c, Number(p[2]) - c)).toBeLessThanOrEqual(c + 0.2);
      expect(man.reach.front).toBeLessThanOrEqual(15.15);
      expect(man.reach.back).toBeLessThanOrEqual(15.15);
      // letters, series, holes, spacing
      for (const t of [...man.texts.front, ...man.texts.back]) expect(t.capMm).toBeGreaterThanOrEqual(2.45);
      expect(man.series.of).toBe(26);
      expect(man.series.message[man.series.no - 1]).toBe(man.series.letter);
      expect(read(game, 'back.svg').length).toBeGreaterThan(2000);
      for (const hole of man.holes) expect(c - (Math.hypot(hole.x, hole.y) + hole.r)).toBeGreaterThanOrEqual(3);
      expect(man.clearance.front).toEqual([]);
      expect(man.clearance.back).toEqual([]);
    });
  it('numbers the series 1 to 26 once each, and the letters spell the message', () => {
    const all = games.map((g) => JSON.parse(read(g, 'manifest.json')).series as { no: number; letter: string; message: string });
    expect(new Set(all.map((s) => s.no)).size).toBe(all.length);
    for (const s of all) expect(s.message[s.no - 1]).toBe(s.letter);
  });
});
