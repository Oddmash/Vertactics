import { Button, Disclosure, Input, Select } from '../ui/controls';
import { useLocale } from '../ui/locale';
import LocalePicker from '../ui/locale-picker';
import MapCatalogue from './map-catalogue';
import MapLocationPicker from './map-location-picker';
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Annotation } from '../domain/annotation';
import { traceHeroSightline, traceTerrainSightline } from '../domain/spatial-analysis';
import AnnotationTools from './annotation-tools';
import type { SurfacePick } from './annotation-tools';
import { terrainKinds, topElevation, visibleTerrainForLayer } from '../domain/map';
import type { TerrainKind, WorldPoint } from '../domain/map';
import { heroEyeHeight } from '../domain/strategy';
import type { Team } from '../domain/strategy';
import type { StrategyAction } from '../domain/strategy-history';
import type { ViewMode } from '../render/map-camera';
import MapViewport from '../render/map-viewport';
import HeroTools, { heroDragType, roleNames, teamNames } from './hero-tools';
import { getHero, heroName, isCatalogueHero } from '../domain/hero-catalogue';
import type { CatalogueHero } from '../domain/hero-catalogue';
import { competitiveOverview, terrainLocations } from '../map/competitive-overviews';

type SurfaceTool =
  | { kind: 'place'; heroId: CatalogueHero; team: Team }
  | { kind: 'move' | 'drag'; id: string }
  | { kind: 'distance' | 'sight' | 'pen' }
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
  const { catalogue, map, history, draft, recovery, editStrategy } = workspace;
  const mapId = map.id;
  const overview = useMemo(() => competitiveOverview(map), [map]);
  const [locationId, setLocationId] = useState('');
  const locations = useMemo(() => overview?.locations ?? terrainLocations(map), [map, overview]);
  const focusedLocation = locations.find(({ id }) => id === locationId);
  const [displayOptionsOpen, setDisplayOptionsOpen] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const editorRoot = useRef<HTMLDivElement>(null);
  const [fullScreen, setFullScreen] = useState(false);
  useEffect(() => {
    const syncFullscreen = () => setFullScreen(document.fullscreenElement === editorRoot.current);
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);
  const toggleFullscreen = () => {
    if (fullScreen) {
      setFullScreen(false);
      if (document.fullscreenElement === editorRoot.current) void document.exitFullscreen().catch(() => {});
      return;
    }
    setFullScreen(true);
    const request = editorRoot.current?.requestFullscreen?.();
    if (request) void request.catch(() => {});
  };
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
  const [viewMode, setMode] = useState<ViewMode>('2d');
  const mode = overview ? '2d' : viewMode;
  const [reset, setReset] = useState(0);
  const [layerId, setLayerId] = useState('');
  const visibleTerrain = visibleTerrainForLayer(map.terrain, layerId);
  const [snap, setSnap] = useState(false);
  const [locked, setLocked] = useState(false);
  const [abilityPreviews, setAbilityPreviews] = useState<Record<string, AbilityPreviewSettings>>({});
  const [sightTargetId, setSightTargetId] = useState('');
  const [showHeroes, setShowHeroes] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedTerrainIds = new Set(selectedId ? [selectedId] : []);
  const [catalogueHeroId, setCatalogueHeroId] = useState<CatalogueHero>('tracer');
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const penPoints = useRef<WorldPoint[]>([]);
  const [penPreview, setPenPreview] = useState<WorldPoint[]>([]);
  const [dragPreview, setDragPreview] = useState<WorldPoint | null>(null);
  const [selectedAbilityId, setSelectedAbilityId] = useState<string | null>(null);
  const [annotationId, setAnnotationId] = useState<string | null>(null);
  const durationMs = timelineDuration(history.present.timeline);
  const { state: playback, start, stop, toggle, seek, changeSpeed } = useTimelinePlayback(durationMs);
  const frame = playback ? sampleTimeline(history.present, playback.timeMs) : null;
  const changeSurfaceTool = useCallback((next: SurfaceTool | null) => {
    setSurfaceTool(next);
    setDragPreview(null);
    penPoints.current = [];
    setPenPreview([]);
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
    setLocationId('');
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
    setReset((value) => value + 1);
  };
  const { heroes, annotations, abilities } = history.present;
  const selected = visibleTerrain.find(({ id }) => id === selectedId);
  const selectedHero = heroes.find(({ id }) => id === selectedHeroId);

  const heroView = !overview && showHeroes && selectedHero?.id === heroViewId ? selectedHero : undefined;
  const selectedHeroProfile = selectedHero && getHero(selectedHero.heroId);
  const previewKey = selectedHero ? JSON.stringify([mapId, selectedHero.id]) : '';
  const activeAbility = abilityPreviews[previewKey];
  const sightTarget = heroes.find((hero) => hero.id === sightTargetId && hero.id !== selectedHeroId);
  const spatialProbe = showHeroes && selectedHero && sightTarget
    ? traceHeroSightline(map.terrain, selectedHero, sightTarget) : null;
  const terrainSight = sightFirst && sightSecond ? traceTerrainSightline(map.terrain, sightFirst, sightSecond) : null;
  const activeSight = sightPicking || sightFirst ? terrainSight : spatialProbe;
  const sightOverlay: Annotation[] = sightFirst && !sightSecond ? [{
    id: 'sight-start', kind: 'note', label: t('시야 시작점'), points: [sightFirst],
  }] : [];
  const selectTerrain = (id: string | null) => {
    setSelectedId(id);
    setSelectedHeroId(null);
    setHeroViewId(undefined);
  };

  const selectHero = (id: string) => {
    const heroId = heroes.find((hero) => hero.id === id)?.heroId;
    if (heroId && isCatalogueHero(heroId)) setCatalogueHeroId(heroId);
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

  const drawPen = (point: WorldPoint | null) => {
    if (!point) return;
    const points = penPoints.current;
    const last = points.at(-1);
    if (last && Math.hypot(point[0] - last[0], point[2] - last[2]) < 0.15) return;
    const next = points.length < 64 ? points : points.filter((_, index) => index % 2 === 0);
    penPoints.current = [...next, point];
    setPenPreview(penPoints.current);
  };
  const finishPen = (point: WorldPoint | null) => {
    drawPen(point);
    if (penPoints.current.length < 2) {
      changeSurfaceTool(null);
      return;
    }
    saveAnnotation({ id: crypto.randomUUID(), kind: 'pen', label: t('펜'), points: penPoints.current });
  };
  const penOverlay: Annotation[] = penPreview.length > 1
    ? [{ id: 'pen-preview', kind: 'pen', label: t('펜'), points: penPreview }] : [];

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

  const placeHero = (heroId: CatalogueHero, team: Team, position: WorldPoint) => {
    const id = crypto.randomUUID();
    dispatch({ type: 'place', hero: { id, heroId, team, position, yaw: 0 } });
    setCatalogueHeroId(heroId);
    selectHero(id);
  };

  const dropHero = (data: string, position: WorldPoint) => {
    const [heroId, team, extra] = data.split(':');
    if (locked || !showHeroes || !heroId || extra !== undefined ||
      !isCatalogueHero(heroId) || (team !== 'attack' && team !== 'defense')) return;
    activateTool(null);
    placeHero(heroId, team, position);
  };

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
      placeHero(tool.heroId, tool.team, position);
    } else if (tool.kind === 'move') {
      dispatch({ type: 'update', id: tool.id, patch: { position } });
      selectHero(tool.id);
    }
    changeSurfaceTool(null);
  };

  return (
    <div ref={editorRoot} className="editor" data-fullscreen={fullScreen} onKeyDown={(event) => {
      if (event.key === 'Escape' && (frame || heroView || tool)) {
        event.preventDefault();
        activateTool(null);
        return;
      }
      if (event.key === 'Escape' && fullScreen && !document.fullscreenElement) {
        setFullScreen(false);
        return;
      }
      if (locked || event.defaultPrevented || event.altKey ||
        !(event.ctrlKey || event.metaKey) ||
        (event.target instanceof Element && event.target.closest('input:not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable]'))) return;
      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;
      event.preventDefault();
      activateTool(null);
      dispatch({ type: key === 'y' || event.shiftKey ? 'redo' : 'undo' });
    }}>
      <header className="app-header">
        <a className="brand workspace-brand" href="about.html">
          <span className="workspace-brand-symbol" aria-hidden="true">V</span>
          <span>Vertactics</span>
        </a>
        <div className="map-catalogue" aria-label={t('지도 관리')} role="group">
          <MapCatalogue maps={catalogue} selectedId={mapId} onSelect={switchMap} />
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
                {overview ? t('2D 전술 도식 · 위치와 축척은 참고용') :
                  (map.metadata?.verification === 'verified' ? t('검증됨') : map.metadata?.verification === 'synthetic' ? t('가상 지도') : t('미검증'))}</p>
            </div>
            <div className="viewport-actions">
              {mode === '2d' && locations.length > 0 && <MapLocationPicker locations={locations} value={locationId} onChange={setLocationId} />}
              {!overview && <div className="mode-switch" role="group" aria-label={t('지도 보기')}>
                {viewportModes.map((view) => (
                  <Button
                    key={view}
                    type="button"
                    aria-label={t(viewNames[view])}
                    aria-pressed={!heroView && mode === view}
                    onClick={() => { setHeroViewId(undefined); setMode(view); }}
                  >
                    {view.toUpperCase()}
                  </Button>
                ))}
              </div>}
              {heroView
                ? <Button className="reset-button" type="button" onClick={() => setHeroViewId(undefined)}>{t('이전 시점으로')}</Button>
                : <Button className="reset-button" type="button" onClick={() => {
                  setLocationId('');
                  setReset((value) => value + 1);
                }}>
                  {t('시점 초기화')}
                </Button>}
              <Button className="reset-button fullscreen-action" type="button" aria-pressed={fullScreen} onClick={toggleFullscreen}>
                {t(fullScreen ? '전체 화면 종료' : '전체 화면')}
              </Button>
              <Button type="button" className="reset-button mobile-panel-toggle" aria-expanded={displayOptionsOpen}
                aria-controls="display-options" onClick={() => setDisplayOptionsOpen((open) => !open)}>{t('표시 설정')}</Button>
            </div>
          </div>
          {imageMessage && <p role="status">{t(imageMessage)}</p>}
          <div className="view-options display-options" id="display-options" data-expanded={displayOptionsOpen}
            role="group" aria-label={t('편집 및 표시 설정')}>
            {map.layers && <label>{t('표시 층') + ' '}<Select value={layerId} onChange={(event) => {
              setLayerId(event.target.value);
              setSelectedId(null);
            }}>
              <option value="">{t('모든 층')}</option>
              {map.layers.map(({ id, name }) => <option key={id} value={id}>{t(name)}</option>)}
            </Select></label>}
            <label><Input type="checkbox" checked={snap} onChange={(event) => setSnap(event.target.checked)} />{' ' + t('격자 스냅')}</label>
            <label><Input type="checkbox" checked={locked} onChange={(event) => {
              activateTool(null);
              setLocked(event.target.checked);
            }} />{' ' + t('편집 잠금')}</label>
            <label><Input type="checkbox" checked={showHeroes} onChange={(event) => {
              activateTool(null);
              setShowHeroes(event.target.checked);
            }} />{' ' + t('영웅 표시')}</label>
            <label><Input type="checkbox" checked={showAnnotations} onChange={(event) => {
              activateTool(null);
              setShowAnnotations(event.target.checked);
            }} />{' ' + t('마커 표시')}</label>
            <Button className="reset-button" type="button" onClick={() => void saveViewport()}>{t('지도 PNG 저장')}</Button>
          </div>
          {durationMs > 0 && (!playback
            ? <div className="view-options"><Button type="button" className="reset-button" onClick={() => {
              activateTool(null);
              start();
            }}>{t('전략 재생')}</Button></div>
            : <TimelinePlaybackControls durationMs={durationMs} phaseLabel={frame?.phaseLabel ?? ''}
              timeMs={playback.timeMs} playing={playback.playing} speed={playback.speed}
              onToggle={toggle} onSeek={seek} onSpeed={changeSpeed} onExit={stop}
            />)}
          <nav className="canvas-tools" aria-label={t('지도 도구')}>
            <a className="reset-button" href="#hero-tools-title">{t('영웅')}</a>
            <a className="reset-button" href="#annotation-title">{t('마커')}</a>
            <div className="workspace-history">
              <Button className="reset-button" aria-label={t('실행 취소')} title={t('실행 취소')}
                disabled={locked || !history.past.length}
                onClick={() => { activateTool(null); dispatch({ type: 'undo' }); }}>↶</Button>
              <Button className="reset-button" aria-label={t('다시 실행')} title={t('다시 실행')}
                disabled={locked || !history.future.length}
                onClick={() => { activateTool(null); dispatch({ type: 'redo' }); }}>↷</Button>
            </div>
            <Button type="button" className="reset-button" aria-pressed={measuring} onClick={() => {
              activateTool(measuring ? null : { kind: 'distance' });
              if (!measuring) setMeasurement([]);
            }}>{t('거리 측정')}</Button>
            <Button type="button" className="reset-button" aria-pressed={sightPicking} onClick={() => {
              activateTool(sightPicking ? null : { kind: 'sight' });
              if (!sightPicking || !sightSecond) setSightPoints([]);
            }}>{t('지점 간 시야')}</Button>
          </nav>
          <div ref={viewport} className="viewport" data-testid="viewport" tabIndex={-1}
            role="region" aria-label={t('지형 지도')}
            onPointerCancel={() => { if (tool?.kind === 'drag' || tool?.kind === 'pen') changeSurfaceTool(null); }}
            onPointerLeave={(event) => { if (tool?.kind === 'drag' && event.buttons === 1) changeSurfaceTool(null); }}
          >
            <MapViewport
              key={mapId}
              map={map}
              capture={captureViewport}
              layerId={layerId}
              mode={mode}
              locations={locations}
              focusedLocation={focusedLocation}
              heroView={heroView}
              reset={reset}
              selectedTerrainIds={selectedTerrainIds}
              heroes={showHeroes ? (frame?.heroes ?? heroes).map((hero) =>
                tool?.kind === 'drag' && hero.id === tool.id && dragPreview ? { ...hero, position: dragPreview } : hero
              ) : []}
              snap={snap}
              selectedHeroId={selectedHeroId}
              sightline={!frame && activeSight ? {
                start: activeSight.start, end: activeSight.endpoint, blocked: Boolean(activeSight.sight),
              } : null}
              abilities={frame?.abilities ?? abilities}
              abilityPreview={!frame && showHeroes && selectedHero && activeAbility
                ? { hero: selectedHero, settings: activeAbility } : undefined}
              onSelect={(id) => { if (!frame) selectTerrain(id); }}
              onSelectHero={(id) => { if (!frame) selectHero(id); }}
              annotations={[...(showAnnotations ? annotations : []), ...measurementOverlay, ...sightOverlay, ...penOverlay]}
              selectedAnnotationId={annotationId}
              onEditSurface={measuring || sightPicking || (!locked && tool && tool.kind !== 'drag' && tool.kind !== 'pen') ? editSurface : undefined}
              onDragSurface={locked ? undefined : tool?.kind === 'pen' ? drawPen : tool?.kind === 'drag' ? setDragPreview : undefined}
              onDropSurface={locked ? undefined : tool?.kind === 'pen' ? finishPen : tool?.kind === 'drag' ? finishDrag : undefined}
              sampleDragStart={tool?.kind === 'pen'}
              externalDrop={!locked && showHeroes ? { type: heroDragType, finish: dropHero } : undefined}
            />
            {tool && <p className="tool-status" role="status">{t(tool.kind === 'pen' ? '지도에서 끌어서 그리세요. Esc로 취소합니다.' : tool.kind === 'drag'
              ? '선택한 영웅을 지도에서 끌어 이동하세요.'
              : '지도에서 지점을 선택하세요. Esc로 취소합니다.')}</p>}
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
        <aside className="terrain-panel panel" aria-labelledby="strategy-panel-title">
          <div className="panel-heading">
            <h2 id="strategy-panel-title" tabIndex={-1}>{t('전략')}</h2>
          </div>
          <StrategyDraftTools draft={draft} onRestore={restoreDraft} />
          <StrategyFileTools draft={draft} onImport={(imported) => restoreDraft(imported, true)} />
          <section className="hero-tools" aria-label={t('작업 복구')}>
            {recovery.saved ? <>
              <p>{t('이전 작업 ·') + ' '}{t(recovery.saved.map.name)}</p>
              <p>{t('복구하면 해당 지도의 편집 내용이 복구본으로 바뀝니다.')}</p>
              <div className="hero-actions">
                <Button type="button" className="reset-button" onClick={() => {
                  const saved = recovery.restore();
                  if (saved) restoreDraft(saved);
                }}>{t('이전 작업 복구')}</Button>
                <Button type="button" className="reset-button" onClick={recovery.discard}>{t('복구본 지우기')}</Button>
              </div>
            </> : <p role="status">{{
              idle: recovery.unreadable ? t('이전 작업 데이터를 읽을 수 없습니다.') : t('편집 내용은 이 브라우저에 자동 저장됩니다.'),
              pending: t('작업 자동 저장 중'),
              saved: t('작업을 자동 저장했습니다.'),
              error: t('작업을 자동 저장할 수 없습니다. 전략 저장을 사용할 수 있습니다.'),
            }[recovery.status]}</p>}
            {recovery.saved && recovery.status === 'error' && <p role="status">{t('복구본을 지울 수 없습니다.')}</p>}
          </section>
          {<StrategyTimelineTools key={mapId} strategy={history.present} locked={locked}
            onChange={(timeline) => { activateTool(null); dispatch({ type: 'set-timeline', timeline }); }}
          />}
        </aside>
        <aside className="inspector-panel panel" aria-labelledby="inspector-title">
          {<HeroTools
            heroes={heroes}
            locked={locked || !showHeroes}
            selectedId={selectedHeroId}
            catalogueId={catalogueHeroId}
            onChooseHero={(id) => {
              if (tool?.kind === 'place' && tool.heroId !== id) activateTool(null);
              setCatalogueHeroId(id);
            }}
            pendingMessage={tool?.kind === 'place' ? t('배치할 지면을 클릭하세요.') : tool?.kind === 'drag' ? t('지도에서 누른 채 끌어 이동하세요.') : tool?.kind === 'move' ? t('이동할 지면을 클릭하세요.') : ''}
            onPlace={(heroId, team) => activateTool({ kind: 'place', heroId, team })}
            onSelect={(id) => { activateTool(null); selectHero(id); }}
            onCancel={() => activateTool(null)}
          />}
          <div className="panel-heading"><h2 id="inspector-title" tabIndex={-1}>{t('지형 정보')}</h2></div>
          <div className={selectedHero ? 'inspector-body hero-inspector' : 'inspector-body'} role="status">
            {selectedHero ? (
              <>
                <h3>{displayHero(selectedHero.heroId)}</h3>
                <dl>
                  <div><dt>{t('팀')}</dt><dd>{t(teamNames[selectedHero.team])}</dd></div>
                  <div><dt>{t('높이')}</dt><dd>{formatElevation(selectedHero.position[1])}</dd></div>
                  <div><dt>{t('방향')}</dt><dd>{selectedHero.yaw}°</dd></div>
                </dl>
                {selectedHeroProfile && <Disclosure>
                  <summary>{t('영웅 정보 ·') + ' '}{t(roleNames[selectedHeroProfile.role])}</summary>
                  <ul>
                    {selectedHeroProfile.abilities.map(({ id, name }) => <li key={id}>{name}</li>)}
                  </ul>
                  <a href={selectedHeroProfile.source} target="_blank" rel="noreferrer">{t('Blizzard 영웅 정보')}</a>
                </Disclosure>}
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
                  <label>{t('시야 확인 대상') + ' '}<Select aria-label={t('시야 확인 대상')} value={sightTarget?.id ?? ''} onChange={(event) => {
                    activateTool(null);
                    setSightPoints([]);
                    setSightTargetId(event.target.value);
                  }}>
                    <option value="">{t('대상 선택')}</option>
                    {heroes.filter((hero) => hero.id !== selectedHeroId).map((hero, index) => (
                      <option key={hero.id} value={hero.id}>{displayHero(hero.heroId)} · {index + 1}</option>
                    ))}
                  </Select></label>
                  {spatialProbe && <>
                    <p>{t('시야:') + ' '}{spatialProbe.sight ? t(spatialProbe.sight.name) : t('개방')}{' ' + t('· 충돌:') + ' '}{spatialProbe.collision ? t(spatialProbe.collision.name) : t('없음')}</p>
                    <p>{t('노출:') + ' '}{t(exposureLabels[spatialProbe.exposure.status])} ({spatialProbe.exposure.visibleCount}/{spatialProbe.exposure.samples.length})</p>
                    <ul aria-label={t('높이별 노출')}>
                      {spatialProbe.exposure.samples.map(({ part, visible }) => (
                        <li key={part}>{t(sampleLabels[part])}: {visible ? t('보임') : t('가려짐')}</li>
                      ))}
                    </ul>
                    <Disclosure>
                      <summary>{t('노출 판정 기준')}</summary>
                      <p>{t('지도 단위 기준 0.45, 1.05, 1.8 높이의 세 점을 검사합니다. 실제 영웅의 자세와 히트박스는 반영하지 않습니다.')}</p>
                      <p>{t('모든 층의 지형이 포함되며 시야 차단과 충돌은 각각 판정합니다. 영웅은 판정의 시작점과 목표점을 제공합니다.')}</p>
                    </Disclosure>
                  </>}
                </div>}
                {showHeroes && !overview && <Button className="reset-button" type="button" aria-pressed={Boolean(heroView)} onClick={() => {
                  activateTool(null);
                  if (!heroView) setHeroViewId(selectedHero.id);
                }}>{t('영웅 시점')}</Button>}
                <fieldset className="hero-actions edit-controls" disabled={locked || !showHeroes}>
                  <Button className="reset-button" type="button" onClick={() => activateTool({ kind: 'move', id: selectedHero.id })}>{t('이동')}</Button>
                  <Button className="reset-button" type="button" onClick={() => activateTool({ kind: 'drag', id: selectedHero.id })}>{t('드래그 이동')}</Button>
                  <Button className="reset-button" type="button" onClick={() => dispatch({
                    type: 'update', id: selectedHero.id, patch: { yaw: (selectedHero.yaw + 45) % 360 },
                  })}>{t('45° 회전')}</Button>
                  <Button className="reset-button" type="button" onClick={() => dispatch({
                    type: 'update', id: selectedHero.id, patch: { team: selectedHero.team === 'attack' ? 'defense' : 'attack' },
                  })}>{t('팀 전환')}</Button>
                  <Button className="reset-button" type="button" onClick={() => {
                    activateTool(null);
                    dispatch({ type: 'remove', id: selectedHero.id });
                  }}>{t('삭제')}</Button>
                </fieldset>
              </>
            ) : selected ? (
              <>
                <h3>{t(selected.name)}</h3>
                <dl>
                  <div><dt>{t('유형')}</dt><dd>{t(kindNames[selected.kind])}</dd></div>
                  <div><dt>{t('최고 높이')}</dt><dd>{formatElevation(topElevation(selected))}</dd></div>
                  {selected.kind === 'stairs' && <div><dt>{t('계단 수')}</dt><dd>{selected.steps}</dd></div>}
                </dl>
              </>
            ) : <p className="empty-selection">{t('지도에서 지형이나 배치한 영웅을 선택하세요.')}</p>}
          </div>
          {(measuring || first) && <section className="hero-tools" aria-label={t('측정 결과')}>
            {distance && first && second ? <dl>
              <div><dt>{t('지점 높이')}</dt><dd>{t('시작') + ' '}{formatElevation(first[1])}{' ' + t('· 끝') + ' '}{formatElevation(second[1])}</dd></div>
              <div><dt>{t('수평 거리')}</dt><dd>{formatNumber(distance.horizontal)} u</dd></div>
              <div><dt>{t('높이 차')}</dt><dd>{formatElevation(distance.rise)}</dd></div>
              <div><dt>{t('직선 거리')}</dt><dd>{formatNumber(distance.distance)} u</dd></div>
            </dl> : <p>{first ? t('두 번째 지점을 선택하세요.') : t('첫 번째 지점을 선택하세요.')}</p>}
            {first && <Button type="button" className="reset-button" onClick={() => setMeasurement([])}>{t('측정 지우기')}</Button>}
          </section>}
          {(sightPicking || sightFirst) && <section className="hero-tools" aria-label={t('지점 간 시야 결과')}>
            <p>{t('두 지면에서') + ' '}{heroEyeHeight}{' ' + t('u 위를 연결합니다.')}</p>
            <p role="status">{terrainSight
              ? terrainSight.sight ? t('시야 차단: {0}', t(terrainSight.sight.name)) : t('시야 개방')
              : sightFirst ? t('시야 목표점을 선택하세요.') : t('시야 시작점을 선택하세요.')}</p>
            {sightFirst && <Button type="button" className="reset-button" onClick={() => setSightPoints([])}>{t('시야 지우기')}</Button>}
          </section>}
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
              penActive={tool?.kind === 'pen'}
              onPen={() => activateTool(tool?.kind === 'pen' ? null : { kind: 'pen' })}
              pending={annotationPick}
              onSelect={selectAnnotation}
              onSave={saveAnnotation}
              onPick={(pick) => activateTool(pick ? { kind: 'annotation', pick } : null)}
              onRemove={(id) => {
                if (annotationPick) changeSurfaceTool(null);
                dispatch({ type: 'remove-annotation', id });
              }}
            />
          <Disclosure className="legend">
            <summary>{t('지형 범례')}</summary>
            <ul>
              {terrainKinds.map((kind) => (
                <li key={kind}><span className={`terrain-swatch ${kind}`} aria-hidden="true" />{t(kindNames[kind])}</li>
              ))}
            </ul>
          </Disclosure>
          <Disclosure className="legend">
            <summary id="workspace-help">{t('도움말')}</summary>
            <ul>
              <li>{t('영웅을 배치한 뒤 속성 패널에서 팀과 방향을 바꿀 수 있습니다.')}</li>
              <li>{t('Esc로 도구를 취소하거나 재생을 종료합니다.')}</li>
              <li>{t('Ctrl 또는 ⌘와 Z로 실행 취소하고, Shift를 함께 눌러 다시 실행합니다.')}</li>
              <li>{t('Vertactics는 Blizzard Entertainment와 제휴하지 않은 Overwatch 팬 프로젝트입니다.')}</li>
              <li><a href="about.html" target="_blank" rel="noopener">{t('서비스 소개')}</a></li>
            </ul>
          </Disclosure>
        </aside>
      </main>
    </div>
  );
};

export default Editor;
