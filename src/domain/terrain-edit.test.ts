import { expect, it } from 'vitest';
import type { Terrain } from './map';
import { rotateTerrain, snapTerrain } from './terrain-edit';

const stairs: Terrain = {
  id: 'stairs', name: 'Stairs', kind: 'stairs', origin: [1.2, 0.5, -0.2],
  size: [6, 2, 2], steps: 4, risesToward: '+x',
};

it('rotates around the horizontal center and turns the stair direction', () => {
  const rotated = rotateTerrain(stairs);
  expect(rotated.origin).toEqual([3.2, 0.5, -2.2]);
  expect(rotated.size).toEqual([2, 2, 6]);
  expect(rotated).toHaveProperty('risesToward', '+z');
});

it('snaps horizontally without changing elevation or geometry', () => {
  expect(snapTerrain(stairs)).toEqual({ ...stairs, origin: [1, 0.5, 0] });
});
