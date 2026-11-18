import { isWorldPoint } from './map';
import type { WorldPoint } from './map';

export const annotationKinds = ['route', 'line', 'circle', 'area', 'note', 'pen'] as const;
export type AnnotationKind = (typeof annotationKinds)[number];

export type Annotation = {
  id: string;
  kind: AnnotationKind;
  label: string;
  points: WorldPoint[];
};

export const annotationPointCount = (kind: AnnotationKind) => kind === 'note' ? 1 : 2;

export const parseAnnotations = (value: unknown): Annotation[] => {
  if (!Array.isArray(value)) throw new Error('Invalid annotations');

  const ids = new Set<string>();
  return Array.from(value, (item: unknown, index): Annotation => {
    const path = `annotations[${index}]`;
    if (typeof item !== 'object' || item === null) throw new Error(`Invalid ${path}`);
    const { id, kind, label, points } = item as Record<string, unknown>;
    const validKind = annotationKinds.find((option) => option === kind);
    if (typeof id !== 'string' || !id.trim() || !validKind || typeof label !== 'string' ||
      !label.trim() || label.length > 80 || !Array.isArray(points)) throw new Error(`Invalid ${path}`);

    const minimum = annotationPointCount(validKind);
    const maximum = (validKind === 'route' || validKind === 'pen') ? 64 : minimum;
    const coordinates = Array.from(points, (point: unknown): WorldPoint => {
      if (!isWorldPoint(point)) throw new Error(`Invalid coordinates in ${path}`);
      return [...point];
    });

    if (coordinates.length < minimum || coordinates.length > maximum || ids.has(id)) {
      throw new Error(`Invalid point count or duplicate ID in ${path}`);
    }
    ids.add(id);
    return { id, kind: validKind, label, points: coordinates };
  });
};
