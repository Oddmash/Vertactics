import type { WorldPoint } from './map';

export const snapSurfacePoint = (
  [x, y, z]: WorldPoint,
  center: WorldPoint,
  size: WorldPoint,
): WorldPoint => {
  const snapAxis = (value: number, midpoint: number, extent: number) => {
    const first = Math.ceil(midpoint - extent / 2);
    const last = Math.floor(midpoint + extent / 2);
    return first <= last ? Math.max(first, Math.min(last, Math.round(value))) + 0 : value;
  };
  return [snapAxis(x, center[0], size[0]), y, snapAxis(z, center[2], size[2])];
};
