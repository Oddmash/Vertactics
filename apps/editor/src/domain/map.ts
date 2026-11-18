export const terrainKinds = ['floor', 'wall', 'platform', 'stairs', 'ramp', 'building', 'column', 'railing', 'doorway', 'drop-zone'] as const;

export type TerrainKind = (typeof terrainKinds)[number];
export type WorldPoint = [x: number, y: number, z: number];

type TerrainBase = {
  id: string;
  name: string;
  layerId?: string;
  walkable?: boolean;
  collision?: boolean;
  blocksSight?: boolean;
  material?: string;
  origin: WorldPoint;
};

type Box = TerrainBase & {
  kind: Exclude<TerrainKind, 'stairs' | 'ramp'>;
  size: WorldPoint;
};

export type RiseDirection = '+x' | '-x' | '+z' | '-z';

type Ramp = TerrainBase & { kind: 'ramp'; size: WorldPoint; risesToward: RiseDirection };

type Stairs = TerrainBase & {
  kind: 'stairs';
  size: WorldPoint;
  steps: number;
  risesToward: RiseDirection;
};

export type Terrain = Box | Stairs | Ramp;

export type MapLayer = { id: string; name: string };

export const verificationStates = ['synthetic', 'unverified', 'verified'] as const;
export type MapVerification = (typeof verificationStates)[number];
export type MapMetadata = { verification: MapVerification; source?: string };

export const mapSchemaVersion = 2;

export type MapDefinition = {
  schemaVersion: typeof mapSchemaVersion;
  id: string;
  name: string;
  terrain: Terrain[];
  layers?: MapLayer[];
  metadata?: MapMetadata;
};

export type TerrainBlock = { center: WorldPoint; size: WorldPoint; slope?: RiseDirection };

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

  const { id, kind, name, origin, size, steps, risesToward, layerId, walkable, collision, blocksSight, material } = value;
  if (!isName(id) || !isName(name) || (layerId !== undefined && !isName(layerId)) || !isWorldPoint(origin) ||
    !isWorldPoint(size) || size.some((dimension) => dimension <= 0) ||
    size.some((dimension, axis) => !Number.isFinite(dimension + origin[axis]!)) ||
    (walkable !== undefined && typeof walkable !== 'boolean') ||
    (collision !== undefined && typeof collision !== 'boolean') ||
    (blocksSight !== undefined && typeof blocksSight !== 'boolean') ||
    (material !== undefined && (typeof material !== 'string' || !/^#[0-9a-f]{6}$/i.test(material)))) {
    throw new Error(`Invalid bounds or metadata for ${path}`);
  }

  const options = {
    ...(layerId === undefined ? {} : { layerId }),
    ...(walkable === undefined ? {} : { walkable }),
    ...(collision === undefined ? {} : { collision }),
    ...(blocksSight === undefined ? {} : { blocksSight }),
    ...(material === undefined ? {} : { material }),
  };
  const solidKind = terrainKinds.find((item) => item === kind);
  if (solidKind && solidKind !== 'stairs' && solidKind !== 'ramp') {
    return { id, name, kind: solidKind, origin, size, ...options };
  }
  if (risesToward === '+x' || risesToward === '-x' || risesToward === '+z' || risesToward === '-z') {
    if (kind === 'ramp') return { id, name, kind, origin, size, ...options, risesToward };
    if (kind === 'stairs' && typeof steps === 'number' && Number.isInteger(steps) && steps >= 2 && steps <= 64) {
      return { id, name, kind, origin, size, ...options, steps, risesToward };
    }
  }
  throw new Error(`Invalid kind or step settings for ${path}`);
};

export const parseMap = (value: unknown): MapDefinition => {
  if (!isRecord(value) || (value.schemaVersion !== 1 && value.schemaVersion !== mapSchemaVersion) || !isName(value.id) ||
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
  const metadata = value.metadata;
  let parsedMetadata: MapMetadata | undefined;
  if (metadata !== undefined) {
    if (!isRecord(metadata)) throw new Error('Invalid map metadata');
    const verification = verificationStates.find((state) => state === metadata.verification);
    const source = metadata.source;
    if (!verification || (source !== undefined && !isName(source)) || (verification === 'verified' && !source)) {
      throw new Error('Invalid verification status or source');
    }
    parsedMetadata = { verification, ...(source === undefined ? {} : { source }) };
  }
  return {
    schemaVersion: mapSchemaVersion, id: value.id, name: value.name, terrain,
    ...(layers.length ? { layers } : {}),
    ...(parsedMetadata ? { metadata: parsedMetadata } : {}),
  };
};

const blockAt = ([x, y, z]: WorldPoint, size: WorldPoint): TerrainBlock => ({
  center: [x + size[0] / 2, y + size[1] / 2, z + size[2] / 2],
  size,
});

export const terrainBlocks = (terrain: Terrain): TerrainBlock[] => {
  const { origin, size } = terrain;
  if (terrain.kind === 'doorway') {
    const [x, y, z] = origin;
    const [width, height, depth] = size;
    const header = height * 0.2;
    const postHeight = height - header;
    if (width >= depth) {
      const post = width * 0.15;
      return [
        blockAt(origin, [post, postHeight, depth]),
        blockAt([x + width - post, y, z], [post, postHeight, depth]),
        blockAt([x, y + postHeight, z], [width, header, depth]),
      ];
    }
    const post = depth * 0.15;
    return [
      blockAt(origin, [width, postHeight, post]),
      blockAt([x, y, z + depth - post], [width, postHeight, post]),
      blockAt([x, y + postHeight, z], [width, header, depth]),
    ];
  }
  if (terrain.kind === 'ramp') return [{ ...blockAt(origin, size), slope: terrain.risesToward }];
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

export const isWalkableTerrain = ({ kind, walkable }: Terrain) =>
  walkable ?? (kind === 'floor' || kind === 'platform' || kind === 'stairs' || kind === 'ramp');

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
