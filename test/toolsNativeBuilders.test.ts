// Portable builders encode native files and keep legacy simulator initialization explicit.
import { expect, it } from 'vitest';
import { recordedDemo } from '../src/kit/recordedDemo';
import { parseRecording } from '../src/formats/recording';
import { expectScene } from '../src/kit/routeChecks';
import { initializeScene, legacySceneInits } from '../src/kit/sceneInit';
import { Sim } from '../src/simulation';
import { newMap } from '../src/formats/map';
import { emptyBlock } from '../src/formats/blocks';
import { newCharacter } from '../src/formats/character';
it('encodes recorded keys and configurable Escape timing without mutating the source', () => {
  const pairs = [1, 77, 5, 205];
  expect(parseRecording(recordedDemo(pairs, 7, 2))).toEqual([
    { delta: 1, key: 77 },
    { delta: 5, key: 205 },
    { delta: 7, key: 1 },
    { delta: 2, key: 129 },
  ]);
  expect(pairs).toEqual([1, 77, 5, 205]);
  expect(() => recordedDemo([1])).toThrow(RangeError);
});
it('retains only the last route diagnostics when a scene assertion fails', () => {
  const bot = { sim: { scene: 2 }, log: Array.from({ length: 10 }, (_, i) => `note${i}`) };
  expect(() => expectScene(bot, 2, 'room')).not.toThrow();
  expect(() => expectScene(bot, 3, 'exit')).toThrow('Expected exit (scene 3), in scene 2\nnote2');
});
it('delegates scene setup while preserving the opt-in older birth schedule', () => {
  const sim = new Sim(
    {
      map: newMap(),
      bbl: Array.from({ length: 150 }, (_, i) => emptyBlock(i)),
      chr: newCharacter(),
      cbl: Array.from({ length: 50 }, (_, i) => emptyBlock(i, true)),
    },
    { x: 8, y: 9 },
  );
  sim.w.noMons = true;
  sim.w.bg[0].birthTime = 7;
  initializeScene(sim.w, { x: 8, y: 9 });
  expect(sim.w.blkMon).toEqual([]);
  legacySceneInits(sim.w, { x: 8, y: 9 });
  expect(sim.w.blkMon).toEqual([{ blnum: 0, nexttime: sim.w.clock + 7 }]);
});
