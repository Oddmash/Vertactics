import { terrainBlocks } from './map';
import type { Terrain, TerrainBlock, WorldPoint } from './map';
import { slopeFraction } from './surface-height';

const axes = [0, 1, 2] as const;

const intersection = (block: TerrainBlock, start: WorldPoint, end: WorldPoint): number | null => {
  let entry = 0;
  let exit = 1;
  for (const axis of axes) {
    const half = block.size[axis] / 2;
    const min = block.center[axis] - half;
    const max = block.center[axis] + half;
    const delta = end[axis] - start[axis];
    if (delta === 0) {
      if (start[axis] < min || start[axis] > max) return null;
      continue;
    }
    const first = (min - start[axis]) / delta;
    const last = (max - start[axis]) / delta;
    entry = Math.max(entry, Math.min(first, last));
    exit = Math.min(exit, Math.max(first, last));
    if (entry > exit) return null;
  }
  if (block.slope) {
    const axis = block.slope.endsWith('x') ? 0 : 2;
    const rise = block.size[1] * (block.slope.startsWith('+') ? 1 : -1);
    const yAt = (time: number) => start[1] + (end[1] - start[1]) * time;
    const heightAt = (time: number) => {
      const ratio = (start[axis] + (end[axis] - start[axis]) * time - block.center[axis]) / block.size[axis];
      return block.center[1] - block.size[1] / 2 + block.size[1] *
        slopeFraction(block.slope!, axis === 0 ? ratio : 0, axis === 2 ? ratio : 0);
    };
    const onEntry = yAt(entry) - heightAt(entry);
    const onExit = yAt(exit) - heightAt(exit);
    if (onEntry > 0 && onExit > 0) return null;
    if (onEntry > 0 && onExit <= 0) {
      const change = end[1] - start[1] - rise * (end[axis] - start[axis]) / block.size[axis];
      entry -= onEntry / change;
    }
  }
  return entry;
};

export const traceSightline = (terrain: Terrain[], start: WorldPoint, end: WorldPoint) => {
  let collision: { item: Terrain; time: number } | undefined;
  let sight: { item: Terrain; time: number } | undefined;
  for (const item of terrain) {
    const solid = item.kind !== 'drop-zone';
    const collides = item.collision ?? solid;
    const blocksSight = item.blocksSight ?? solid;
    if (!collides && !blocksSight) continue;
    for (const block of terrainBlocks(item)) {
      const time = intersection(block, start, end);
      if (time === null) continue;
      if (collides && (!collision || time < collision.time)) collision = { item, time };
      if (blocksSight && (!sight || time < sight.time)) sight = { item, time };
    }
  }
  const through = sight?.time ?? 1;
  const endpoint: WorldPoint = [
    start[0] + (end[0] - start[0]) * through,
    start[1] + (end[1] - start[1]) * through,
    start[2] + (end[2] - start[2]) * through,
  ];
  return { collision: collision?.item, sight: sight?.item, endpoint };
};

export const spatialBlockers = (terrain: Terrain[], start: WorldPoint, end: WorldPoint) => {
  const { collision, sight } = traceSightline(terrain, start, end);
  return { collision, sight };
};
