import { useLocale } from '../ui/locale';
import LocalePicker from '../ui/locale-picker';
import { downloadFile, fileStem } from './download-file';
import StrategyFileTools from './strategy-file-tools';
import useWorkspaceDocuments from './use-workspace-documents';
import TimelinePlaybackControls from './timeline-playback-controls';
import useTimelinePlayback from './use-timeline-playback';
import { sampleTimeline, timelineDuration } from '../domain/timeline-playback';
import StrategyTimelineTools from './strategy-timeline-tools';
import StrategyDraftTools from './strategy-draft-tools';
import type { StrategyDraft } from '../domain/strategy-draft';
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
import { mapBounds, terrainKinds, topElevation, visibleTerrainForLayer } from '../domain/map';
import type { MapDefinition, MapLayer, Terrain, TerrainKind, WorldPoint } from '../domain/map';
import { heroEyeHeight } from '../domain/strategy';
import type { Team } from '../domain/strategy';
import type { StrategyAction } from '../domain/strategy-history';
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

const exposureLabels = { blocked: '완전 차단', partial: '부분 노출', clear: '개방' };
const sampleLabels = { lower: '하단', middle: '중단', upper: '상단' };

const Editor = ({ initialDraft }: { initialDraft?: StrategyDraft }) => {
  const { locale, t } = useLocale();
  const formatNumber = new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }).format;
  const formatElevation = (value: number) => `${value > 0 ? '+' : ''}${formatNumber(value)} u`;
  const displayHero = (id: string) => locale === 'en' ? getHero(id)?.name ?? id : heroName(id);
  const workspace = useWorkspaceDocuments(initialDraft);
  const { catalogue, map, history, timeline, draft, recovery, importMessage, mapMessage, editStrategy } = workspace;
  const mapId = map.id;
  const { min, max } = useMemo(() => mapBounds(map.terrain), [map]);
  const [mapActionsOpen, setMapActionsOpen] = useState(false);
  const [displayOptionsOpen, setDisplayOptionsOpen] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
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
    id: 'measurement-preview', kind: second ? 'line' : 'note', label: t('측정'), points: measurement,
  }] : [];
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
    if (next && window.matchMedia('(max-width: 680px)').matches) {
      viewport.current?.focus({ preventScroll: true });
      viewport.current?.scrollIntoView({ block: 'center' });
    }
  }, [changeSurfaceTool, leavePresentation]);
  const dispatch = useCallback((action: StrategyAction) => {
    stop();
    editStrategy(action);
  }, [editStrategy, stop]);
  const resetMapView = () => {
    activateTool(null);
    setMeasurement([]);
    setSightPoints([]);
    setLayerId('');
    setSelectedId(null);
    setSelectedHeroId(null);
    setSightTargetId('');
    setAnnotationId(null);
    setSelectedAbilityId(null);
  };
  const switchMap = (id: string) => {
    workspace.openMap(id);
    resetMapView();
  };
  const restoreDraft = (saved: StrategyDraft, persist = false) => {
    workspace.restoreDraft(saved, persist);
    setAbilityPreviews((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => JSON.parse(key)[0] !== saved.map.id),
    ));
    resetMapView();
    setMapEditing(false);
    setReset((value) => value + 1);
  };
  const importMap = async (file: File) => {
    if (await workspace.importMap(file)) resetMapView();
  };
  const syncTerrainView = (next: MapDefinition | undefined, nextId: string | null) => {
    if (!next) return;
    setSelectedId(nextId);
    if (layerId && !next.layers?.some((layer) => layer.id === layerId)) setLayerId('');
  };
  const updateTerrain = (terrain: unknown[], nextId: string | null, layers = map.layers) =>
    syncTerrainView(workspace.updateTerrain(terrain, layers), nextId);
  const moveMapHistory = (direction: 'undo' | 'redo') => syncTerrainView(workspace.moveMapHistory(direction), null);
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
    workspace.createMap(t('새 지도'), t('기본 바닥'));
    resetMapView();
    setMapEditing(true);
  };
  const copyTerrain = (terrain?: Terrain) => {
    const id = crypto.randomUUID();
    const item = terrain
      ? { ...terrain, id, name: t('{0} 복제', terrain.name), origin: [terrain.origin[0] + 1, terrain.origin[1], terrain.origin[2] + 1] }
      : { id, name: t('새 블록'), kind: 'platform', origin: [-1, 0, -1], size: [2, 1, 2], layerId: layerId || undefined };
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
    id: 'sight-start', kind: 'note', label: t('시야 시작점'), points: [sightFirst],
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
          <img className="brand-mark" src="favicon.png" alt="" width={30} height={30} />
          Vertactics
        </div>
        <div className="map-catalogue" aria-label={t('지도 관리')} role="group">
          <label>{t('지도') + ' '}<select aria-label={t('지도')} value={mapId} onChange={(event) => switchMap(event.target.value)}>
            {catalogue.map((item) => <option key={item.id} value={item.id}>{t(item.name)}</option>)}
          </select></label>
          <button type="button" className="reset-button mobile-panel-toggle" aria-expanded={mapActionsOpen}
            aria-controls="map-actions" onClick={() => setMapActionsOpen((open) => !open)}>{t('지도 관리')}</button>
          <div className="map-actions" id="map-actions" data-expanded={mapActionsOpen}>
            <button type="button" className="reset-button" onClick={createMap}>{t('새 지도')}</button>
            <button type="button" className="reset-button" aria-pressed={mapEditing} onClick={() => {
              activateTool(null);
              selectTerrain(null);
              setMapEditing((current) => !current);
            }}>{t('지도 편집 모드')}</button>
            <label className="file-button reset-button">{t('지도 JSON 가져오기')}<input type="file" accept=".json,application/json" onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void importMap(file);
            }} /></label>
            <a className="reset-button" download={`${map.id}.json`}
              href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(map, null, 2))}`}>{t('지도 JSON 저장')}</a>
          </div>
          {importMessage && <span role="status">{t(importMessage)}</span>}
        </div>
        <nav className="workspace-links" aria-label={t('작업 공간')}>
          <a className="reset-button" href="#view-title">{t('지도 보기')}</a>
          <a className="reset-button" href="#strategy-draft-title">{draft.strategy.id === 'local-draft' ? t(draft.strategy.title) : draft.strategy.title}</a>
          <a className="reset-button" href="#inspector-title">{t('속성')}</a>
          <a className="reset-button" href="#workspace-help">{t('도움말')}</a>
          <LocalePicker />
        </nav>
      </header>
      <main className="workspace editor-workspace">
        <section className="view-panel panel" aria-labelledby="view-title">
          <div className="viewport-toolbar">
            <div>
              <h1 id="view-title" tabIndex={-1}>{t(map.name)}</h1>
              <p className="world-size">
                {map.metadata?.verification === 'verified' ? t('검증됨') : map.metadata?.verification === 'synthetic' ? t('가상 지도') : t('미검증')} · {max[0] - min[0]} × {max[2] - min[2]} u</p>
            </div>
            <div className="viewport-actions">
              <div className="mode-switch" role="group" aria-label={t('지도 보기')}>
                {viewportModes.map((view) => (
                  <button
                    key={view}
                    type="button"
                    aria-label={t(viewNames[view])}
                    aria-pressed={!heroView && mode === view}
                    onClick={() => { setHeroViewId(undefined); setMode(view); }}
                  >
                    {view.toUpperCase()}
                  </button>
                ))}
              </div>
              {heroView
                ? <button className="reset-button" type="button" onClick={() => setHeroViewId(undefined)}>{t('이전 시점으로')}</button>
                : <button className="reset-button" type="button" onClick={() => setReset((value) => value + 1)}>
                  {t('시점 초기화')}
                </button>}
              <button type="button" className="reset-button mobile-panel-toggle" aria-expanded={displayOptionsOpen}
                aria-controls="display-options" onClick={() => setDisplayOptionsOpen((open) => !open)}>{t('표시 설정')}</button>
            </div>
          </div>
          {imageMessage && <p role="status">{t(imageMessage)}</p>}
          <div className="view-options display-options" id="display-options" data-expanded={displayOptionsOpen}
            role="group" aria-label={t('편집 및 표시 설정')}>
            {map.layers && <label>{t('표시 층') + ' '}<select value={layerId} onChange={(event) => {
              setLayerId(event.target.value);
              setSelectedId(null);
            }}>
              <option value="">{t('모든 층')}</option>
              {map.layers.map(({ id, name }) => <option key={id} value={id}>{t(name)}</option>)}
            </select></label>}
            <label><input type="checkbox" checked={snap} onChange={(event) => setSnap(event.target.checked)} />{' ' + t('격자 스냅')}</label>
            <label><input type="checkbox" checked={locked} onChange={(event) => {
              activateTool(null);
              setLocked(event.target.checked);
            }} />{' ' + t('편집 잠금')}</label>
            <label><input type="checkbox" checked={showHeroes} onChange={(event) => {
              activateTool(null);
              setShowHeroes(event.target.checked);
            }} />{' ' + t('영웅 표시')}</label>
            <label><input type="checkbox" checked={showAnnotations} onChange={(event) => {
              activateTool(null);
              setShowAnnotations(event.target.checked);
            }} />{' ' + t('마커 표시')}</label>
            <button className="reset-button" type="button" onClick={() => void saveViewport()}>{t('지도 PNG 저장')}</button>
          </div>
          {!mapEditing && durationMs > 0 && (!playback
            ? <div className="view-options"><button type="button" className="reset-button" onClick={() => {
              activateTool(null);
              start();
            }}>{t('전략 재생')}</button></div>
            : <TimelinePlaybackControls durationMs={durationMs} phaseLabel={frame?.phaseLabel ?? ''}
              timeMs={playback.timeMs} playing={playback.playing} speed={playback.speed}
              onToggle={toggle} onSeek={seek} onSpeed={changeSpeed} onExit={stop}
            />)}
          <nav className="canvas-tools" aria-label={t('지도 도구')}>
            <a className="reset-button" href="#terrain-title">{t('지형 목록')}</a>
            {!mapEditing && <a className="reset-button" href="#hero-tools-title">{t('영웅')}</a>}
            <button type="button" className="reset-button" aria-pressed={measuring} onClick={() => {
              activateTool(measuring ? null : { kind: 'distance' });
              if (!measuring) setMeasurement([]);
            }}>{t('거리 측정')}</button>
            <button type="button" className="reset-button" aria-pressed={sightPicking} onClick={() => {
              activateTool(sightPicking ? null : { kind: 'sight' });
              if (!sightPicking || !sightSecond) setSightPoints([]);
            }}>{t('지점 간 시야')}</button>
          </nav>
          {tool && <p className="tool-status" role="status">{t(tool.kind === 'drag'
            ? '선택한 영웅을 지도에서 끌어 이동하세요.'
            : '지도에서 지점을 선택하세요. Esc로 취소합니다.')}</p>}
          <div ref={viewport} className="viewport" data-testid="viewport" tabIndex={-1}
            role="region" aria-label={t('지형 지도')}
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
            <span className="view-label" aria-hidden="true">{heroView ? t('{0} 시점', displayHero(heroView.heroId)) : t(viewNames[mode])}</span>
            {!heroView && mode === '2d' && <span className="north-label" aria-label={t('위쪽은 북쪽')}>↑ N</span>}
          </div>
          <footer className="viewport-footer">
            {heroView ? <span>{t('영웅의 눈높이와 배치 방향 · Esc로 종료')}</span> : <>
              <span>{mode === '2d' ? t('드래그로 이동') : t('드래그로 회전 · 우클릭 드래그로 이동')}</span>
              <span>{t('휠 또는 핀치로 확대·축소')}</span>
            </>}
          </footer>
        </section>
        <aside className="terrain-panel panel" aria-labelledby="terrain-title">
          <div className="panel-heading">
            <h2 id="terrain-title" tabIndex={-1}>{t('지형 목록')}</h2>
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
                  <span>{t(terrain.name)}</span>
                  <small>{formatElevation(topElevation(terrain))}</small>
                </button>
              </li>
            ))}
          </ul>
          {!mapEditing && <HeroTools
            heroes={heroes}
            locked={locked || !showHeroes}
            selectedId={selectedHeroId}
            pendingMessage={tool?.kind === 'place' ? t('배치할 지면을 클릭하세요.') : tool?.kind === 'drag' ? t('지도에서 누른 채 끌어 이동하세요.') : tool?.kind === 'move' ? t('이동할 지면을 클릭하세요.') : ''}
            canUndo={!locked && history.past.length > 0}
            canRedo={!locked && history.future.length > 0}
            onPlace={(heroId, team) => activateTool({ kind: 'place', heroId, team })}
            onSelect={(id) => { activateTool(null); selectHero(id); }}
            onUndo={() => { activateTool(null); dispatch({ type: 'undo' }); }}
            onRedo={() => { activateTool(null); dispatch({ type: 'redo' }); }}
            onCancel={() => activateTool(null)}
          />}
          <StrategyDraftTools draft={draft} onRestore={restoreDraft} />
          <StrategyFileTools draft={draft} onImport={(imported) => restoreDraft(imported, true)} />
          <section className="hero-tools" aria-label={t('작업 복구')}>
            {recovery.saved ? <>
              <p>{t('이전 작업 ·') + ' '}{t(recovery.saved.map.name)}</p>
              <p>{t('복구하면 해당 지도의 편집 내용이 복구본으로 바뀝니다.')}</p>
              <div className="hero-actions">
                <button type="button" className="reset-button" onClick={() => {
                  const saved = recovery.restore();
                  if (saved) restoreDraft(saved);
                }}>{t('이전 작업 복구')}</button>
                <button type="button" className="reset-button" onClick={recovery.discard}>{t('복구본 지우기')}</button>
              </div>
            </> : <p role="status">{{
              idle: recovery.unreadable ? t('이전 작업 데이터를 읽을 수 없습니다.') : t('편집 내용은 이 브라우저에 자동 저장됩니다.'),
              pending: t('작업 자동 저장 중'),
              saved: t('작업을 자동 저장했습니다.'),
              error: t('작업을 자동 저장할 수 없습니다. 전략 저장을 사용할 수 있습니다.'),
            }[recovery.status]}</p>}
            {recovery.saved && recovery.status === 'error' && <p role="status">{t('복구본을 지울 수 없습니다.')}</p>}
          </section>
          {!mapEditing && <StrategyTimelineTools key={mapId} strategy={history.present} locked={locked}
            onChange={(timeline) => { activateTool(null); dispatch({ type: 'set-timeline', timeline }); }}
          />}
        </aside>
        <aside className="inspector-panel panel" aria-labelledby="inspector-title">
          <div className="panel-heading"><h2 id="inspector-title" tabIndex={-1}>{t('지형 정보')}</h2></div>
          <div className="inspector-body" role="status">
            {selectedHero ? (
              <>
                <h3>{displayHero(selectedHero.heroId)}</h3>
                <dl>
                  <div><dt>{t('팀')}</dt><dd>{t(teamNames[selectedHero.team])}</dd></div>
                  <div><dt>{t('좌표 (X, Y, Z)')}</dt><dd>{selectedHero.position.map(formatNumber).join(', ')}</dd></div>
                  <div><dt>{t('높이')}</dt><dd>{formatElevation(selectedHero.position[1])}</dd></div>
                  <div><dt>{t('방향')}</dt><dd>{selectedHero.yaw}°</dd></div>
                  {tool?.kind === 'drag' && dragPreview && (
                    <div><dt>{t('이동 미리보기 (X, Y, Z)')}</dt><dd>{dragPreview.map(formatNumber).join(', ')}</dd></div>
                  )}
                </dl>
                {selectedHeroProfile && <details>
                  <summary>{t('영웅 정보 ·') + ' '}{t(roleNames[selectedHeroProfile.role])}</summary>
                  <ul>
                    {selectedHeroProfile.abilities.map(({ id, name }) => <li key={id}>{name}</li>)}
                  </ul>
                  <a href={selectedHeroProfile.source} target="_blank" rel="noreferrer">{t('Blizzard 영웅 정보')}</a>
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
                  <label>{t('시야 확인 대상') + ' '}<select aria-label={t('시야 확인 대상')} value={sightTarget?.id ?? ''} onChange={(event) => {
                    activateTool(null);
                    setSightPoints([]);
                    setSightTargetId(event.target.value);
                  }}>
                    <option value="">{t('대상 선택')}</option>
                    {heroes.filter((hero) => hero.id !== selectedHeroId).map((hero, index) => (
                      <option key={hero.id} value={hero.id}>{displayHero(hero.heroId)} · {index + 1}</option>
                    ))}
                  </select></label>
                  {spatialProbe && <>
                    <p>{t('시야:') + ' '}{spatialProbe.sight ? t(spatialProbe.sight.name) : t('개방')}{' ' + t('· 충돌:') + ' '}{spatialProbe.collision ? t(spatialProbe.collision.name) : t('없음')}</p>
                    <p>{t('노출:') + ' '}{t(exposureLabels[spatialProbe.exposure.status])} ({spatialProbe.exposure.visibleCount}/{spatialProbe.exposure.samples.length})</p>
                    <ul aria-label={t('높이별 노출')}>
                      {spatialProbe.exposure.samples.map(({ part, visible }) => (
                        <li key={part}>{t(sampleLabels[part])}: {visible ? t('보임') : t('가려짐')}</li>
                      ))}
                    </ul>
                    <details>
                      <summary>{t('노출 판정 기준')}</summary>
                      <p>{t('지도 단위 기준 0.45, 1.05, 1.8 높이의 세 점을 검사합니다. 실제 영웅의 자세와 히트박스는 반영하지 않습니다.')}</p>
                      <p>{t('모든 층의 지형이 포함되며 시야 차단과 충돌은 각각 판정합니다. 영웅은 판정의 시작점과 목표점을 제공합니다.')}</p>
                    </details>
                  </>}
                </div>}
                {showHeroes && <button className="reset-button" type="button" aria-pressed={Boolean(heroView)} onClick={() => {
                  activateTool(null);
                  if (!heroView) setHeroViewId(selectedHero.id);
                }}>{t('영웅 시점')}</button>}
                <fieldset className="hero-actions edit-controls" disabled={locked || !showHeroes}>
                  <button className="reset-button" type="button" onClick={() => activateTool({ kind: 'move', id: selectedHero.id })}>{t('이동')}</button>
                  <button className="reset-button" type="button" onClick={() => activateTool({ kind: 'drag', id: selectedHero.id })}>{t('드래그 이동')}</button>
                  <button className="reset-button" type="button" onClick={() => dispatch({
                    type: 'update', id: selectedHero.id, patch: { yaw: (selectedHero.yaw + 45) % 360 },
                  })}>{t('45° 회전')}</button>
                  <button className="reset-button" type="button" onClick={() => dispatch({
                    type: 'update', id: selectedHero.id, patch: { team: selectedHero.team === 'attack' ? 'defense' : 'attack' },
                  })}>{t('팀 전환')}</button>
                  <button className="reset-button" type="button" onClick={() => {
                    activateTool(null);
                    dispatch({ type: 'remove', id: selectedHero.id });
                  }}>{t('삭제')}</button>
                </fieldset>
              </>
            ) : selected ? (
              <>
                <h3>{t(selected.name)}</h3>
                <dl>
                  <div><dt>{t('유형')}</dt><dd>{t(kindNames[selected.kind])}</dd></div>
                  <div><dt>{t('최고 높이')}</dt><dd>{formatElevation(topElevation(selected))}</dd></div>
                  <div><dt>{t('기준 좌표 (X, Y, Z)')}</dt><dd>{selected.origin.map(formatNumber).join(', ')}</dd></div>
                  {selected.kind === 'stairs' && <div><dt>{t('계단 수')}</dt><dd>{selected.steps}</dd></div>}
                </dl>
              </>
            ) : <p className="empty-selection">{t('지도 또는 지형 목록에서 블록을 선택하세요.')}</p>}
          </div>
          {(measuring || first) && <section className="hero-tools" aria-label={t('측정 결과')}>
            {distance && first && second ? <dl>
              <div><dt>{t('지점 높이')}</dt><dd>{t('시작') + ' '}{formatElevation(first[1])}{' ' + t('· 끝') + ' '}{formatElevation(second[1])}</dd></div>
              <div><dt>{t('수평 거리')}</dt><dd>{formatNumber(distance.horizontal)} u</dd></div>
              <div><dt>{t('높이 차')}</dt><dd>{formatElevation(distance.rise)}</dd></div>
              <div><dt>{t('직선 거리')}</dt><dd>{formatNumber(distance.distance)} u</dd></div>
            </dl> : <p>{first ? t('두 번째 지점을 선택하세요.') : t('첫 번째 지점을 선택하세요.')}</p>}
            {first && <button type="button" className="reset-button" onClick={() => setMeasurement([])}>{t('측정 지우기')}</button>}
          </section>}
          {(sightPicking || sightFirst) && <section className="hero-tools" aria-label={t('지점 간 시야 결과')}>
            <p>{t('두 지면에서') + ' '}{heroEyeHeight}{' ' + t('u 위를 연결합니다.')}</p>
            <p role="status">{terrainSight
              ? terrainSight.sight ? t('시야 차단: {0}', t(terrainSight.sight.name)) : t('시야 개방')
              : sightFirst ? t('시야 목표점을 선택하세요.') : t('시야 시작점을 선택하세요.')}</p>
            {sightFirst && <button type="button" className="reset-button" onClick={() => setSightPoints([])}>{t('시야 지우기')}</button>}
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
                  ...item, id: crypto.randomUUID(), name: t('{0} 복제', item.name),
                  origin: [item.origin[0] + 1, item.origin[1], item.origin[2] + 1],
                })),
              ], null)}
              onRemove={(id) => updateTerrain(map.terrain.filter((item) => item.id !== id), null)}
              onHistory={moveMapHistory}
            />
            {mapMessage && <p role="status">{t(mapMessage)}</p>}
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
          <details className="legend">
            <summary>{t('지형 범례')}</summary>
            <ul>
              {terrainKinds.map((kind) => (
                <li key={kind}><span className={`terrain-swatch ${kind}`} aria-hidden="true" />{t(kindNames[kind])}</li>
              ))}
            </ul>
          </details>
          <details className="legend">
            <summary id="workspace-help">{t('도움말')}</summary>
            <ul>
              <li>{t('지도나 지형 목록에서 블록을 선택하면 좌표와 높이를 확인할 수 있습니다.')}</li>
              <li>{t('영웅을 배치한 뒤 속성 패널에서 팀과 방향을 바꿀 수 있습니다.')}</li>
              <li>{t('Esc로 도구를 취소하거나 재생을 종료합니다.')}</li>
              <li>{t('Ctrl 또는 ⌘와 Z로 실행 취소하고, Shift를 함께 눌러 다시 실행합니다.')}</li>
              <li>{t('Vertactics는 Blizzard Entertainment와 제휴하지 않은 Overwatch 팬 프로젝트입니다.')}</li>
            </ul>
          </details>
        </aside>
      </main>
    </div>
  );
};

export default Editor;
