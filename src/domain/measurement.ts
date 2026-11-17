import type { WorldPoint } from './map';

export const measureSegment = ([x1, y1, z1]: WorldPoint, [x2, y2, z2]: WorldPoint) => {
  const horizontal = Math.hypot(x2 - x1, z2 - z1);
  const rise = y2 - y1;
  return { horizontal, rise, distance: Math.hypot(horizontal, rise) };
};
