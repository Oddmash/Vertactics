import { useReducer, useState } from 'react';
import { mapBounds, terrainKinds, topElevation } from '../domain/map';
import type { TerrainKind, WorldPoint } from '../domain/map';
import { createStrategy } from '../domain/strategy';
import type { Team } from '../domain/strategy';
import { createStrategyHistory, reduceStrategyHistory } from '../domain/strategy-history';
import { sampleMap } from '../map';
import type { ViewMode } from '../render/map-camera';
import MapViewport from '../render/map-viewport';
import HeroTools, { heroName, teamNames } from './hero-tools';
import type { SampleHero } from './hero-tools';

type EditTool = { kind: 'place'; heroId: SampleHero; team: Team } | { kind: 'move'; id: string };

const kindNames: Record<TerrainKind, string> = {
  floor: '바닥',
  wall: '벽',
  platform: '고지대',
  stairs: '계단',
};
const viewNames: Record<ViewMode, string> = { '2d': '2D 탑다운', '3d': '3D 원근' };
const viewportModes = ['2d', '3d'] as const;
const { min, max } = mapBounds(sampleMap.terrain);

const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 2,
}).format(value);
const formatElevation = (value: number) => `${value > 0 ? '+' : ''}${formatNumber(value)} u`;

const Editor = () => {
  const [mode, setMode] = useState<ViewMode>('3d');
  const [reset, setReset] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [tool, setTool] = useState<EditTool | null>(null);
  const [history, dispatch] = useReducer(reduceStrategyHistory, sampleMap.id, (mapId) =>
    createStrategyHistory(createStrategy('local-draft', mapId, '새 전략')));
  const { heroes } = history.present;
  const selected = sampleMap.terrain.find(({ id }) => id === selectedId);
  const selectedHero = heroes.find(({ id }) => id === selectedHeroId);

  const selectTerrain = (id: string | null) => {
    setSelectedId(id);
    setSelectedHeroId(null);
  };

  const selectHero = (id: string) => {
    setSelectedId(null);
    setSelectedHeroId(id);
  };

  const editSurface = (position: WorldPoint) => {
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
    <div className="editor">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">V</span>
          Vertactics
        </div>
      </header>
      <main className="workspace">
        <aside className="terrain-panel panel" aria-labelledby="terrain-title">
          <div className="panel-heading">
            <h2 id="terrain-title">지형 목록</h2>
            <span className="count">{sampleMap.terrain.length}</span>
          </div>
          <ul className="terrain-list">
            {sampleMap.terrain.map((terrain) => (
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
          <HeroTools
            heroes={heroes}
            selectedId={selectedHeroId}
            pendingMessage={tool?.kind === 'place' ? '배치할 지면을 클릭하세요.' : tool ? '이동할 지면을 클릭하세요.' : ''}
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            onPlace={(heroId, team) => setTool({ kind: 'place', heroId, team })}
            onSelect={(id) => { setTool(null); selectHero(id); }}
            onUndo={() => { setTool(null); dispatch({ type: 'undo' }); }}
            onRedo={() => { setTool(null); dispatch({ type: 'redo' }); }}
            onCancel={() => setTool(null)}
          />
        </aside>
        <section className="view-panel panel" aria-labelledby="view-title">
          <div className="viewport-toolbar">
            <div>
              <h1 id="view-title">{sampleMap.name}</h1>
              <p className="world-size">{max[0] - min[0]} × {max[2] - min[2]} u</p>
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
          <div className="viewport" data-testid="viewport">
            <MapViewport
              map={sampleMap}
              mode={mode}
              reset={reset}
              selectedId={selectedId}
              heroes={heroes}
              selectedHeroId={selectedHeroId}
              onSelect={selectTerrain}
              onSelectHero={selectHero}
              onEditSurface={tool ? editSurface : undefined}
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
                </dl>
                <div className="hero-actions">
                  <button className="reset-button" type="button" onClick={() => setTool({ kind: 'move', id: selectedHero.id })}>이동</button>
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
                </div>
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
