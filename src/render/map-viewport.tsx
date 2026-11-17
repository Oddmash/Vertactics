import { Canvas } from '@react-three/fiber';
import { Component, useMemo } from 'react';
import type { ReactNode } from 'react';
import { BoxGeometry } from 'three';
import { mapBounds, terrainBlocks } from '../domain/map';
import type { MapDefinition } from '../domain/map';
import tokens from '../theme/tokens.json';
import MapCamera from './map-camera';
import type { ViewMode } from './map-camera';

const unitBox = new BoxGeometry();

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
};

const MapViewport = ({ map, mode, reset, selectedId, onSelect }: Props) => {
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
        onPointerMissed={() => onSelect(null)}
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
                <lineSegments>
                  <edgesGeometry args={[unitBox]} />
                  <lineBasicMaterial color={tokens.color.app} transparent opacity={0.48} />
                </lineSegments>
              </mesh>
            ))}
          </group>
        ))}
      </Canvas>
    </ViewportBoundary>
  );
};

export default MapViewport;
