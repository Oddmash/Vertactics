import { expect, it } from 'vitest';
import { terrainBlocks } from './map';
import type { RiseDirection, Terrain, WorldPoint } from './map';
import { pickTerrainSurface } from './surface-height';

it.each<[RiseDirection, WorldPoint]>([
  ['+x', [3, 1.5, 2]], ['-x', [1, 1.5, 2]], ['+z', [2, 1.5, 3]], ['-z', [2, 1.5, 1]],
])('picks a continuous surface facing %s', (risesToward, point) => {
  const terrain: Terrain = { id: 'r', name: 'Ramp', kind: 'ramp', risesToward, origin: [0, 0, 0], size: [4, 2, 4] };
  const block = terrainBlocks(terrain)[0]!;
  expect(pickTerrainSurface(terrain, block, point, false)).toEqual(point);
  expect(pickTerrainSurface(terrain, block, [point[0], 0, point[2]], false)).toBeNull();
});

it('recomputes elevation after snapping to the grid', () => {
  const terrain: Terrain = { id: 'r', name: 'Ramp', kind: 'ramp', risesToward: '+x', origin: [0, 0, 0], size: [4, 2, 4] };
  const block = terrainBlocks(terrain)[0]!;
  expect(pickTerrainSurface(terrain, block, [2.6, 1.3, 1.2], true)).toEqual([3, 1.5, 1]);
});
