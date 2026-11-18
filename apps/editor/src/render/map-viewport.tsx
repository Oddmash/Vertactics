import { useLocale } from '../ui/locale';
import ViewportCapture from './viewport-capture';
import type { ViewportCaptureRef } from './viewport-capture';
import MapSightline from './map-sightline';
import type { Sightline } from './map-sightline';
import MapAbilityPreview from './map-ability-preview';
import type { AbilityPlacement, AbilityPreviewSettings } from '../domain/ability-preview';
import { pickTerrainSurface } from '../domain/surface-height';
import rampGeometry from './ramp-geometry';
import type { Annotation } from '../domain/annotation';
import MapAnnotations from './map-annotations';
import SurfaceDrag from './surface-drag';
import HeroDrag from './hero-drag';
import type { HeroDragPreview, HeroDrop } from './hero-drag';
import { Canvas, useThree } from '@react-three/fiber';
import { Component, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { BoxGeometry, BufferAttribute, BufferGeometry, EdgesGeometry } from 'three';
import { mapBounds, terrainBlocks, visibleTerrainForLayer } from '../domain/map';
import type { MapDefinition, WorldPoint } from '../domain/map';
import type { HeroPlacement } from '../domain/strategy';
import tokens from '../theme/tokens.json';
import MapCamera from './map-camera';
import HeroPortraitMarker from './hero-portrait-marker';
import { getHero } from '../domain/hero-catalogue';
import type { ViewMode } from './map-camera';
import type { MapLocation } from '../map/competitive-overviews';

const unitBox = new BoxGeometry();
const ramps = { '+x': rampGeometry('+x'), '-x': rampGeometry('-x'), '+z': rampGeometry('+z'), '-z': rampGeometry('-z') };
const outlineVertices = (geometry: BufferGeometry) => {
  const edges = new EdgesGeometry(geometry);
  const positions = edges.getAttribute('position').array.slice();
  edges.dispose();
  return positions;
};
const boxOutline = outlineVertices(unitBox);
const rampOutlines = {
  '+x': outlineVertices(ramps['+x']), '-x': outlineVertices(ramps['-x']),
  '+z': outlineVertices(ramps['+z']), '-z': outlineVertices(ramps['-z']),
};

const terrainOutlines = (terrain: ReturnType<typeof terrainBlocks>[]) => {
  const blocks = terrain.flat();
  const vertices = blocks.map((block) => block.slope ? rampOutlines[block.slope] : boxOutline);
  const positions = new Float32Array(vertices.reduce((length, outline) => length + outline.length, 0));
  let offset = 0;
  blocks.forEach(({ center, size }, index) => {
    const outline = vertices[index]!;
    for (let vertex = 0; vertex < outline.length; vertex += 3) {
      positions[offset++] = center[0] + outline[vertex]! * size[0];
      positions[offset++] = center[1] + outline[vertex + 1]! * size[1];
      positions[offset++] = center[2] + outline[vertex + 2]! * size[2];
    }
  });
  return positions;
};

const skipRaycast = () => undefined;

const Fallback = () => {
  const { t } = useLocale();
  return (
    <p className="viewport-fallback" role="status">{t('WebGL 2를 사용할 수 없어 지도를 표시할 수 없습니다.')}</p>
  );
};

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
  capture: ViewportCaptureRef;
  mode: ViewMode;
  reset: number;
  selectedTerrainIds: ReadonlySet<string>;
  onSelect: (id: string | null, extend?: boolean) => void;
  heroes: HeroPlacement[];
  heroView?: HeroPlacement;
  sightline: Sightline | null;
  abilities: AbilityPlacement[];
  abilityPreview?: { hero: HeroPlacement; settings: AbilityPreviewSettings };
  selectedHeroId: string | null;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  snap: boolean;
  layerId: string;
  onSelectHero: (id: string) => void;
  onDropHero?: (id: string, drop: HeroDrop) => void;
  onEditSurface?: (position: WorldPoint) => void;
  onDragSurface?: (position: WorldPoint | null) => void;
  sampleDragStart?: boolean;
  onDropSurface?: (position: WorldPoint | null) => void;
  externalDrop?: { type: string; finish: (data: string, position: WorldPoint) => void };
  locations?: MapLocation[];
  focusedLocation?: MapLocation;
};

const MapViewport = ({
  map, capture, mode, reset, selectedTerrainIds, onSelect, heroes, selectedHeroId, onSelectHero, onEditSurface,
  annotations, selectedAnnotationId, snap, layerId, onDragSurface, onDropSurface, sampleDragStart, externalDrop, abilities, abilityPreview, sightline, heroView,
  locations, focusedLocation, onDropHero,
}: Props) => {
  const { locale, t } = useLocale();
  const [heroDrag, setHeroDrag] = useState<HeroDragPreview | null>(null);
  const trash = useRef<HTMLDivElement>(null);
  const canDragHero = Boolean(onDropHero && !onEditSurface && !onDragSurface && !heroView);
  const bounds = useMemo(() => mapBounds(map.terrain), [map]);
  const blocks = useMemo(() => visibleTerrainForLayer(map.terrain, layerId).map((terrain) => ({
    terrain,
    blocks: terrainBlocks(terrain),
  })), [map, layerId]);
  const outlineGeometry = useMemo(() => new BufferGeometry().setAttribute('position',
    new BufferAttribute(terrainOutlines(blocks.map((entry) => entry.blocks)), 3)), [blocks]);
  useEffect(() => () => outlineGeometry.dispose(), [outlineGeometry]);
  const gridSize = Math.ceil(Math.max(
    bounds.max[0] - bounds.min[0],
    bounds.max[2] - bounds.min[2],
  ) + 12);

  return (
    <>
    <ViewportBoundary>
      <Canvas
        className="map-canvas"
        style={{ position: 'absolute', inset: 0 }}
        aria-label={t('지형 지도')}
        dpr={[1, 1.5]}
        frameloop="demand"
        flat
        gl={{ antialias: true }}
        fallback={<Fallback />}
        onPointerMissed={() => { if (!onEditSurface && !onDragSurface) onSelect(null); }}
      >
        <ViewportCapture capture={capture} />
        <color attach="background" args={[tokens.color.viewport]} />
        <ambientLight intensity={1.15} />
        <directionalLight position={[-15, 24, 10]} intensity={1.5} />
        <directionalLight position={[18, 8, -15]} intensity={0.35} />
        <MapCamera mode={mode} bounds={bounds} reset={reset} heroView={heroView} pointerEditing={Boolean(onDragSurface || heroDrag)}
          focusPoint={focusedLocation?.point} />
        <HeroDrag enabled={canDragHero} trash={trash} snap={snap} onPreview={setHeroDrag}
          onSelect={onSelectHero} onDrop={onDropHero} />
        <SurfaceCursor editing={Boolean(onEditSurface || onDragSurface)} />
        {(onDropSurface || externalDrop) && <SurfaceDrag snap={snap} onPreview={onDragSurface} onFinish={onDropSurface} sampleStart={sampleDragStart} externalDrop={externalDrop} />}
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
                  geometry={geometry}
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
                  <meshStandardMaterial
                    color={terrain.material ?? tokens.color[terrain.kind]}
                    roughness={0.92}
                    emissive={tokens.color.accent}
                    emissiveIntensity={selectedTerrainIds.has(terrain.id) ? 0.26 : 0}
                  />
                </mesh>
              );
            })}
          </group>
        ))}
        </group>
        {outlineGeometry.getAttribute('position').count > 0 && <lineSegments geometry={outlineGeometry} raycast={skipRaycast}>
          <lineBasicMaterial color={tokens.color.app} transparent opacity={0.48} />
        </lineSegments>}
        {abilities.map((ability) => ability.visible && <MapAbilityPreview
          key={ability.id} settings={ability} position={ability.position} heading={ability.heading}
        />)}
        {abilityPreview && <MapAbilityPreview settings={abilityPreview.settings}
          position={abilityPreview.hero.position} heading={abilityPreview.hero.yaw}
        />}
        {sightline && <MapSightline {...sightline} />}
        {mode === '2d' && locations?.map(({ id, point: [x, y, z] }) => (
          <mesh key={id} position={[x, y + 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.25, 2.65, 36]} />
            <meshBasicMaterial color={id === focusedLocation?.id ? tokens.color.action : tokens.color.accent} />
          </mesh>
        ))}
        <MapAnnotations items={annotations} selectedId={selectedAnnotationId} />
        {heroes.filter(({ id }) => id !== heroView?.id).map(({ id, heroId, position, yaw, team }) => (
          <group
            key={id}
            position={(heroDrag?.id === id && heroDrag.point) || position}
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
            <HeroPortraitMarker id={id} heroId={heroId} draggable={canDragHero}
              dragging={heroDrag?.id === id} overTrash={heroDrag?.id === id && heroDrag.overTrash}
              label={(locale === 'ko' ? getHero(heroId)?.localizedName : getHero(heroId)?.name) ?? heroId}
              color={tokens.team[team]} selected={id === selectedHeroId} />
            <mesh position={[0, 0.46, -0.75]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.3, 0.7, 3]} />
              <meshBasicMaterial color={tokens.team[team]} />
            </mesh>
          </group>
        ))}
      </Canvas>
    </ViewportBoundary>
    {canDragHero && heroDrag && <div ref={trash} className="map-hero-trash" role="status" data-open={heroDrag.overTrash}>
      <span className="map-hero-trash-icon" aria-hidden="true"><span /><span /></span>
      <span>{t(heroDrag.overTrash ? '놓아서 삭제' : '휴지통')}</span>
    </div>}
    </>
  );
};

export default MapViewport;
