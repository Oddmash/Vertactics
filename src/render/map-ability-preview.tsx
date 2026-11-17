import { useMemo } from 'react';
import { abilityPolylines } from '../domain/ability-preview';
import type { AbilityPreviewSettings } from '../domain/ability-preview';
import type { HeroPlacement } from '../domain/strategy';
import tokens from '../theme/tokens.json';

const skipRaycast = () => undefined;

const MapAbilityPreview = ({ settings, hero }: { settings: AbilityPreviewSettings; hero: HeroPlacement }) => {
  const positions = useMemo(() => new Float32Array(
    abilityPolylines(settings, hero.position, hero.yaw).flatMap((points) =>
      points.slice(1).flatMap((end, index) => {
        const start = points[index]!;
        return [start[0], start[1] + 0.18, start[2], end[0], end[1] + 0.18, end[2]];
      }),
    ),
  ), [hero, settings]);

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
