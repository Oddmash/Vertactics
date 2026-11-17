import { expect, it } from 'vitest';
import { sampleExposure, spatialBlockers, traceSightline } from './spatial-analysis';
import type { Terrain, WorldPoint } from './map';

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

it('distinguishes partial exposure, an open target and full cover', () => {
  const lowCover: Terrain = { ...wall, size: [1, 1.6, 2] };
  const observer: WorldPoint = [0, 1.6, 0];
  const target: WorldPoint = [6, 0, 0];
  expect(sampleExposure([lowCover], observer, target)).toEqual({
    status: 'partial',
    visibleCount: 1,
    samples: [
      { part: 'lower', visible: false },
      { part: 'middle', visible: false },
      { part: 'upper', visible: true },
    ],
  });
  expect(sampleExposure([lowCover], observer, [6, 2, 0]).status).toBe('clear');
  expect(sampleExposure([wall], observer, target).status).toBe('blocked');
  expect(sampleExposure([{ ...wall, blocksSight: false }], observer, target).status).toBe('clear');
});

it('counts contact with an obstacle boundary and misses rays just outside it', () => {
  expect(traceSightline([wall], [0, 3, -1], [6, 3, -1]).endpoint).toEqual([2, 3, -1]);
  expect(traceSightline([wall], [0, 3.001, -1], [6, 3.001, -1]).sight).toBeUndefined();
  expect(traceSightline([wall], [0, 3, -1], [1.99, 3, -1]).sight).toBeUndefined();
});

it('uses individual stair heights and treats the taller side of a shared edge as solid', () => {
  const stairs: Terrain = {
    id: 'stairs', name: 'Stairs', kind: 'stairs', origin: [0, 0, 0], size: [4, 4, 2], steps: 4, risesToward: '+x',
  };
  expect(traceSightline([stairs], [0.5, 1.5, -1], [0.5, 1.5, 3]).sight).toBeUndefined();
  expect(traceSightline([stairs], [1.99, 2.5, -1], [1.99, 2.5, 3]).sight).toBeUndefined();
  expect(traceSightline([stairs], [2, 2.5, -1], [2, 2.5, 3]).sight).toBe(stairs);
});

it('traces through a doorway opening and hits the frame above or beside it', () => {
  const doorway: Terrain = { id: 'door', name: 'Doorway', kind: 'doorway', origin: [0, 0, 0], size: [4, 4, 1] };
  expect(traceSightline([doorway], [2, 2, -1], [2, 2, 2]).sight).toBeUndefined();
  expect(traceSightline([doorway], [2, 3.5, -1], [2, 3.5, 2]).sight).toBe(doorway);
  expect(traceSightline([doorway], [0.2, 2, -1], [0.2, 2, 2]).sight).toBe(doorway);
});
