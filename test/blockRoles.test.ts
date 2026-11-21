import { describe, expect, it } from 'vitest';
import {
  SOLBOT,
  SOLLEF,
  SOLRIG,
  SOLTOP,
  emptyBlock,
  type Block,
} from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { defaultPalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { blocksWithRole, cleanRoles, packRoles, pendingSuggestions, suggestRoles } from '../src/kit/blockRoles';
const ALL = SOLTOP | SOLRIG | SOLBOT | SOLLEF;
const roles = (b: Partial<Block>, i = 5) => suggestRoles({ ...emptyBlock(i), ...b }, i).map((s) => s.role);

describe('suggestRoles evidence rows', () => {
  it('solid all round is a wall; top only a platform', () => {
    expect(roles({ solid: ALL })).toEqual(['wall']);
    expect(roles({ solid: SOLTOP })).toEqual(['platform']);
  });
  it('touch that turns into another block is a door; solid ones a locked door', () => {
    expect(roles({ touchBl: 9 })).toContain('door');
    expect(roles({ solid: ALL, touchBl: 9 })).toEqual(['locked-door']);
  });
  it('a negative special counter is a lock with its number', () => {
    const s = suggestRoles({ ...emptyBlock(5), solid: ALL, effect: 22, eamt: -1 }, 5);
    expect(s[0]).toMatchObject({ role: 'locked-door', pair: 3 });
  });
  it('pick-ups: money and score are treasure, counter plus a key, lives a life', () => {
    expect(roles({ obj: 1, effect: 3, eamt: 10 })).toEqual(['treasure']);
    expect(roles({ obj: 1, scorePts: 50 })).toEqual(['treasure']);
    expect(suggestRoles({ ...emptyBlock(5), obj: 1, effect: 21, eamt: 1 }, 5)).toEqual([{ role: 'key', why: expect.any(String), pair: 2 }]);
    expect(roles({ obj: 1, effect: 1, eamt: 1 })).toEqual(['life']);
  });
  it('hurting, ladder and spawn', () => {
    expect(roles({ chHitPt: -3 })).toContain('hazard');
    expect(roles({ grav: 5 })).toEqual(['ladder']);
    expect(roles({ grav: 4 })).toEqual(['floor']);
    expect(roles({ birthMon: 2, birthTime: 90 })).toContain('monster-spawn');
  });
  it('a plain walkable block is a floor; a blue picture water or sky (needs the palette)', () => {
    expect(roles({})).toEqual(['floor']);
    const pal = defaultPalette();
    const b = emptyBlock(5);
    // find a palette color that reads as blue
    let blue = 0;
    for (let c = 0; c < 256; c++) {
      const r = pal[c * 3],
        g = pal[c * 3 + 1],
        bl = pal[c * 3 + 2];
      if (bl > 40 && bl > r * 2 && bl > g * 1.5) blue = c;
    }
    expect(blue).toBeGreaterThan(0);
    b.pixels.fill(blue);
    const got = suggestRoles(b, 5, { palette: pal }).map((s) => s.role);
    expect(got).toContain('water');
    expect(got).not.toContain('floor');
    expect(suggestRoles(b, 5).map((s) => s.role)).toEqual(['floor']);
  });
  it('terrain membership suggests an edge piece, and chosen roles are not suggested again', () => {
    const s = suggestRoles({ ...emptyBlock(5), solid: ALL }, 5, { inTerrain: true });
    expect(s.map((x) => x.role)).toEqual(['wall', 'wall-edge']);
    expect(pendingSuggestions(['wall'], s).map((x) => x.role)).toEqual(['wall-edge']);
  });
});

describe('roles in the companion', () => {
  it('cleans junk and keeps extras only where they apply', () => {
    const m = cleanRoles(
      {
        '1': { roles: ['chair', 'chair', 'nope'], facing: 'S', pair: 4 },
        '2': { roles: ['key'], pair: 3, facing: 'N' },
        '999': { roles: ['wall'] },
        '3': { roles: [] },
        x: { roles: ['wall'] },
      },
      256,
    );
    expect(m).toEqual({ 1: { roles: ['chair'], facing: 'S' }, 2: { roles: ['key'], pair: 3 } });
    expect(blocksWithRole(m, 'key', 3)).toEqual([2]);
    expect(packRoles({})).toBeUndefined();
  });
});
