import { useState } from 'react';
import { mapBounds, terrainKinds, topElevation } from '../domain/map';
import type { TerrainKind } from '../domain/map';
import { sampleMap } from '../map';
import type { ViewMode } from '../render/map-camera';
import MapViewport from '../render/map-viewport';

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
  const selected = sampleMap.terrain.find(({ id }) => id === selectedId);

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
                  onClick={() => setSelectedId(terrain.id)}
                >
                  <span className={`terrain-swatch ${terrain.kind}`} aria-hidden="true" />
                  <span>{terrain.name}</span>
                  <small>{formatElevation(topElevation(terrain))}</small>
                </button>
              </li>
            ))}
          </ul>
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
            <MapViewport map={sampleMap} mode={mode} reset={reset} selectedId={selectedId} onSelect={setSelectedId} />
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
            {selected ? (
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
