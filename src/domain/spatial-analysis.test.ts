import { expect, it } from 'vitest';
import { spatialBlockers, traceSightline } from './spatial-analysis';
import type { Terrain } from './map';

const wall: Terrain = { id: 'wall', name: 'Wall', kind: 'wall', origin: [2, 0, -1], size: [1, 3, 2] };

it('returns distinct collision and sight blockers based on each flag', () => {
  const screen: Terrain = { ...wall, id: 'screen', origin: [4, 0, -1], collision: false, blocksSight: true };
  const glass: Terrain = { ...wall, blocksSight: false };
  expect(spatialBlockers([glass, screen], [0, 2, 0], [6, 2, 0])).toEqual({ collision: glass, sight: screen });
  expect(spatialBlockers([glass, screen], [0, 4, 0], [6, 4, 0])).toEqual({ collision: undefined, sight: undefined });
});

it('tests the sloped solid rather than the full ramp bounds', () => {
  const ramp: Terrain = { id: 'ramp', name: 'Ramp', kind: 'ramp', origin: [0, 0, 0], size: [4, 2, 4], risesToward: '+x' };
  expect(spatialBlockers([ramp], [1, 1, -1], [1, 1, 5]).sight).toBeUndefined();
  expect(spatialBlockers([ramp], [3, 1, -1], [3, 1, 5]).sight).toBe(ramp);
});

it('ends a sightline at the first sight-blocking surface in world coordinates', () => {
  const glass: Terrain = { ...wall, blocksSight: false };
  const screen: Terrain = { ...wall, id: 'screen', origin: [4, 0, -1] };
  expect(traceSightline([screen, glass], [0, 1, 0], [6, 2.5, 0])).toEqual({
    collision: glass, sight: screen, endpoint: [4, 2, 0],
  });
  expect(traceSightline([screen, glass], [0, 4, 0], [6, 4, 0]).endpoint).toEqual([6, 4, 0]);
});
