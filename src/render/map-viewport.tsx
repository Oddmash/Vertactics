import { Canvas } from '@react-three/fiber';
import { Component, useMemo } from 'react';
import type { ReactNode } from 'react';
import { BoxGeometry } from 'three';
import { mapBounds, terrainBlocks } from '../domain/map';
import type { MapDefinition, WorldPoint } from '../domain/map';
import type { HeroPlacement } from '../domain/strategy';
import tokens from '../theme/tokens.json';
import MapCamera from './map-camera';
import type { ViewMode } from './map-camera';

const unitBox = new BoxGeometry();
const skipRaycast = () => undefined;

const Fallback = () => (
  <p className="viewport-fallback" role="status">WebGL 2를 사용할 수 없어 지도를 표시할 수 없습니다.</p>
);

class ViewportBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}

type Props = {
  map: MapDefinition;
  mode: ViewMode;
  reset: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  heroes: HeroPlacement[];
  selectedHeroId: string | null;
  onSelectHero: (id: string) => void;
  onEditSurface?: (position: WorldPoint) => void;
};

const MapViewport = ({
  map, mode, reset, selectedId, onSelect, heroes, selectedHeroId, onSelectHero, onEditSurface,
}: Props) => {
  const bounds = useMemo(() => mapBounds(map.terrain), [map]);
  const blocks = useMemo(() => map.terrain.map((terrain) => ({
    terrain,
    blocks: terrainBlocks(terrain),
  })), [map]);
  const gridSize = Math.ceil(Math.max(
    bounds.max[0] - bounds.min[0],
    bounds.max[2] - bounds.min[2],
  ) + 12);

  return (
    <ViewportBoundary>
      <Canvas
        className="map-canvas"
        style={{ position: 'absolute', inset: 0 }}
        aria-label="지형 지도"
        dpr={[1, 1.5]}
        frameloop="demand"
        flat
        gl={{ antialias: true }}
        fallback={<Fallback />}
        onPointerMissed={() => { if (!onEditSurface) onSelect(null); }}
      >
        <color attach="background" args={[tokens.color.viewport]} />
        <ambientLight intensity={1.15} />
        <directionalLight position={[-15, 24, 10]} intensity={1.5} />
        <directionalLight position={[18, 8, -15]} intensity={0.35} />
        <MapCamera mode={mode} bounds={bounds} reset={reset} />
        <gridHelper
          position={[bounds.center[0], bounds.min[1] - 0.02, bounds.center[2]]}
          args={[gridSize, gridSize, tokens.color.axis, tokens.color.grid]}
        />
        {blocks.map(({ terrain, blocks }) => (
          <group key={terrain.id}>
            {blocks.map(({ center, size }, index) => (
              <mesh
                key={index}
                position={center}
                scale={size}
                onClick={(event) => {
                  if (event.delta > 4) return;
                  event.stopPropagation();
                  if (onEditSurface) {
                    const top = center[1] + size[1] / 2;
                    if (terrain.kind !== 'wall' && Math.abs(event.point.y - top) < 0.0001) {
                      onEditSurface([event.point.x, top, event.point.z]);
                    }
                    return;
                  }
                  onSelect(terrain.id);
                }}
              >
                <boxGeometry />
                <meshStandardMaterial
                  color={tokens.color[terrain.kind]}
                  roughness={0.92}
                  emissive={tokens.color.accent}
                  emissiveIntensity={selectedId === terrain.id ? 0.26 : 0}
                />
                <lineSegments raycast={skipRaycast}>
                  <edgesGeometry args={[unitBox]} />
                  <lineBasicMaterial color={tokens.color.app} transparent opacity={0.48} />
                </lineSegments>
              </mesh>
            ))}
          </group>
        ))}
        {heroes.map(({ id, position, yaw, team }) => (
          <group
            key={id}
            position={position}
            rotation={[0, -yaw * Math.PI / 180, 0]}
            onClick={(event) => {
              if (event.delta > 4 || onEditSurface) return;
              event.stopPropagation();
              onSelectHero(id);
            }}
          >
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.65, 0.76, 0.46, team === 'attack' ? 4 : 20]} />
              <meshStandardMaterial
                color={tokens.team[team]}
                emissive={tokens.team[team]}
                emissiveIntensity={id === selectedHeroId ? 0.6 : 0}
              />
            </mesh>
            <mesh position={[0, 0.46, -0.75]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.3, 0.7, 3]} />
              <meshBasicMaterial color={tokens.team[team]} />
            </mesh>
          </group>
        ))}
      </Canvas>
    </ViewportBoundary>
  );
};

export default MapViewport;
