import type { Terrain } from './map';

const clockwise = { '+x': '+z', '+z': '-x', '-x': '-z', '-z': '+x' } as const;

export const rotateTerrain = (terrain: Terrain): Terrain => {
  const [x, y, z] = terrain.origin;
  const [width, height, depth] = terrain.size;
  const offset = (width - depth) / 2;
  return {
    ...terrain,
    origin: [x + offset, y, z - offset],
    size: [depth, height, width],
    ...((terrain.kind === 'stairs' || terrain.kind === 'ramp') ? { risesToward: clockwise[terrain.risesToward] } : {}),
  };
};

export const snapTerrain = (terrain: Terrain): Terrain => ({
  ...terrain,
  origin: [Math.round(terrain.origin[0]) + 0, terrain.origin[1], Math.round(terrain.origin[2]) + 0],
});
