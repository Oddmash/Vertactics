import { useMemo } from 'react';
import type { Annotation } from '../domain/annotation';
import type { WorldPoint } from '../domain/map';
import tokens from '../theme/tokens.json';

const lift = 0.14;
const skipRaycast = () => undefined;

const outline = ({ kind, points }: Annotation): WorldPoint[] => {
  const [first, second] = points;
  if (!first || !second) return [];
  if (kind === 'area') {
    const [x, y, z] = first;
    return [first, [second[0], y, z], [second[0], y, second[2]], [x, y, second[2]], first];
  }
  if (kind === 'circle') {
    const radius = Math.hypot(second[0] - first[0], second[2] - first[2]);
    return Array.from({ length: 49 }, (_, index) => {
      const angle = index * Math.PI / 24;
      return [first[0] + Math.cos(angle) * radius, first[1], first[2] + Math.sin(angle) * radius];
    });
  }
  return points;
};

const AnnotationShape = ({ item, selected }: { item: Annotation; selected: boolean }) => {
  const positions = useMemo(() => {
    const vertices = outline(item);
    return new Float32Array(vertices.slice(1).flatMap((end, index) => {
      const start = vertices[index]!;
      return [start[0], start[1] + lift, start[2], end[0], end[1] + lift, end[2]];
    }));
  }, [item]);
  const color = selected ? tokens.color.accent : tokens.color.annotation;

  return (
    <group>
      {positions.length > 0 && <lineSegments raycast={skipRaycast} renderOrder={2}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} depthTest={false} depthWrite={false} />
      </lineSegments>}
      {item.kind !== 'pen' && item.points.map(([x, y, z], index) => (
        <mesh key={index} position={[x, y + lift, z]} raycast={skipRaycast} renderOrder={3}>
          <sphereGeometry args={[item.kind === 'note' ? 0.36 : 0.22, 12, 8]} />
          <meshBasicMaterial color={color} depthTest={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

const MapAnnotations = ({ items, selectedId }: { items: Annotation[]; selectedId: string | null }) =>
  items.map((item) => <AnnotationShape key={item.id} item={item} selected={selectedId === item.id} />);

export default MapAnnotations;
