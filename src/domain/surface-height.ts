import type { RiseDirection, Terrain, TerrainBlock, WorldPoint } from './map';
import { isWalkableTerrain } from './map';
import { snapSurfacePoint } from './surface-snap';

export const slopeFraction = (direction: RiseDirection, x: number, z: number) => {
  const axis = direction.endsWith('x') ? x : z;
  return Math.max(0, Math.min(1, 0.5 + (direction.startsWith('+') ? axis : -axis)));
};

const surfaceHeight = ({ center, size, slope }: TerrainBlock, x: number, z: number) =>
  center[1] - size[1] / 2 + size[1] * (slope
    ? slopeFraction(slope, (x - center[0]) / size[0], (z - center[2]) / size[2])
    : 1);

export const pickTerrainSurface = (
  terrain: Terrain, block: TerrainBlock, [x, y, z]: WorldPoint, snap: boolean,
): WorldPoint | null => {
  if (!isWalkableTerrain(terrain) || Math.abs(y - surfaceHeight(block, x, z)) >= 0.0001) return null;
  const point: WorldPoint = [x, y, z];
  const [nextX, , nextZ] = snap ? snapSurfacePoint(point, block.center, block.size) : point;
  return [nextX, surfaceHeight(block, nextX, nextZ), nextZ];
};
