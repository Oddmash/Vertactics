import { useCallback, useMemo, useRef, useState } from 'react';
import type { Annotation } from '../domain/annotation';
import { rotateTerrain, snapTerrain } from '../domain/terrain-edit';
import TerrainTools from './terrain-tools';
import AnnotationTools from './annotation-tools';
import type { SurfacePick } from './annotation-tools';
import { mapBounds, terrainKinds, parseMap, topElevation, visibleTerrainForLayer } from '../domain/map';
import type { MapDefinition, MapLayer, Terrain, TerrainKind, WorldPoint } from '../domain/map';
import { createStrategy } from '../domain/strategy';
import type { Team } from '../domain/strategy';
import { createStrategyHistory, reduceStrategyHistory } from '../domain/strategy-history';
import type { StrategyAction, StrategyHistory } from '../domain/strategy-history';
import { maps } from '../map';
import type { ViewMode } from '../render/map-camera';
import MapViewport from '../render/map-viewport';
import HeroTools, { heroName, teamNames } from './hero-tools';
import type { SampleHero } from './hero-tools';

type EditTool = { kind: 'place'; heroId: SampleHero; team: Team } | { kind: 'move' | 'drag'; id: string };

const kindNames: Record<TerrainKind, string> = {
  floor: '바닥',
  wall: '벽',
  platform: '고지대',
  stairs: '계단',
};
const viewNames: Record<ViewMode, string> = { '2d': '2D 탑다운', '3d': '3D 원근' };
const viewportModes = ['2d', '3d'] as const;

const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 2,
}).format(value);
const formatElevation = (value: number) => `${value > 0 ? '+' : ''}${formatNumber(value)} u`;

const Editor = () => {
  const [catalogue, setCatalogue] = useState(maps);
  const [mapId, setMapId] = useState(maps[0]!.id);
  const map = catalogue.find((item) => item.id === mapId)!;
  const { min, max } = useMemo(() => mapBounds(map.terrain), [map]);
  const [importMessage, setImportMessage] = useState('');
  const [mapEditing, setMapEditing] = useState(false);
  const [mapMessage, setMapMessage] = useState('');
  const [mapHistory, setMapHistory] = useState<Record<string, { past: MapDefinition[]; future: MapDefinition[] }>>({});
  const timeline = Object.hasOwn(mapHistory, mapId) ? mapHistory[mapId]! : { past: [], future: [] };
  const importRequest = useRef(0);
  const [mode, setMode] = useState<ViewMode>('3d');
  const [reset, setReset] = useState(0);
  const [layerId, setLayerId] = useState('');
  const visibleTerrain = visibleTerrainForLayer(map.terrain, layerId);
  const [snap, setSnap] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showHeroes, setShowHeroes] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [tool, setHeroTool] = useState<EditTool | null>(null);
  const [dragPreview, setDragPreview] = useState<WorldPoint | null>(null);
  const [annotationPick, setAnnotationPick] = useState<SurfacePick | null>(null);
  const [annotationId, setAnnotationId] = useState<string | null>(null);
  const setTool = useCallback((next: EditTool | null) => {
    setAnnotationPick(null);
    setDragPreview(null);
    setHeroTool(next);
  }, []);
  const initialHistory = useMemo(() => createStrategyHistory(createStrategy('local-draft', mapId, '새 전략')), [mapId]);
  const [histories, setHistories] = useState<Record<string, StrategyHistory>>({});
  const history = Object.hasOwn(histories, mapId) ? histories[mapId]! : initialHistory;
  const dispatch = useCallback((action: StrategyAction) => setHistories((current) => ({
    ...current,
    [mapId]: reduceStrategyHistory(Object.hasOwn(current, mapId) ? current[mapId]! : initialHistory, action),
  })), [initialHistory, mapId]);
  const switchMap = (id: string) => {
    setTool(null);
    setMapMessage('');
    setLayerId('');
    setSelectedId(null);
    setSelectedHeroId(null);
    setAnnotationId(null);
    setMapId(id);
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
    setImportMessage('');
  };
  const replaceMap = (next: MapDefinition) => {
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
      schemaVersion: 1, id, name: '새 지도', metadata: { verification: 'synthetic' },
      terrain: [{ id: 'base', name: '기본 바닥', kind: 'floor', origin: [-8, -1, -8], size: [16, 1, 16] }],
    });
    setCatalogue((current) => [...current, created]);
    switchMap(id);
    setMapEditing(true);
  };
  const copyTerrain = (terrain?: Terrain) => {
    const id = crypto.randomUUID();
    const item = terrain
      ? { ...terrain, id, name: `${terrain.name} 복제`, origin: [terrain.origin[0] + 1, terrain.origin[1], terrain.origin[2] + 1] }
      : { id, name: '새 블록', kind: 'platform', origin: [-1, 0, -1], size: [2, 1, 2], layerId: layerId || undefined };
    updateTerrain([...map.terrain, item], id);
  };
  const { heroes, annotations } = history.present;
  const selected = visibleTerrain.find(({ id }) => id === selectedId);
  const selectedHero = heroes.find(({ id }) => id === selectedHeroId);

  const selectTerrain = (id: string | null) => {
    setSelectedId(id);
    setSelectedHeroId(null);
  };

  const selectHero = (id: string) => {
    setSelectedId(null);
    setSelectedHeroId(id);
  };

  const selectAnnotation = (id: string) => {
    setTool(null);
    setAnnotationId(id);
  };

  const saveAnnotation = (annotation: Annotation) => {
    dispatch({ type: 'set-annotation', annotation });
    selectAnnotation(annotation.id);
  };

  const finishDrag = useCallback((position: WorldPoint | null) => {
    if (tool?.kind !== 'drag') return;
    if (position && !locked) dispatch({ type: 'update', id: tool.id, patch: { position } });
    setTool(null);
  }, [dispatch, locked, setTool, tool]);

  const editSurface = (position: WorldPoint) => {
    if (locked) return;
    if (annotationPick) { annotationPick.apply(position); return; }
    if (!tool) return;
    if (tool.kind === 'place') {
      const id = crypto.randomUUID();
      dispatch({ type: 'place', hero: { id, heroId: tool.heroId, team: tool.team, position, yaw: 0 } });
      selectHero(id);
    } else {
      dispatch({ type: 'update', id: tool.id, patch: { position } });
      selectHero(tool.id);
    }
    setTool(null);
  };

  return (
    <div className="editor" onKeyDown={(event) => {
      if (event.key === 'Escape' && (tool || annotationPick)) {
        event.preventDefault();
        setTool(null);
        return;
      }
      if (mapEditing || locked || event.defaultPrevented || event.altKey ||
        !(event.ctrlKey || event.metaKey) ||
        (event.target instanceof Element && event.target.closest('input:not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable]'))) return;
      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;
      event.preventDefault();
      setTool(null);
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
            setTool(null);
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
                  aria-pressed={selectedId === terrain.id}
                  onClick={() => { setTool(null); selectTerrain(terrain.id); }}
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
            pendingMessage={tool?.kind === 'place' ? '배치할 지면을 클릭하세요.' : tool?.kind === 'drag' ? '지도에서 누른 채 끌어 이동하세요.' : tool ? '이동할 지면을 클릭하세요.' : ''}
            canUndo={!locked && history.past.length > 0}
            canRedo={!locked && history.future.length > 0}
            onPlace={(heroId, team) => setTool({ kind: 'place', heroId, team })}
            onSelect={(id) => { setTool(null); selectHero(id); }}
            onUndo={() => { setTool(null); dispatch({ type: 'undo' }); }}
            onRedo={() => { setTool(null); dispatch({ type: 'redo' }); }}
            onCancel={() => setTool(null)}
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
                    aria-pressed={mode === view}
                    onClick={() => setMode(view)}
                  >
                    {view.toUpperCase()}
                  </button>
                ))}
              </div>
              <button className="reset-button" type="button" onClick={() => setReset((value) => value + 1)}>
                시점 초기화
              </button>
            </div>
          </div>
          <div className="view-options" role="group" aria-label="편집 및 표시 설정">
            {map.layers && <label>표시 층 <select value={layerId} onChange={(event) => {
              setLayerId(event.target.value);
              selectTerrain(null);
            }}>
              <option value="">모든 층</option>
              {map.layers.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
            </select></label>}
            <label><input type="checkbox" checked={snap} onChange={(event) => setSnap(event.target.checked)} /> 격자 스냅</label>
            <label><input type="checkbox" checked={locked} onChange={(event) => {
              setTool(null);
              setLocked(event.target.checked);
            }} /> 편집 잠금</label>
            <label><input type="checkbox" checked={showHeroes} onChange={(event) => {
              setTool(null);
              setShowHeroes(event.target.checked);
            }} /> 영웅 표시</label>
            <label><input type="checkbox" checked={showAnnotations} onChange={(event) => {
              setTool(null);
              setShowAnnotations(event.target.checked);
            }} /> 마커 표시</label>
          </div>
          <div className="viewport" data-testid="viewport"
            onPointerCancel={() => { if (tool?.kind === 'drag') setTool(null); }}
            onPointerLeave={(event) => { if (tool?.kind === 'drag' && event.buttons === 1) setTool(null); }}
          >
            <MapViewport
              key={mapId}
              map={map}
              layerId={layerId}
              mode={mode}
              reset={reset}
              selectedId={selectedId}
              heroes={!mapEditing && showHeroes ? heroes.map((hero) =>
                tool?.kind === 'drag' && hero.id === tool.id && dragPreview ? { ...hero, position: dragPreview } : hero
              ) : []}
              snap={snap}
              selectedHeroId={selectedHeroId}
              onSelect={selectTerrain}
              onSelectHero={selectHero}
              annotations={!mapEditing && showAnnotations ? annotations : []}
              selectedAnnotationId={annotationId}
              onEditSurface={!locked && ((tool && tool.kind !== 'drag') || annotationPick) ? editSurface : undefined}
              onDragSurface={!locked && tool?.kind === 'drag' ? setDragPreview : undefined}
              onDropSurface={!locked && tool?.kind === 'drag' ? finishDrag : undefined}
            />
            <span className="view-label" aria-hidden="true">{viewNames[mode]}</span>
            {mode === '2d' && <span className="north-label" aria-label="위쪽은 북쪽">↑ N</span>}
          </div>
          <footer className="viewport-footer">
            <span>{mode === '2d' ? '드래그로 이동' : '드래그로 회전 · 우클릭 드래그로 이동'}</span>
            <span>휠 또는 핀치로 확대·축소</span>
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
                <fieldset className="hero-actions edit-controls" disabled={locked || !showHeroes}>
                  <button className="reset-button" type="button" onClick={() => setTool({ kind: 'move', id: selectedHero.id })}>이동</button>
                  <button className="reset-button" type="button" onClick={() => setTool({ kind: 'drag', id: selectedHero.id })}>드래그 이동</button>
                  <button className="reset-button" type="button" onClick={() => dispatch({
                    type: 'update', id: selectedHero.id, patch: { yaw: (selectedHero.yaw + 45) % 360 },
                  })}>45° 회전</button>
                  <button className="reset-button" type="button" onClick={() => dispatch({
                    type: 'update', id: selectedHero.id, patch: { team: selectedHero.team === 'attack' ? 'defense' : 'attack' },
                  })}>팀 전환</button>
                  <button className="reset-button" type="button" onClick={() => {
                    setTool(null);
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
          {mapEditing ? <>
            <TerrainTools
              map={map}
              selected={selected}
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
              onRemove={(id) => updateTerrain(map.terrain.filter((item) => item.id !== id), null)}
              onHistory={moveMapHistory}
            />
            {mapMessage && <p role="status">{mapMessage}</p>}
          </> : <AnnotationTools
            items={annotations}
            locked={locked || !showAnnotations}
            selected={annotations.find((item) => item.id === annotationId)}
            pending={annotationPick}
            onSelect={selectAnnotation}
            onSave={saveAnnotation}
            onPick={(pick) => { setTool(null); setAnnotationPick(pick); }}
            onRemove={(id) => { setAnnotationPick(null); dispatch({ type: 'remove-annotation', id }); }}
          />}
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
