import { useMemo } from 'react';
import type { WorldPoint } from '../domain/map';
import tokens from '../theme/tokens.json';

export type Sightline = {
  start: WorldPoint;
  end: WorldPoint;
  blocked: boolean;
};

const skipRaycast = () => undefined;

const MapSightline = ({ start, end, blocked }: Sightline) => {
  const [x1, y1, z1] = start;
  const [x2, y2, z2] = end;
  const positions = useMemo(() => new Float32Array([x1, y1, z1, x2, y2, z2]), [x1, y1, z1, x2, y2, z2]);
  const color = blocked ? tokens.color.sightBlocked : tokens.color.sightClear;

  return (
    <group>
      <lineSegments raycast={skipRaycast} renderOrder={5}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} depthTest={false} depthWrite={false} />
      </lineSegments>
      {blocked && <mesh position={end} raycast={skipRaycast} renderOrder={6}>
        <octahedronGeometry args={[0.32]} />
        <meshBasicMaterial color={color} depthTest={false} depthWrite={false} />
      </mesh>}
    </group>
  );
};

export default MapSightline;
