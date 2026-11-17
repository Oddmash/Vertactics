import { downloadFile, fileStem } from './download-file';
import StrategyFileTools from './strategy-file-tools';
import useWorkspaceRecovery from './use-workspace-recovery';
import TimelinePlaybackControls from './timeline-playback-controls';
import useTimelinePlayback from './use-timeline-playback';
import { sampleTimeline, timelineDuration } from '../domain/timeline-playback';
import StrategyTimelineTools from './strategy-timeline-tools';
import StrategyDraftTools from './strategy-draft-tools';
import type { StrategyDraft } from '../storage/strategy-draft';
import AbilityPlacementTools from './ability-placement-tools';
import AbilityPreviewTools from './ability-preview-tools';
import type { AbilityPlacement, AbilityPreviewSettings } from '../domain/ability-preview';
import { measureSegment } from '../domain/measurement';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { Annotation } from '../domain/annotation';
import { rotateTerrain, snapTerrain } from '../domain/terrain-edit';
import { traceHeroSightline, traceTerrainSightline } from '../domain/spatial-analysis';
import TerrainTools from './terrain-tools';
import AnnotationTools from './annotation-tools';
import type { SurfacePick } from './annotation-tools';
import { mapBounds, mapSchemaVersion, terrainKinds, parseMap, topElevation, visibleTerrainForLayer } from '../domain/map';
import type { MapDefinition, MapLayer, Terrain, TerrainKind, WorldPoint } from '../domain/map';
import { createStrategy, heroEyeHeight } from '../domain/strategy';
import type { Team } from '../domain/strategy';
import { createStrategyHistory, reduceStrategyHistory } from '../domain/strategy-history';
import type { StrategyAction, StrategyHistory } from '../domain/strategy-history';
import { maps } from '../map';
import type { ViewMode } from '../render/map-camera';
import MapViewport from '../render/map-viewport';
import HeroTools, { roleNames, teamNames } from './hero-tools';
import { getHero, heroName } from '../domain/hero-catalogue';
import type { CatalogueHero } from '../domain/hero-catalogue';

type SurfaceTool =
  | { kind: 'place'; heroId: CatalogueHero; team: Team }
  | { kind: 'move' | 'drag'; id: string }
  | { kind: 'distance' | 'sight' }
  | { kind: 'ability' | 'annotation'; pick: SurfacePick };

const kindNames: Record<TerrainKind, string> = {
  floor: '바닥',
  wall: '벽',
  platform: '고지대',
  stairs: '계단',
  ramp: '경사로',
  building: '건물',
  column: '기둥',
  railing: '난간',
  doorway: '출입구',
  'drop-zone': '낙하 구역',
};
const viewNames: Record<ViewMode, string> = { '2d': '2D 탑다운', '3d': '3D 원근' };
const viewportModes = ['2d', '3d'] as const;

const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 2,
}).format(value);
const formatElevation = (value: number) => `${value > 0 ? '+' : ''}${formatNumber(value)} u`;

const exposureLabels = { blocked: '완전 차단', partial: '부분 노출', clear: '개방' };
const sampleLabels = { lower: '하단', middle: '중단', upper: '상단' };

const Editor = ({ initialDraft }: { initialDraft?: StrategyDraft }) => {
  const [catalogue, setCatalogue] = useState(() => {
    if (!initialDraft) return maps;
    return [...maps.filter((item) => item.id !== initialDraft.map.id), initialDraft.map];
  });
  const [mapId, setMapId] = useState(initialDraft?.map.id ?? maps[0]!.id);
  const map = catalogue.find((item) => item.id === mapId)!;
  const { min, max } = useMemo(() => mapBounds(map.terrain), [map]);
  const [importMessage, setImportMessage] = useState('');
  const captureViewport = useRef<(() => Promise<Blob>) | null>(null);
  const [imageMessage, setImageMessage] = useState('');
  const saveViewport = async () => {
    setImageMessage('');
    try {
      const capture = captureViewport.current;
      if (!capture) throw new Error('Map canvas not ready');
      downloadFile(await capture(), `${fileStem(map.id)}-${heroView ? 'hero' : mode}.png`);
    } catch {
      setImageMessage('지도 화면을 PNG로 저장할 수 없습니다.');
    }
  };
  const [mapEditing, setMapEditing] = useState(false);
  const [tool, setSurfaceTool] = useState<SurfaceTool | null>(null);
  const measuring = tool?.kind === 'distance';
  const sightPicking = tool?.kind === 'sight';
  const abilityPick = tool?.kind === 'ability' ? tool.pick : null;
  const annotationPick = tool?.kind === 'annotation' ? tool.pick : null;
  const [sightPoints, setSightPoints] = useState<WorldPoint[]>([]);
  const [sightFirst, sightSecond] = sightPoints;
  const [measurement, setMeasurement] = useState<WorldPoint[]>([]);
  const first = measurement[0];
  const second = measurement[1];
  const distance = first && second ? measureSegment(first, second) : null;
  const measurementOverlay: Annotation[] = first ? [{
    id: 'measurement-preview', kind: second ? 'line' : 'note', label: '측정', points: measurement,
  }] : [];
  const [mapMessage, setMapMessage] = useState('');
  const [mapHistory, setMapHistory] = useState<Record<string, { past: MapDefinition[]; future: MapDefinition[] }>>({});
  const timeline = Object.hasOwn(mapHistory, mapId) ? mapHistory[mapId]! : { past: [], future: [] };
  const importRequest = useRef(0);
  const [heroViewId, setHeroViewId] = useState<string>();
  const [mode, setMode] = useState<ViewMode>('3d');
  const [reset, setReset] = useState(0);
  const [layerId, setLayerId] = useState('');
  const visibleTerrain = visibleTerrainForLayer(map.terrain, layerId);
  const [snap, setSnap] = useState(false);
  const [locked, setLocked] = useState(false);
  const [abilityPreviews, setAbilityPreviews] = useState<Record<string, AbilityPreviewSettings>>({});
  const [sightTargetId, setSightTargetId] = useState('');
  const [showHeroes, setShowHeroes] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedId, setPrimaryId] = useState<string | null>(null);
  const [additionalTerrain, setAdditionalTerrain] = useState<string[]>([]);
  const setSelectedId = (id: string | null) => {
    setPrimaryId(id);
    setAdditionalTerrain([]);
  };
  const selectedTerrainIds = new Set(selectedId ? [selectedId, ...additionalTerrain] : additionalTerrain);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<WorldPoint | null>(null);
  const [selectedAbilityId, setSelectedAbilityId] = useState<string | null>(null);
  const [annotationId, setAnnotationId] = useState<string | null>(null);
  const initialHistory = useMemo(() => createStrategyHistory(createStrategy('local-draft', mapId, '새 전략')), [mapId]);
  const [histories, setHistories] = useState<Record<string, StrategyHistory>>(() =>
    initialDraft ? { [initialDraft.map.id]: createStrategyHistory(initialDraft.strategy) } : {});
  const history = Object.hasOwn(histories, mapId) ? histories[mapId]! : initialHistory;
  const [workspaceRevision, setWorkspaceRevision] = useState(0);
  const markWorkspaceChanged = useCallback(() => setWorkspaceRevision((value) => value + 1), []);
  const draft: StrategyDraft = { version: 1, map, strategy: history.present };
  const recovery = useWorkspaceRecovery(draft, workspaceRevision);
  const durationMs = timelineDuration(history.present.timeline);
  const { state: playback, start, stop, toggle, seek, changeSpeed } = useTimelinePlayback(durationMs);
  const frame = playback ? sampleTimeline(history.present, playback.timeMs) : null;
  const changeSurfaceTool = useCallback((next: SurfaceTool | null) => {
    setSurfaceTool(next);
    setDragPreview(null);
    setSightPoints((points) => points.length === 2 ? points : []);
  }, []);
  const leavePresentation = useCallback(() => {
    stop();
    setHeroViewId(undefined);
  }, [stop]);
  const activateTool = useCallback((next: SurfaceTool | null) => {
    changeSurfaceTool(next);
    leavePresentation();
  }, [changeSurfaceTool, leavePresentation]);
  const dispatch = useCallback((action: StrategyAction) => {
    stop();
    markWorkspaceChanged();
    setHistories((current) => ({
      ...current,
      [mapId]: reduceStrategyHistory(Object.hasOwn(current, mapId) ? current[mapId]! : initialHistory, action),
    }));
  }, [initialHistory, mapId, markWorkspaceChanged, stop]);
  const switchMap = (id: string) => {
    activateTool(null);
    setMapMessage('');
    setMeasurement([]);
    setSightPoints([]);
    setLayerId('');
    setSelectedId(null);
    setSelectedHeroId(null);
    setSightTargetId('');
    setAnnotationId(null);
    setSelectedAbilityId(null);
    setMapId(id);
  };
  const restoreDraft = ({ map: savedMap, strategy }: StrategyDraft) => {
    ++importRequest.current;
    setImportMessage('');
    setCatalogue((current) => current.some(({ id }) => id === savedMap.id)
      ? current.map((item) => item.id === savedMap.id ? savedMap : item)
      : [...current, savedMap]);
    setHistories((current) => ({ ...current, [savedMap.id]: createStrategyHistory(strategy) }));
    setMapHistory((current) => ({ ...current, [savedMap.id]: { past: [], future: [] } }));
    setAbilityPreviews((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => JSON.parse(key)[0] !== savedMap.id),
    ));
    switchMap(savedMap.id);
    setMapEditing(false);
    setReset((value) => value + 1);
  };
  const importMap = async (file: File) => {
    const request = ++importRequest.current;
    let imported: MapDefinition;
    try {
      if (file.size > 1_000_000) throw new Error();
      imported = parseMap(JSON.parse(await file.text()));
    } catch {
      if (request === importRequest.current) setImportMessage('지도 JSON을 읽을 수 없습니다.');
      return;
    }
    if (request !== importRequest.current) return;
    if (catalogue.some((item) => item.id === imported.id)) {
      setImportMessage('같은 ID의 지도가 이미 있습니다.');
      return;
    }
    setCatalogue((current) => current.some((item) => item.id === imported.id) ? current : [...current, imported]);
    switchMap(imported.id);
    markWorkspaceChanged();
    setImportMessage('');
  };
  const replaceMap = (next: MapDefinition) => {
    markWorkspaceChanged();
    setCatalogue((current) => current.map((item) => item.id === next.id ? next : item));
  };
  const updateTerrain = (terrain: unknown[], nextId: string | null, layers = map.layers) => {
    try {
      const metadata = map.metadata?.verification === 'verified' ? { ...map.metadata, verification: 'unverified' } : map.metadata;
      const next = parseMap({ ...map, terrain, metadata, layers });
      setMapHistory((current) => ({ ...current, [mapId]: { past: [...timeline.past, map], future: [] } }));
      replaceMap(next);
      setSelectedId(nextId);
      if (layerId && !next.layers?.some((layer) => layer.id === layerId)) setLayerId('');
      setMapMessage('');
    } catch {
      setMapMessage('지형 값을 확인하세요. 지도에는 블록이 한 개 이상 필요합니다.');
    }
  };
  const moveMapHistory = (direction: 'undo' | 'redo') => {
    const stack = direction === 'undo' ? timeline.past : timeline.future;
    const next = stack.at(-1);
    if (!next) return;
    setMapHistory((current) => ({
      ...current,
      [mapId]: direction === 'undo'
        ? { past: stack.slice(0, -1), future: [...timeline.future, map] }
        : { past: [...timeline.past, map], future: stack.slice(0, -1) },
    }));
    replaceMap(next);
    if (layerId && !next.layers?.some((layer) => layer.id === layerId)) setLayerId('');
    setSelectedId(null);
    setMapMessage('');
  };
  const saveLayer = (layer: MapLayer) => {
    const layers = map.layers ?? [];
    updateTerrain(map.terrain, selectedId, layers.some((item) => item.id === layer.id)
      ? layers.map((item) => item.id === layer.id ? layer : item)
      : [...layers, layer]);
  };
  const deleteLayer = (id: string) => {
    updateTerrain(
      map.terrain.map((item) => item.layerId === id ? { ...item, layerId: undefined } : item),
      selectedId,
      map.layers?.filter((layer) => layer.id !== id),
    );
  };
  const createMap = () => {
    const id = crypto.randomUUID();
    const created = parseMap({
      schemaVersion: mapSchemaVersion, id, name: '새 지도', metadata: { verification: 'synthetic' },
      terrain: [{ id: 'base', name: '기본 바닥', kind: 'floor', origin: [-8, -1, -8], size: [16, 1, 16] }],
    });
    setCatalogue((current) => [...current, created]);
    switchMap(id);
    markWorkspaceChanged();
    setMapEditing(true);
  };
  const copyTerrain = (terrain?: Terrain) => {
    const id = crypto.randomUUID();
    const item = terrain
      ? { ...terrain, id, name: `${terrain.name} 복제`, origin: [terrain.origin[0] + 1, terrain.origin[1], terrain.origin[2] + 1] }
      : { id, name: '새 블록', kind: 'platform', origin: [-1, 0, -1], size: [2, 1, 2], layerId: layerId || undefined };
    updateTerrain([...map.terrain, item], id);
  };
  const { heroes, annotations, abilities } = history.present;
  const selected = visibleTerrain.find(({ id }) => id === selectedId);
  const selectedHero = heroes.find(({ id }) => id === selectedHeroId);

  const heroView = !mapEditing && showHeroes && selectedHero?.id === heroViewId ? selectedHero : undefined;
  const selectedHeroProfile = selectedHero && getHero(selectedHero.heroId);
  const previewKey = selectedHero ? JSON.stringify([mapId, selectedHero.id]) : '';
  const activeAbility = abilityPreviews[previewKey];
  const sightTarget = heroes.find((hero) => hero.id === sightTargetId && hero.id !== selectedHeroId);
  const spatialProbe = !mapEditing && showHeroes && selectedHero && sightTarget
    ? traceHeroSightline(map.terrain, selectedHero, sightTarget) : null;
  const terrainSight = sightFirst && sightSecond ? traceTerrainSightline(map.terrain, sightFirst, sightSecond) : null;
  const activeSight = sightPicking || sightFirst ? terrainSight : spatialProbe;
  const sightOverlay: Annotation[] = sightFirst && !sightSecond ? [{
    id: 'sight-start', kind: 'note', label: '시야 시작점', points: [sightFirst],
  }] : [];
  const selectTerrain = (id: string | null, extend = false) => {
    if (mapEditing && extend && id && selectedId) {
      if (id === selectedId) {
        setPrimaryId(additionalTerrain[0] ?? null);
        setAdditionalTerrain(additionalTerrain.slice(1));
      } else {
        setAdditionalTerrain((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
      }
    } else setSelectedId(id);
    setSelectedHeroId(null);
    setHeroViewId(undefined);
  };

  const selectHero = (id: string) => {
    setSelectedId(null);
    setSelectedHeroId(id);
    setHeroViewId((current) => current === id ? current : undefined);
  };

  const selectAnnotation = (id: string) => {
    activateTool(null);
    setAnnotationId(id);
  };

  const saveAnnotation = (annotation: Annotation) => {
    dispatch({ type: 'set-annotation', annotation });
    selectAnnotation(annotation.id);
  };

  const saveAbility = (ability: AbilityPlacement) => {
    activateTool(null);
    dispatch({ type: 'set-ability', ability });
    setSelectedAbilityId(ability.id);
  };

  const pickAbilitySurface = (hint: string, apply: SurfacePick['apply']) => {
    activateTool({ kind: 'ability', pick: { hint, apply } });
  };

  const finishDrag = useCallback((position: WorldPoint | null) => {
    if (tool?.kind !== 'drag') return;
    if (position && !locked) dispatch({ type: 'update', id: tool.id, patch: { position } });
    changeSurfaceTool(null);
  }, [changeSurfaceTool, dispatch, locked, tool]);

  const editSurface = (position: WorldPoint) => {
    if (measuring) {
      setMeasurement((points) => points.length === 1 ? [...points, position] : [position]);
      return;
    }
    if (sightPicking) {
      setSightPoints((points) => points.length === 1 ? [...points, position] : [position]);
      return;
    }
    if (locked) return;
    if (abilityPick) { abilityPick.apply(position); return; }
    if (annotationPick) { annotationPick.apply(position); return; }
    if (!tool) return;
    if (tool.kind === 'place') {
      const id = crypto.randomUUID();
      dispatch({ type: 'place', hero: { id, heroId: tool.heroId, team: tool.team, position, yaw: 0 } });
      selectHero(id);
    } else if (tool.kind === 'move') {
      dispatch({ type: 'update', id: tool.id, patch: { position } });
      selectHero(tool.id);
    }
    changeSurfaceTool(null);
  };

  return (
    <div className="editor" onKeyDown={(event) => {
      if (event.key === 'Escape' && (frame || heroView || tool)) {
        event.preventDefault();
        activateTool(null);
        return;
      }
      if (mapEditing || locked || event.defaultPrevented || event.altKey ||
        !(event.ctrlKey || event.metaKey) ||
        (event.target instanceof Element && event.target.closest('input:not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable]'))) return;
      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;
      event.preventDefault();
      activateTool(null);
      dispatch({ type: key === 'y' || event.shiftKey ? 'redo' : 'undo' });
    }}>
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">V</span>
          Vertactics
        </div>
        <div className="map-catalogue">
          <label>지도 <select aria-label="지도" value={mapId} onChange={(event) => switchMap(event.target.value)}>
            {catalogue.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></label>
          <button type="button" className="reset-button" onClick={createMap}>새 지도</button>
          <button type="button" className="reset-button" aria-pressed={mapEditing} onClick={() => {
            activateTool(null);
            selectTerrain(null);
            setMapEditing((current) => !current);
          }}>지도 편집 모드</button>
          <label>지도 JSON 가져오기 <input type="file" accept=".json,application/json" onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void importMap(file);
          }} /></label>
          <a className="reset-button" download={`${map.id}.json`}
            href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(map, null, 2))}`}>지도 JSON 저장</a>
          {importMessage && <span role="status">{importMessage}</span>}
        </div>
      </header>
      <main className="workspace">
        <aside className="terrain-panel panel" aria-labelledby="terrain-title">
          <div className="panel-heading">
            <h2 id="terrain-title">지형 목록</h2>
            <span className="count">{visibleTerrain.length}</span>
          </div>
          <ul className="terrain-list">
            {visibleTerrain.map((terrain) => (
              <li key={terrain.id}>
                <button
                  type="button"
                  className="terrain-button"
                  aria-pressed={selectedTerrainIds.has(terrain.id)}
                  onClick={(event) => { activateTool(null); selectTerrain(terrain.id, event.shiftKey || event.metaKey || event.ctrlKey); }}
                >
                  <span className={`terrain-swatch ${terrain.kind}`} aria-hidden="true" />
                  <span>{terrain.name}</span>
                  <small>{formatElevation(topElevation(terrain))}</small>
                </button>
              </li>
            ))}
          </ul>
          {!mapEditing && <HeroTools
            heroes={heroes}
            locked={locked || !showHeroes}
            selectedId={selectedHeroId}
            pendingMessage={tool?.kind === 'place' ? '배치할 지면을 클릭하세요.' : tool?.kind === 'drag' ? '지도에서 누른 채 끌어 이동하세요.' : tool?.kind === 'move' ? '이동할 지면을 클릭하세요.' : ''}
            canUndo={!locked && history.past.length > 0}
            canRedo={!locked && history.future.length > 0}
            onPlace={(heroId, team) => activateTool({ kind: 'place', heroId, team })}
            onSelect={(id) => { activateTool(null); selectHero(id); }}
            onUndo={() => { activateTool(null); dispatch({ type: 'undo' }); }}
            onRedo={() => { activateTool(null); dispatch({ type: 'redo' }); }}
            onCancel={() => activateTool(null)}
          />}
          <StrategyDraftTools draft={draft} onRestore={restoreDraft} />
          <StrategyFileTools draft={draft} onImport={(imported) => {
            restoreDraft(imported);
            markWorkspaceChanged();
          }} />
          <section className="hero-tools" aria-label="작업 복구">
            {recovery.saved ? <>
              <p>이전 작업 · {recovery.saved.map.name}</p>
              <p>복구하면 해당 지도의 편집 내용이 복구본으로 바뀝니다.</p>
              <div className="hero-actions">
                <button type="button" className="reset-button" onClick={() => {
                  const saved = recovery.restore();
                  if (saved) restoreDraft(saved);
                }}>이전 작업 복구</button>
                <button type="button" className="reset-button" onClick={recovery.discard}>복구본 지우기</button>
              </div>
            </> : <p role="status">{{
              idle: recovery.unreadable ? '이전 작업 데이터를 읽을 수 없습니다.' : '편집 내용은 이 브라우저에 자동 저장됩니다.',
              pending: '작업 자동 저장 중',
              saved: '작업을 자동 저장했습니다.',
              error: '작업을 자동 저장할 수 없습니다. 전략 저장을 사용할 수 있습니다.',
            }[recovery.status]}</p>}
            {recovery.saved && recovery.status === 'error' && <p role="status">복구본을 지울 수 없습니다.</p>}
          </section>
          {!mapEditing && <StrategyTimelineTools key={mapId} strategy={history.present} locked={locked}
            onChange={(timeline) => { activateTool(null); dispatch({ type: 'set-timeline', timeline }); }}
          />}
        </aside>
        <section className="view-panel panel" aria-labelledby="view-title">
          <div className="viewport-toolbar">
            <div>
              <h1 id="view-title">{map.name}</h1>
              <p className="world-size">
                {map.metadata?.verification === 'verified' ? '검증됨' : map.metadata?.verification === 'synthetic' ? '가상 지도' : '미검증'} · {max[0] - min[0]} × {max[2] - min[2]} u</p>
            </div>
            <div className="viewport-actions">
              <div className="mode-switch" role="group" aria-label="지도 보기">
                {viewportModes.map((view) => (
                  <button
                    key={view}
                    type="button"
                    aria-label={viewNames[view]}
                    aria-pressed={!heroView && mode === view}
                    onClick={() => { setHeroViewId(undefined); setMode(view); }}
                  >
                    {view.toUpperCase()}
                  </button>
                ))}
              </div>
              {heroView
                ? <button className="reset-button" type="button" onClick={() => setHeroViewId(undefined)}>이전 시점으로</button>
                : <button className="reset-button" type="button" onClick={() => setReset((value) => value + 1)}>
                  시점 초기화
                </button>}
              <button className="reset-button" type="button" onClick={() => void saveViewport()}>지도 PNG 저장</button>
            </div>
          </div>
          {imageMessage && <p role="status">{imageMessage}</p>}
          <div className="view-options" role="group" aria-label="편집 및 표시 설정">
            {map.layers && <label>표시 층 <select value={layerId} onChange={(event) => {
              setLayerId(event.target.value);
              setSelectedId(null);
            }}>
              <option value="">모든 층</option>
              {map.layers.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
            </select></label>}
            <button type="button" className="reset-button" aria-pressed={measuring} onClick={() => {
              activateTool(measuring ? null : { kind: 'distance' });
              if (!measuring) setMeasurement([]);
            }}>거리 측정</button>
            <button type="button" className="reset-button" aria-pressed={sightPicking} onClick={() => {
              activateTool(sightPicking ? null : { kind: 'sight' });
              if (!sightPicking || !sightSecond) setSightPoints([]);
            }}>지점 간 시야</button>
            <label><input type="checkbox" checked={snap} onChange={(event) => setSnap(event.target.checked)} /> 격자 스냅</label>
            <label><input type="checkbox" checked={locked} onChange={(event) => {
              activateTool(null);
              setLocked(event.target.checked);
            }} /> 편집 잠금</label>
            <label><input type="checkbox" checked={showHeroes} onChange={(event) => {
              activateTool(null);
              setShowHeroes(event.target.checked);
            }} /> 영웅 표시</label>
            <label><input type="checkbox" checked={showAnnotations} onChange={(event) => {
              activateTool(null);
              setShowAnnotations(event.target.checked);
            }} /> 마커 표시</label>
          </div>
          {!mapEditing && durationMs > 0 && (!playback
            ? <div className="view-options"><button type="button" className="reset-button" onClick={() => {
              activateTool(null);
              start();
            }}>전략 재생</button></div>
            : <TimelinePlaybackControls durationMs={durationMs} phaseLabel={frame?.phaseLabel ?? ''}
              timeMs={playback.timeMs} playing={playback.playing} speed={playback.speed}
              onToggle={toggle} onSeek={seek} onSpeed={changeSpeed} onExit={stop}
            />)}
          <div className="viewport" data-testid="viewport"
            onPointerCancel={() => { if (tool?.kind === 'drag') changeSurfaceTool(null); }}
            onPointerLeave={(event) => { if (tool?.kind === 'drag' && event.buttons === 1) changeSurfaceTool(null); }}
          >
            <MapViewport
              key={mapId}
              map={map}
              capture={captureViewport}
              layerId={layerId}
              mode={mode}
              heroView={heroView}
              reset={reset}
              selectedTerrainIds={selectedTerrainIds}
              heroes={!mapEditing && showHeroes ? (frame?.heroes ?? heroes).map((hero) =>
                tool?.kind === 'drag' && hero.id === tool.id && dragPreview ? { ...hero, position: dragPreview } : hero
              ) : []}
              snap={snap}
              selectedHeroId={selectedHeroId}
              sightline={!frame && activeSight ? {
                start: activeSight.start, end: activeSight.endpoint, blocked: Boolean(activeSight.sight),
              } : null}
              abilities={mapEditing ? [] : frame?.abilities ?? abilities}
              abilityPreview={!frame && !mapEditing && showHeroes && selectedHero && activeAbility
                ? { hero: selectedHero, settings: activeAbility } : undefined}
              onSelect={(id, extend) => { if (!frame) selectTerrain(id, extend); }}
              onSelectHero={(id) => { if (!frame) selectHero(id); }}
              annotations={[...(!mapEditing && showAnnotations ? annotations : []), ...measurementOverlay, ...sightOverlay]}
              selectedAnnotationId={annotationId}
              onEditSurface={measuring || sightPicking || (!locked && tool && tool.kind !== 'drag') ? editSurface : undefined}
              onDragSurface={!locked && tool?.kind === 'drag' ? setDragPreview : undefined}
              onDropSurface={!locked && tool?.kind === 'drag' ? finishDrag : undefined}
            />
            <span className="view-label" aria-hidden="true">{heroView ? `${heroName(heroView.heroId)} 시점` : viewNames[mode]}</span>
            {!heroView && mode === '2d' && <span className="north-label" aria-label="위쪽은 북쪽">↑ N</span>}
          </div>
          <footer className="viewport-footer">
            {heroView ? <span>영웅의 눈높이와 배치 방향 · Esc로 종료</span> : <>
              <span>{mode === '2d' ? '드래그로 이동' : '드래그로 회전 · 우클릭 드래그로 이동'}</span>
              <span>휠 또는 핀치로 확대·축소</span>
            </>}
          </footer>
        </section>
        <aside className="inspector-panel panel" aria-labelledby="inspector-title">
          <div className="panel-heading"><h2 id="inspector-title">지형 정보</h2></div>
          <div className="inspector-body" role="status">
            {selectedHero ? (
              <>
                <h3>{heroName(selectedHero.heroId)}</h3>
                <dl>
                  <div><dt>팀</dt><dd>{teamNames[selectedHero.team]}</dd></div>
                  <div><dt>좌표 (X, Y, Z)</dt><dd>{selectedHero.position.map(formatNumber).join(', ')}</dd></div>
                  <div><dt>높이</dt><dd>{formatElevation(selectedHero.position[1])}</dd></div>
                  <div><dt>방향</dt><dd>{selectedHero.yaw}°</dd></div>
                  {tool?.kind === 'drag' && dragPreview && (
                    <div><dt>이동 미리보기 (X, Y, Z)</dt><dd>{dragPreview.map(formatNumber).join(', ')}</dd></div>
                  )}
                </dl>
                {selectedHeroProfile && <details>
                  <summary>영웅 정보 · {roleNames[selectedHeroProfile.role]}</summary>
                  <ul>
                    {selectedHeroProfile.abilities.map(({ id, name }) => <li key={id}>{name}</li>)}
                  </ul>
                  <a href={selectedHeroProfile.source} target="_blank" rel="noreferrer">Blizzard 영웅 정보</a>
                </details>}
                {selectedHeroProfile && <AbilityPreviewTools
                  key={previewKey}
                  abilities={selectedHeroProfile.abilities}
                  preview={activeAbility}
                  placementDisabled={locked || !showHeroes}
                  onPlace={(settings) => pickAbilitySurface('능력을 배치할 지면을 선택하세요.', (position) => saveAbility({
                    ...settings, id: crypto.randomUUID(), heroId: selectedHero.heroId,
                    position, heading: selectedHero.yaw, visible: true,
                  }))}
                  onPreview={(next) => setAbilityPreviews((current) => {
                    if (next) return { ...current, [previewKey]: next };
                    const copy = { ...current };
                    delete copy[previewKey];
                    return copy;
                  })}
                />}
                {heroes.length > 1 && <div className="spatial-probe">
                  <label>시야 확인 대상 <select aria-label="시야 확인 대상" value={sightTarget?.id ?? ''} onChange={(event) => {
                    activateTool(null);
                    setSightPoints([]);
                    setSightTargetId(event.target.value);
                  }}>
                    <option value="">대상 선택</option>
                    {heroes.filter((hero) => hero.id !== selectedHeroId).map((hero, index) => (
                      <option key={hero.id} value={hero.id}>{heroName(hero.heroId)} · {index + 1}</option>
                    ))}
                  </select></label>
                  {spatialProbe && <>
                    <p>시야: {spatialProbe.sight?.name ?? '개방'} · 충돌: {spatialProbe.collision?.name ?? '없음'}</p>
                    <p>노출: {exposureLabels[spatialProbe.exposure.status]} ({spatialProbe.exposure.visibleCount}/{spatialProbe.exposure.samples.length})</p>
                    <ul aria-label="높이별 노출">
                      {spatialProbe.exposure.samples.map(({ part, visible }) => (
                        <li key={part}>{sampleLabels[part]}: {visible ? '보임' : '가려짐'}</li>
                      ))}
                    </ul>
                    <details>
                      <summary>노출 판정 기준</summary>
                      <p>지도 단위 기준 0.45, 1.05, 1.8 높이의 세 점을 검사합니다. 실제 영웅의 자세와 히트박스는 반영하지 않습니다.</p>
                      <p>모든 층의 지형이 포함되며 시야 차단과 충돌은 각각 판정합니다. 영웅은 판정의 시작점과 목표점을 제공합니다.</p>
                    </details>
                  </>}
                </div>}
                {showHeroes && <button className="reset-button" type="button" aria-pressed={Boolean(heroView)} onClick={() => {
                  activateTool(null);
                  if (!heroView) setHeroViewId(selectedHero.id);
                }}>영웅 시점</button>}
                <fieldset className="hero-actions edit-controls" disabled={locked || !showHeroes}>
                  <button className="reset-button" type="button" onClick={() => activateTool({ kind: 'move', id: selectedHero.id })}>이동</button>
                  <button className="reset-button" type="button" onClick={() => activateTool({ kind: 'drag', id: selectedHero.id })}>드래그 이동</button>
                  <button className="reset-button" type="button" onClick={() => dispatch({
                    type: 'update', id: selectedHero.id, patch: { yaw: (selectedHero.yaw + 45) % 360 },
                  })}>45° 회전</button>
                  <button className="reset-button" type="button" onClick={() => dispatch({
                    type: 'update', id: selectedHero.id, patch: { team: selectedHero.team === 'attack' ? 'defense' : 'attack' },
                  })}>팀 전환</button>
                  <button className="reset-button" type="button" onClick={() => {
                    activateTool(null);
                    dispatch({ type: 'remove', id: selectedHero.id });
                  }}>삭제</button>
                </fieldset>
              </>
            ) : selected ? (
              <>
                <h3>{selected.name}</h3>
                <dl>
                  <div><dt>유형</dt><dd>{kindNames[selected.kind]}</dd></div>
                  <div><dt>최고 높이</dt><dd>{formatElevation(topElevation(selected))}</dd></div>
                  <div><dt>기준 좌표 (X, Y, Z)</dt><dd>{selected.origin.map(formatNumber).join(', ')}</dd></div>
                  {selected.kind === 'stairs' && <div><dt>계단 수</dt><dd>{selected.steps}</dd></div>}
                </dl>
              </>
            ) : <p className="empty-selection">지도 또는 지형 목록에서 블록을 선택하세요.</p>}
          </div>
          {(measuring || first) && <section className="hero-tools" aria-label="측정 결과">
            {distance && first && second ? <dl>
              <div><dt>지점 높이</dt><dd>시작 {formatElevation(first[1])} · 끝 {formatElevation(second[1])}</dd></div>
              <div><dt>수평 거리</dt><dd>{formatNumber(distance.horizontal)} u</dd></div>
              <div><dt>높이 차</dt><dd>{formatElevation(distance.rise)}</dd></div>
              <div><dt>직선 거리</dt><dd>{formatNumber(distance.distance)} u</dd></div>
            </dl> : <p>{first ? '두 번째 지점을 선택하세요.' : '첫 번째 지점을 선택하세요.'}</p>}
            {first && <button type="button" className="reset-button" onClick={() => setMeasurement([])}>측정 지우기</button>}
          </section>}
          {(sightPicking || sightFirst) && <section className="hero-tools" aria-label="지점 간 시야 결과">
            <p>두 지면에서 {heroEyeHeight} u 위를 연결합니다.</p>
            <p role="status">{terrainSight
              ? terrainSight.sight ? `시야 차단: ${terrainSight.sight.name}` : '시야 개방'
              : sightFirst ? '시야 목표점을 선택하세요.' : '시야 시작점을 선택하세요.'}</p>
            {sightFirst && <button type="button" className="reset-button" onClick={() => setSightPoints([])}>시야 지우기</button>}
          </section>}
          {mapEditing ? <>
            <TerrainTools
              map={map}
              selected={selected}
              selectedCount={selectedTerrainIds.size}
              undoable={timeline.past.length > 0}
              redoable={timeline.future.length > 0}
              onSave={(terrain) => updateTerrain(map.terrain.map((item) => item.id === selectedId ? terrain : item), selectedId)}
              onAdd={() => copyTerrain()}
              onDuplicate={copyTerrain}
              onTransform={(id, transform) => updateTerrain(
                map.terrain.map((item) => item.id === id ? (transform === 'rotate' ? rotateTerrain(item) : snapTerrain(item)) : item),
                id,
              )}
              onSaveLayer={saveLayer}
              onDeleteLayer={deleteLayer}
              onBulkRemove={() => updateTerrain(map.terrain.filter((item) => !selectedTerrainIds.has(item.id)), null)}
              onBulkDuplicate={() => updateTerrain([
                ...map.terrain,
                ...map.terrain.filter((item) => selectedTerrainIds.has(item.id)).map((item) => ({
                  ...item, id: crypto.randomUUID(), name: `${item.name} 복제`,
                  origin: [item.origin[0] + 1, item.origin[1], item.origin[2] + 1],
                })),
              ], null)}
              onRemove={(id) => updateTerrain(map.terrain.filter((item) => item.id !== id), null)}
              onHistory={moveMapHistory}
            />
            {mapMessage && <p role="status">{mapMessage}</p>}
          </> : <>
            {(abilities.length > 0 || abilityPick) && <AbilityPlacementTools
              items={abilities}
              selectedId={selectedAbilityId}
              locked={locked}
              pending={abilityPick?.hint}
              onSelect={(id) => { activateTool(null); setSelectedAbilityId(id); }}
              onMove={(ability) => pickAbilitySurface('능력을 이동할 지면을 선택하세요.', (position) =>
                saveAbility({ ...ability, position }))}
              onUpdate={saveAbility}
              onRemove={(id) => { activateTool(null); dispatch({ type: 'remove-ability', id }); }}
              onCancel={() => activateTool(null)}
            />}
            <AnnotationTools
              items={annotations}
              locked={locked || !showAnnotations}
              selected={annotations.find((item) => item.id === annotationId)}
              pending={annotationPick}
              onSelect={selectAnnotation}
              onSave={saveAnnotation}
              onPick={(pick) => activateTool(pick ? { kind: 'annotation', pick } : null)}
              onRemove={(id) => {
                if (annotationPick) changeSurfaceTool(null);
                dispatch({ type: 'remove-annotation', id });
              }}
            />
          </>}
          <div className="legend">
            <h3>범례</h3>
            <ul>
              {terrainKinds.map((kind) => (
                <li key={kind}><span className={`terrain-swatch ${kind}`} aria-hidden="true" />{kindNames[kind]}</li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Editor;
