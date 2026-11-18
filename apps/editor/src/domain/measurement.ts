import type { WorldPoint } from './map';

export const measureSegment = ([x1, y1, z1]: WorldPoint, [x2, y2, z2]: WorldPoint) => {
  const horizontal = Math.hypot(x2 - x1, z2 - z1);
  const rise = y2 - y1;
  return { horizontal, rise, distance: Math.hypot(horizontal, rise) };
};

export const measureRoute = (points: readonly WorldPoint[]) => {
  let horizontal = 0;
  let distance = 0;
  let previous: WorldPoint | undefined;
  for (const point of points) {
    if (previous) {
      const segment = measureSegment(previous, point);
      horizontal += segment.horizontal;
      distance += segment.distance;
    }
    previous = point;
  }
  return { horizontal, distance };
};
