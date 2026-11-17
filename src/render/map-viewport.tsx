import { snapSurfacePoint } from '../domain/surface-snap';
import type { Annotation } from '../domain/annotation';
import MapAnnotations from './map-annotations';
import SurfaceDrag from './surface-drag';
import { Canvas, useThree } from '@react-three/fiber';
import { Component, useLayoutEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { BoxGeometry } from 'three';
import { isWalkableTerrain, mapBounds, terrainBlocks, visibleTerrainForLayer } from '../domain/map';
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

const SurfaceCursor = ({ editing }: { editing: boolean }) => {
  const canvas = useThree((state) => state.gl.domElement);
  useLayoutEffect(() => {
    canvas.classList.toggle('surface-editing', editing);
    return () => canvas.classList.remove('surface-editing');
  }, [canvas, editing]);
  return null;
};

type Props = {
  map: MapDefinition;
  mode: ViewMode;
  reset: number;
  selectedTerrainIds: ReadonlySet<string>;
  onSelect: (id: string | null, extend?: boolean) => void;
  heroes: HeroPlacement[];
  selectedHeroId: string | null;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  snap: boolean;
  layerId: string;
  onSelectHero: (id: string) => void;
  onEditSurface?: (position: WorldPoint) => void;
  onDragSurface?: (position: WorldPoint | null) => void;
  onDropSurface?: (position: WorldPoint | null) => void;
};

const MapViewport = ({
  map, mode, reset, selectedTerrainIds, onSelect, heroes, selectedHeroId, onSelectHero, onEditSurface,
  annotations, selectedAnnotationId, snap, layerId, onDragSurface, onDropSurface,
}: Props) => {
  const bounds = useMemo(() => mapBounds(map.terrain), [map]);
  const blocks = useMemo(() => visibleTerrainForLayer(map.terrain, layerId).map((terrain) => ({
    terrain,
    blocks: terrainBlocks(terrain),
  })), [map, layerId]);
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
        onPointerMissed={() => { if (!onEditSurface && !onDragSurface) onSelect(null); }}
      >
        <color attach="background" args={[tokens.color.viewport]} />
        <ambientLight intensity={1.15} />
        <directionalLight position={[-15, 24, 10]} intensity={1.5} />
        <directionalLight position={[18, 8, -15]} intensity={0.35} />
        <MapCamera mode={mode} bounds={bounds} reset={reset} pointerEditing={Boolean(onDragSurface)} />
        <SurfaceCursor editing={Boolean(onEditSurface || onDragSurface)} />
        {onDragSurface && onDropSurface && <SurfaceDrag groups={blocks} snap={snap} onPreview={onDragSurface} onFinish={onDropSurface} />}
        <gridHelper
          position={[bounds.center[0], bounds.min[1] - 0.02, bounds.center[2]]}
          args={[gridSize, gridSize, tokens.color.axis, tokens.color.grid]}
        />
        {blocks.map(({ terrain, blocks }) => (
          <group key={terrain.id}>
            {blocks.map(({ center, size }, index) => {
              const readSurface = ({ point: hit }: Pick<ThreeEvent<MouseEvent>, 'point'>): WorldPoint | null => {
                const top = center[1] + size[1] / 2;
                if (!isWalkableTerrain(terrain) || Math.abs(hit.y - top) >= 0.0001) return null;
                const point: WorldPoint = [hit.x, top, hit.z];
                return snap ? snapSurfacePoint(point, center, size) : point;
              };
              return (
                <mesh
                  key={index}
                  position={center}
                  scale={size}
                  onClick={(event) => {
                    if (event.delta > 4 || onDragSurface) return;
                    event.stopPropagation();
                    if (onEditSurface) {
                      const point = readSurface(event);
                      if (point) onEditSurface(point);
                      return;
                    }
                    onSelect(terrain.id, event.shiftKey || event.metaKey || event.ctrlKey);
                  }}
                >
                  <boxGeometry />
                  <meshStandardMaterial
                    color={terrain.material ?? tokens.color[terrain.kind]}
                    roughness={0.92}
                    emissive={tokens.color.accent}
                    emissiveIntensity={selectedTerrainIds.has(terrain.id) ? 0.26 : 0}
                  />
                  <lineSegments raycast={skipRaycast}>
                    <edgesGeometry args={[unitBox]} />
                    <lineBasicMaterial color={tokens.color.app} transparent opacity={0.48} />
                  </lineSegments>
                </mesh>
              );
            })}
          </group>
        ))}
        <MapAnnotations items={annotations} selectedId={selectedAnnotationId} />
        {heroes.map(({ id, position, yaw, team }) => (
          <group
            key={id}
            position={position}
            rotation={[0, -yaw * Math.PI / 180, 0]}
            onClick={(event) => {
              if (event.delta > 4 || onEditSurface || onDragSurface) return;
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
