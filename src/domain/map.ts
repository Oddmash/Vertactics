export const terrainKinds = ['floor', 'wall', 'platform', 'stairs'] as const;

export type TerrainKind = (typeof terrainKinds)[number];
export type WorldPoint = [x: number, y: number, z: number];

type TerrainBase = {
  id: string;
  name: string;
  layerId?: string;
  origin: WorldPoint;
};

type Box = TerrainBase & {
  kind: Exclude<TerrainKind, 'stairs'>;
  size: WorldPoint;
};

type Stairs = TerrainBase & {
  kind: 'stairs';
  size: WorldPoint;
  steps: number;
  risesToward: '+x' | '-x' | '+z' | '-z';
};

export type Terrain = Box | Stairs;

export type MapLayer = { id: string; name: string };

export type MapDefinition = {
  schemaVersion: 1;
  id: string;
  name: string;
  terrain: Terrain[];
  layers?: MapLayer[];
};

export type TerrainBlock = { center: WorldPoint; size: WorldPoint };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isName = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const isWorldPoint = (value: unknown): value is WorldPoint =>
  Array.isArray(value) && value.length === 3 &&
  Array.from(value).every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate));

const parseTerrain = (value: unknown, index: number): Terrain => {
  const path = `terrain[${index}]`;
  if (!isRecord(value)) throw new Error(`Invalid ${path}`);

  const { id, kind, name, origin, size, steps, risesToward, layerId } = value;
  if (!isName(id) || !isName(name) || (layerId !== undefined && !isName(layerId)) || !isWorldPoint(origin) ||
    !isWorldPoint(size) || size.some((dimension) => dimension <= 0) ||
    size.some((dimension, axis) => !Number.isFinite(dimension + origin[axis]!))) {
    throw new Error(`Invalid bounds or metadata for ${path}`);
  }

  const layer = layerId === undefined ? {} : { layerId };
  if (kind === 'floor' || kind === 'wall' || kind === 'platform') {
    return { id, name, kind, origin, size, ...layer };
  }
  if (kind === 'stairs' && typeof steps === 'number' &&
    Number.isInteger(steps) && steps >= 2 && steps <= 64 &&
    (risesToward === '+x' || risesToward === '-x' || risesToward === '+z' || risesToward === '-z')) {
    return { id, name, kind, origin, size, ...layer, steps, risesToward };
  }
  throw new Error(`Invalid kind or step settings for ${path}`);
};

export const parseMap = (value: unknown): MapDefinition => {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isName(value.id) ||
    !isName(value.name) || !Array.isArray(value.terrain) || value.terrain.length === 0) {
    throw new Error('Invalid map definition or unsupported schema version');
  }

  const terrain = Array.from(value.terrain, parseTerrain);
  if (new Set(terrain.map(({ id }) => id)).size !== terrain.length) {
    throw new Error('Duplicate terrain id');
  }
  if (value.layers !== undefined && !Array.isArray(value.layers)) throw new Error('Invalid map layers');
  const layers = Array.from(value.layers ?? [], (item: unknown, index): MapLayer => {
    if (!isRecord(item) || !isName(item.id) || !isName(item.name)) throw new Error(`Invalid layers[${index}]`);
    return { id: item.id, name: item.name };
  });
  const layerIds = new Set(layers.map(({ id }) => id));
  if (layerIds.size !== layers.length || terrain.some(({ layerId }) => layerId !== undefined && !layerIds.has(layerId))) {
    throw new Error('Duplicate or unknown map layer ID');
  }
  return { schemaVersion: 1, id: value.id, name: value.name, terrain, ...(layers.length ? { layers } : {}) };
};

const blockAt = ([x, y, z]: WorldPoint, size: WorldPoint): TerrainBlock => ({
  center: [x + size[0] / 2, y + size[1] / 2, z + size[2] / 2],
  size,
});

export const terrainBlocks = (terrain: Terrain): TerrainBlock[] => {
  const { origin, size } = terrain;
  if (terrain.kind !== 'stairs') return [blockAt(origin, size)];

  const alongX = terrain.risesToward.endsWith('x');
  const axis = alongX ? 0 : 2;
  const run = size[axis] / terrain.steps;
  const rise = size[1] / terrain.steps;
  return Array.from({ length: terrain.steps }, (_, index) => {
    const stepOrigin: WorldPoint = [...origin];
    const stepSize: WorldPoint = [...size];
    const offset = terrain.risesToward.startsWith('+') ? index : terrain.steps - 1 - index;
    stepOrigin[axis] += offset * run;
    stepSize[axis] = run;
    stepSize[1] = (index + 1) * rise;
    return blockAt(stepOrigin, stepSize);
  });
};

export const visibleTerrainForLayer = (terrain: Terrain[], layerId: string) =>
  terrain.filter((item) => !layerId || !item.layerId || item.layerId === layerId);

export const topElevation = ({ origin, size }: Terrain) => origin[1] + size[1];

export const mapBounds = (terrain: Terrain[]) => {
  const min: WorldPoint = [Infinity, Infinity, Infinity];
  const max: WorldPoint = [-Infinity, -Infinity, -Infinity];
  for (const { origin, size } of terrain) {
    for (const axis of [0, 1, 2] as const) {
      min[axis] = Math.min(min[axis], origin[axis]);
      max[axis] = Math.max(max[axis], origin[axis] + size[axis]);
    }
  }
  const center: WorldPoint = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2,
  ];
  return { min, max, center };
};
