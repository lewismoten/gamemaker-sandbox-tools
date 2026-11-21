import { describe, expect, it } from 'vitest';
import { compile } from '../src/embroidery/compile';
import { writeDst, readDst } from '../src/embroidery/dst';
import { circle } from '../src/embroidery/geom';
import { tatami } from '../src/embroidery/fill';
import { satin } from '../src/embroidery/satin';
import { validate } from '../src/embroidery/validate';
import type { Design } from '../src/embroidery/types';

/** A pattern with a far jump (over the DST limit) and two colors, for the format edge cases. */
const small: Design = {
  name: 'TEST',
  hoop: [100, 100],
  blocks: [
    { thread: { name: 'a', rgb: [0, 0, 0] }, items: [{ kind: 'fill', polys: [circle(0, 0, 5, 32)], angle: 0 }] },
    {
      thread: { name: 'b', rgb: [255, 0, 0] },
      items: [
        {
          kind: 'satin',
          path: [
            [30, 30],
            [40, 35],
          ],
          width: 2,
        },
      ],
    },
  ],
};

describe('stitch generation', () => {
  it('fills with rows 0.4 mm apart and stays inside the shape', () => {
    const chains = tatami([circle(0, 0, 5, 64)], 0, 0.4, 3.5);
    const pts = chains.flat();
    expect(pts.every((p) => Math.hypot(p[0], p[1]) <= 5.001)).toBe(true);
    const rows = new Set(pts.map((p) => p[1].toFixed(3)));
    expect(rows.size).toBeGreaterThan(20);
  });

  it('splits a satin column wider than 7 mm into lanes', () => {
    expect(
      satin(
        [
          [0, 0],
          [20, 0],
        ],
        6,
        0.4,
        false,
        7,
      ),
    ).toHaveLength(1);
    expect(
      satin(
        [
          [0, 0],
          [20, 0],
        ],
        15,
        0.4,
        false,
        7,
      ),
    ).toHaveLength(3);
  });
});

describe('DST records', () => {
  it('splits jumps longer than 12.1 mm into DST records', () => {
    const r = readDst(writeDst(compile(small)));
    const report = validate(r.stitches, { hoop: [100, 100], colors: 2, maxRecord: 12.1 });
    expect(report.problems).toEqual([]);
    expect(report.jumps).toBeGreaterThan(3); // 40 mm out to the second color takes several
  });
});
