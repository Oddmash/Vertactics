import { isWorldPoint } from './map';
import type { WorldPoint } from './map';

export const abilityShapes = ['circle', 'sphere', 'cone', 'line', 'rectangle', 'vector', 'area'] as const;
export type AbilityShape = (typeof abilityShapes)[number];

export type AbilityPreviewSettings = {
  abilityId: string;
  shape: AbilityShape;
  range: number;
  width: number;
  angle: number;
  direction: number;
  verification: 'custom';
};

export type AbilityPlacement = AbilityPreviewSettings & {
  id: string;
  heroId: string;
  position: WorldPoint;
  heading: number;
  visible: boolean;
};

const inRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && value >= min && value <= max;

const hasText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const parseAbilityPlacements = (value: unknown): AbilityPlacement[] => {
  if (!Array.isArray(value)) throw new Error('Invalid abilities');
  const ids = new Set<string>();
  return Array.from(value, (item: unknown, index) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new Error(`Invalid abilities[${index}]`);
    }
    const { id, heroId, abilityId, shape, range, width, angle, direction, verification, position, heading, visible } =
      item as Record<string, unknown>;
    const abilityShape = abilityShapes.find((candidate) => candidate === shape);
    if (!hasText(id) || ids.has(id) || !hasText(heroId) || !hasText(abilityId) || !abilityShape ||
      !inRange(range, 0.1, 1000) || !inRange(width, 0.1, 1000) || !inRange(angle, 1, 360) ||
      !inRange(direction, -360, 360) || verification !== 'custom' || !isWorldPoint(position) ||
      (typeof heading !== 'number' || heading < 0 || !(heading < 360)) || typeof visible !== 'boolean') {
      throw new Error(`Invalid or duplicate abilities[${index}]`);
    }
    ids.add(id);
    return { id, heroId, abilityId, shape: abilityShape, range, width, angle, direction, verification,
      position: [...position], heading, visible };
  });
};

export const abilityPolylines = (
  { shape, range, width, angle, direction }: AbilityPreviewSettings,
  [x, y, z]: WorldPoint,
  heading: number,
): WorldPoint[][] => {
  const yaw = (heading + direction) * Math.PI / 180;
  const project = (right: number, forward: number, elevation = 0): WorldPoint => [
    x + right * Math.cos(yaw) + forward * Math.sin(yaw),
    y + elevation,
    z + right * Math.sin(yaw) - forward * Math.cos(yaw),
  ];
  const arc = (from: number, to: number, point: (cos: number, sin: number) => WorldPoint) =>
    Array.from({ length: 49 }, (_, index) => {
      const theta = from + (to - from) * index / 48;
      return point(Math.cos(theta), Math.sin(theta));
    });

  if (shape === 'circle' || shape === 'sphere') {
    const horizontal = arc(0, 2 * Math.PI, (cos, sin) => project(range * sin, range * cos));
    return shape === 'circle' ? [horizontal] : [
      horizontal,
      arc(0, 2 * Math.PI, (cos, sin) => project(range * cos, 0, range * sin)),
      arc(0, 2 * Math.PI, (cos, sin) => project(0, range * cos, range * sin)),
    ];
  }
  if (shape === 'cone') {
    const half = angle * Math.PI / 360;
    const points = arc(-half, half, (cos, sin) => project(range * sin, range * cos));
    return [[project(0, 0), ...points, project(0, 0)]];
  }
  if (shape === 'rectangle' || shape === 'area') {
    const near = shape === 'area' ? -range / 2 : 0;
    const far = near + range;
    const halfWidth = width / 2;
    const corner = project(-halfWidth, near);
    return [[corner, project(halfWidth, near), project(halfWidth, far), project(-halfWidth, far), corner]];
  }

  const end = project(0, range);
  if (shape === 'vector') {
    const arrow = range * 0.18;
    return [[project(0, 0), end], [project(-arrow / 2, range - arrow), end, project(arrow / 2, range - arrow)]];
  }
  return [[project(0, 0), end]];
};
