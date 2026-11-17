import type { FormEvent } from 'react';
import { terrainKinds } from '../domain/map';
import type { MapDefinition, MapLayer, Terrain, WorldPoint } from '../domain/map';

type Props = {
  map: MapDefinition;
  selected: Terrain | undefined;
  undoable: boolean;
  redoable: boolean;
  onSave: (terrain: unknown) => void;
  onAdd: () => void;
  onDuplicate: (terrain: Terrain) => void;
  onRemove: (id: string) => void;
  onTransform: (id: string, transform: 'rotate' | 'snap') => void;
  onSaveLayer: (layer: MapLayer) => void;
  onDeleteLayer: (id: string) => void;
  onHistory: (direction: 'undo' | 'redo') => void;
};

const axisNames = ['X', 'Y', 'Z'] as const;
const vectorFields = [{ key: 'origin', label: '좌표' }, { key: 'size', label: '크기' }] as const;

const TerrainTools = ({ map, selected, undoable, redoable, onSave, onAdd, onDuplicate, onRemove, onHistory, onTransform, onSaveLayer, onDeleteLayer }: Props) => {
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const data = new FormData(event.currentTarget);
    const vector = (prefix: string): WorldPoint => [
      Number(data.get(prefix + 'X')), Number(data.get(prefix + 'Y')), Number(data.get(prefix + 'Z')),
    ];
    onSave({
      id: selected.id,
      name: data.get('name'),
      kind: data.get('kind'),
      origin: vector('origin'),
      size: vector('size'),
      layerId: data.get('layer') || undefined,
      steps: Number(data.get('steps')),
      risesToward: data.get('rises'),
    });
  };

  return (
    <section className="hero-tools terrain-tools" aria-labelledby="terrain-tools-title">
      <h2 id="terrain-tools-title">지도 편집</h2>
      <div className="hero-actions">
        <button type="button" className="reset-button" onClick={onAdd}>블록 추가</button>
        <button type="button" className="reset-button" disabled={!undoable} onClick={() => onHistory('undo')}>지도 실행 취소</button>
        <button type="button" className="reset-button" disabled={!redoable} onClick={() => onHistory('redo')}>지도 다시 실행</button>
      </div>
      <fieldset className="edit-controls">
        <legend>층 관리</legend>
        <form onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const name = new FormData(form).get('layer-name');
          if (typeof name !== 'string' || !name.trim()) return;
          onSaveLayer({ id: crypto.randomUUID(), name: name.trim() });
          form.reset();
        }}>
          <label>새 층 이름 <input name="layer-name" required /></label>
          <button type="submit" className="reset-button">층 추가</button>
        </form>
        {map.layers?.map((layer) => (
          <form key={`${layer.id}:${layer.name}`} aria-label={layer.name} onSubmit={(event) => {
            event.preventDefault();
            const name = new FormData(event.currentTarget).get('layer-name');
            if (typeof name === 'string' && name.trim() && name.trim() !== layer.name) {
              onSaveLayer({ id: layer.id, name: name.trim() });
            }
          }}>
            <label>층 이름 <input name="layer-name" defaultValue={layer.name} required /></label>
            <div className="hero-actions">
              <button type="submit" className="reset-button">층 이름 저장</button>
              <button type="button" className="reset-button" onClick={() => onDeleteLayer(layer.id)}>층 삭제</button>
            </div>
          </form>
        ))}
      </fieldset>
      {selected && <>
        <form key={JSON.stringify(selected)} onSubmit={save}>
          <label>블록 이름 <input name="name" required defaultValue={selected.name} /></label>
          <label>지형 유형 <select name="kind" defaultValue={selected.kind}>
            {terrainKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
          </select></label>
          {map.layers && <label>층 <select name="layer" defaultValue={selected.layerId ?? ''}>
            <option value="">공통 지형</option>
            {map.layers.map((layer) => <option key={layer.id} value={layer.id}>{layer.name}</option>)}
          </select></label>}
          {vectorFields.map(({ key, label }) => (
            <fieldset className="edit-controls" key={key}>
              <legend>{label}</legend>
              {axisNames.map((axis, index) => (
                <label key={axis}>{axis} <input name={key + axis} type="number" step="any"
                  min={key === 'size' ? 0.01 : undefined} required defaultValue={selected[key][index]} /></label>
              ))}
            </fieldset>
          ))}
          <fieldset className="edit-controls">
            <legend>계단 설정</legend>
            <label>디딤면 수 <input name="steps" type="number" min={2} max={64} required
              defaultValue={selected.kind === 'stairs' ? selected.steps : 5} /></label>
            <label>상승 방향 <select name="rises" defaultValue={selected.kind === 'stairs' ? selected.risesToward : '+x'}>
              {['+x', '-x', '+z', '-z'].map((axis) => <option key={axis}>{axis}</option>)}
            </select></label>
          </fieldset>
          <button type="submit" className="reset-button">블록 저장</button>
        </form>
        <div className="hero-actions">
          <button type="button" className="reset-button" onClick={() => onTransform(selected.id, 'rotate')}>90° 회전</button>
          <button type="button" className="reset-button" onClick={() => onTransform(selected.id, 'snap')}>격자에 맞추기</button>
          <button type="button" className="reset-button" onClick={() => onDuplicate(selected)}>블록 복제</button>
          <button type="button" className="reset-button" onClick={() => onRemove(selected.id)}>블록 삭제</button>
        </div>
      </>}
    </section>
  );
};

export default TerrainTools;
