import { useMemo } from 'react';
import { abilityPolylines } from '../domain/ability-preview';
import type { AbilityPreviewSettings } from '../domain/ability-preview';
import type { WorldPoint } from '../domain/map';
import tokens from '../theme/tokens.json';

const skipRaycast = () => undefined;

const MapAbilityPreview = ({ settings, position, heading }: { settings: AbilityPreviewSettings; position: WorldPoint; heading: number }) => {
  const positions = useMemo(() => new Float32Array(
    abilityPolylines(settings, position, heading).flatMap((points) =>
      points.slice(1).flatMap((end, index) => {
        const start = points[index]!;
        return [start[0], start[1] + 0.18, start[2], end[0], end[1] + 0.18, end[2]];
      }),
    ),
  ), [heading, position, settings]);

  return (
    <lineSegments raycast={skipRaycast} renderOrder={4}>
      <bufferGeometry key={positions.length}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={tokens.color.accent} depthTest={false} depthWrite={false} />
    </lineSegments>
  );
};

export default MapAbilityPreview;
