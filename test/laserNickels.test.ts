// Laser SVG builder and pixel text.
import { describe, expect, it } from 'vitest';
import { tooClose } from '../src/kit/laserClearance';
import { arcText, lineText, mergeRuns } from '../src/kit/laserPixels';
import { CUT, ENGRAVE, LaserSheet, SCORE } from '../src/kit/laserSvg';

describe('laser SVG builder', () => {
  it('uses red cut, blue engrave and magenta score, each in its own stroke or fill', () => {
    expect([CUT, ENGRAVE, SCORE]).toEqual(['#ff0000', '#0000ff', '#ff00ff']);
    const s = new LaserSheet(38.1, 38.1);
    s.add({ op: 'cut', k: 'circle', cx: 19.05, cy: 19.05, r: 19.05 });
    s.add({ op: 'engrave', k: 'ring', cx: 19.05, cy: 19.05, r0: 16, r1: 17 });
    const svg = s.svg('t');
    expect(svg).toContain('width="38.1mm" height="38.1mm" viewBox="0 0 38.1 38.1"');
    expect(svg).toContain(`<g id="cut" fill="none" stroke="${CUT}"`);
    expect(svg).toContain(`<g id="engrave" fill="${ENGRAVE}" stroke="none"`);
  });
  it('merges runs of pixels into few rectangles', () => {
    expect(mergeRuns({ w: 4, h: 3, on: () => true })).toEqual([[0, 0, 4, 3]]);
  });
  it('sets text from pixels, 2.5 mm tall letters, and round an arc', () => {
    const s = new LaserSheet(40, 40);
    expect(lineText(s, 'GOOD', 'pc', 20, 20, 0.36).h).toBeCloseTo(2.52, 2);
    const a = new LaserSheet(40, 40);
    expect(arcText(a, 'SANDBOX', 'micro', 20, 20, 15, 0.5, false)).toBeGreaterThan(30);
  });
  it('finds elements that come too close, and clears ones that do not', () => {
    const s = new LaserSheet(40, 40);
    s.add({ op: 'engrave', k: 'circle', cx: 10, cy: 10, r: 2 });
    s.add({ op: 'engrave', k: 'circle', cx: 13.2, cy: 10, r: 1 }); // 0.2 mm apart
    s.add({ op: 'engrave', k: 'circle', cx: 30, cy: 30, r: 1 });
    const found = tooClose(
      s,
      [
        { name: 'a', from: 0, to: 1 },
        { name: 'b', from: 1, to: 2 },
        { name: 'c', from: 2, to: 3 },
      ],
      0.6,
    );
    expect(found.map((c) => `${c.a}/${c.b}`)).toEqual(['a/b']);
    expect(found[0].mm).toBeGreaterThan(0.1);
    expect(found[0].mm).toBeLessThan(0.4);
  });
});
