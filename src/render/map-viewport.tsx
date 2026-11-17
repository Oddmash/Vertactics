import MapSightline from './map-sightline';
import type { Sightline } from './map-sightline';
import MapAbilityPreview from './map-ability-preview';
import type { AbilityPlacement, AbilityPreviewSettings } from '../domain/ability-preview';
import { pickTerrainSurface } from '../domain/surface-height';
import rampGeometry from './ramp-geometry';
import type { Annotation } from '../domain/annotation';
import MapAnnotations from './map-annotations';
import SurfaceDrag from './surface-drag';
import { Canvas, useThree } from '@react-three/fiber';
import { Component, useLayoutEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { BoxGeometry } from 'three';
import { mapBounds, terrainBlocks, visibleTerrainForLayer } from '../domain/map';
import type { MapDefinition, WorldPoint } from '../domain/map';
import type { HeroPlacement } from '../domain/strategy';
import tokens from '../theme/tokens.json';
import MapCamera from './map-camera';
import type { ViewMode } from './map-camera';

const unitBox = new BoxGeometry();
const ramps = { '+x': rampGeometry('+x'), '-x': rampGeometry('-x'), '+z': rampGeometry('+z'), '-z': rampGeometry('-z') };
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
  sightline: Sightline | null;
  abilities: AbilityPlacement[];
  abilityPreview?: { hero: HeroPlacement; settings: AbilityPreviewSettings };
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
  annotations, selectedAnnotationId, snap, layerId, onDragSurface, onDropSurface, abilities, abilityPreview, sightline,
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
        {onDragSurface && onDropSurface && <SurfaceDrag snap={snap} onPreview={onDragSurface} onFinish={onDropSurface} />}
        <gridHelper
          position={[bounds.center[0], bounds.min[1] - 0.02, bounds.center[2]]}
          args={[gridSize, gridSize, tokens.color.axis, tokens.color.grid]}
        />
        <group name="walkable-terrain">
        {blocks.map(({ terrain, blocks }) => (
          <group key={terrain.id}>
            {blocks.map((block, index) => {
              const geometry = block.slope ? ramps[block.slope] : unitBox;
              return (
                <mesh
                  key={index}
                  position={block.center}
                  scale={block.size}
                  userData={{ terrain, block }}
                  onClick={(event) => {
                    if (event.delta > 4 || onDragSurface) return;
                    event.stopPropagation();
                    if (onEditSurface) {
                      const { x, y, z } = event.point;
                      const point = pickTerrainSurface(terrain, block, [x, y, z], snap);
                      if (point) onEditSurface(point);
                      return;
                    }
                    onSelect(terrain.id, event.shiftKey || event.metaKey || event.ctrlKey);
                  }}
                >
                  {block.slope ? <primitive object={geometry} attach="geometry" /> : <boxGeometry />}
                  <meshStandardMaterial
                    color={terrain.material ?? tokens.color[terrain.kind]}
                    roughness={0.92}
                    emissive={tokens.color.accent}
                    emissiveIntensity={selectedTerrainIds.has(terrain.id) ? 0.26 : 0}
                  />
                  <lineSegments raycast={skipRaycast}>
                    <edgesGeometry args={[geometry]} />
                    <lineBasicMaterial color={tokens.color.app} transparent opacity={0.48} />
                  </lineSegments>
                </mesh>
              );
            })}
          </group>
        ))}
        </group>
        {abilities.map((ability) => ability.visible && <MapAbilityPreview
          key={ability.id} settings={ability} position={ability.position} heading={ability.heading}
        />)}
        {abilityPreview && <MapAbilityPreview settings={abilityPreview.settings}
          position={abilityPreview.hero.position} heading={abilityPreview.hero.yaw}
        />}
        {sightline && <MapSightline {...sightline} />}
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
