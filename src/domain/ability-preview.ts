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
