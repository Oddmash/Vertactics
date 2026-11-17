import { Button, Input, Select } from '../ui/controls';
import { useLocale } from '../ui/locale';
import type { FormEvent } from 'react';
import { terrainKinds } from '../domain/map';
import type { MapDefinition, MapLayer, Terrain, WorldPoint } from '../domain/map';

type Props = {
  map: MapDefinition;
  selected: Terrain | undefined;
  selectedCount: number;
  undoable: boolean;
  redoable: boolean;
  onSave: (terrain: unknown) => void;
  onAdd: () => void;
  onDuplicate: (terrain: Terrain) => void;
  onRemove: (id: string) => void;
  onTransform: (id: string, transform: 'rotate' | 'snap') => void;
  onSaveLayer: (layer: MapLayer) => void;
  onDeleteLayer: (id: string) => void;
  onBulkRemove: () => void;
  onBulkDuplicate: () => void;
  onHistory: (direction: 'undo' | 'redo') => void;
};

const axisNames = ['X', 'Y', 'Z'] as const;
const vectorFields = [{ key: 'origin', label: '좌표' }, { key: 'size', label: '크기' }] as const;

const TerrainTools = ({ map, selected, selectedCount, undoable, redoable, onSave, onAdd, onDuplicate, onRemove, onHistory, onTransform, onSaveLayer, onDeleteLayer, onBulkRemove, onBulkDuplicate }: Props) => {
  const { t } = useLocale();
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const data = new FormData(event.currentTarget);
    const vector = (prefix: string): WorldPoint => [
      Number(data.get(prefix + 'X')), Number(data.get(prefix + 'Y')), Number(data.get(prefix + 'Z')),
    ];
    const property = (key: string) => {
      const value = data.get(key);
      return value === 'on' ? true : value === 'off' ? false : undefined;
    };
    onSave({
      id: selected.id,
      name: data.get('name'),
      kind: data.get('kind'),
      origin: vector('origin'),
      size: vector('size'),
      layerId: data.get('layer') || undefined,
      steps: Number(data.get('steps')),
      risesToward: data.get('rises'),
      walkable: property('walkable'),
      collision: property('collision'),
      blocksSight: property('blocksSight'),
      material: String(data.get('material') ?? '').trim() || undefined,
    });
  };

  return (
    <section className="hero-tools terrain-tools" aria-labelledby="terrain-tools-title">
      <h2 id="terrain-tools-title">{t('지도 편집')}</h2>
      <div className="hero-actions">
        <Button type="button" className="reset-button" onClick={onAdd}>{t('블록 추가')}</Button>
        <Button type="button" className="reset-button" disabled={!undoable} onClick={() => onHistory('undo')}>{t('지도 실행 취소')}</Button>
        <Button type="button" className="reset-button" disabled={!redoable} onClick={() => onHistory('redo')}>{t('지도 다시 실행')}</Button>
      </div>
      <fieldset className="edit-controls">
        <legend>{t('층 관리')}</legend>
        <form onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const name = new FormData(form).get('layer-name');
          if (typeof name !== 'string' || !name.trim()) return;
          onSaveLayer({ id: crypto.randomUUID(), name: name.trim() });
          form.reset();
        }}>
          <label>{t('새 층 이름') + ' '}<Input name="layer-name" required /></label>
          <Button type="submit" className="reset-button">{t('층 추가')}</Button>
        </form>
        {map.layers?.map((layer) => (
          <form key={`${layer.id}:${layer.name}`} aria-label={t(layer.name)} onSubmit={(event) => {
            event.preventDefault();
            const name = new FormData(event.currentTarget).get('layer-name');
            if (typeof name === 'string' && name.trim() && name.trim() !== layer.name) {
              onSaveLayer({ id: layer.id, name: name.trim() });
            }
          }}>
            <label>{t('층 이름') + ' '}<Input name="layer-name" defaultValue={layer.name} required /></label>
            <div className="hero-actions">
              <Button type="submit" className="reset-button">{t('층 이름 저장')}</Button>
              <Button type="button" className="reset-button" onClick={() => onDeleteLayer(layer.id)}>{t('층 삭제')}</Button>
            </div>
          </form>
        ))}
      </fieldset>
      {selectedCount > 1 && <div className="hero-actions">
        <p role="status">{selectedCount}{t('개 선택')}</p>
        <Button type="button" className="reset-button" onClick={onBulkDuplicate}>{t('선택 블록 복제')}</Button>
        <Button type="button" className="reset-button" onClick={onBulkRemove}>{t('선택 블록 삭제')}</Button>
      </div>}
      {selected && selectedCount === 1 && <>
        <form key={JSON.stringify(selected)} onSubmit={save}>
          <label>{t('블록 이름') + ' '}<Input name="name" required defaultValue={selected.name} /></label>
          <label>{t('지형 유형') + ' '}<Select name="kind" defaultValue={selected.kind}>
            {terrainKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
          </Select></label>
          {map.layers && <label>{t('층') + ' '}<Select name="layer" defaultValue={selected.layerId ?? ''}>
            <option value="">{t('공통 지형')}</option>
            {map.layers.map((layer) => <option key={layer.id} value={layer.id}>{t(layer.name)}</option>)}
          </Select></label>}
          {vectorFields.map(({ key, label }) => (
            <fieldset className="edit-controls" key={key}>
              <legend>{t(label)}</legend>
              {axisNames.map((axis, index) => (
                <label key={axis}>{axis} <Input name={key + axis} type="number" step="any"
                  min={key === 'size' ? 0.01 : undefined} required defaultValue={selected[key][index]} /></label>
              ))}
            </fieldset>
          ))}
          <fieldset className="edit-controls">
            <legend>{t('계단·경사로 설정')}</legend>
            <label>{t('디딤면 수') + ' '}<Input name="steps" type="number" min={2} max={64} required
              defaultValue={selected.kind === 'stairs' ? selected.steps : 5} /></label>
            <label>{t('상승 방향') + ' '}<Select name="rises" defaultValue={(selected.kind === 'stairs' || selected.kind === 'ramp') ? selected.risesToward : '+x'}>
              {['+x', '-x', '+z', '-z'].map((axis) => <option key={axis}>{axis}</option>)}
            </Select></label>
          </fieldset>
          <fieldset className="edit-controls terrain-properties">
            <legend>{t('지형 속성')}</legend>
            {[
              { key: 'walkable', label: t('이동 가능') },
              { key: 'collision', label: t('충돌') },
              { key: 'blocksSight', label: t('시야 차단') },
            ].map(({ key, label }) => {
              const value = selected[key as 'walkable' | 'collision' | 'blocksSight'];
              return <label key={key}>{label} <Select name={key} defaultValue={value === undefined ? '' : value ? 'on' : 'off'}>
                <option value="">{t('기본값')}</option><option value="on">{t('켜기')}</option><option value="off">{t('끄기')}</option>
              </Select></label>;
            })}
            <label>{t('재질 색상') + ' '}<Input name="material" pattern="#[0-9a-fA-F]{6}" defaultValue={selected.material ?? ''} /></label>
          </fieldset>
          <Button type="submit" className="reset-button">{t('블록 저장')}</Button>
        </form>
        <div className="hero-actions">
          <Button type="button" className="reset-button" onClick={() => onTransform(selected.id, 'rotate')}>{t('90° 회전')}</Button>
          <Button type="button" className="reset-button" onClick={() => onTransform(selected.id, 'snap')}>{t('격자에 맞추기')}</Button>
          <Button type="button" className="reset-button" onClick={() => onDuplicate(selected)}>{t('블록 복제')}</Button>
          <Button type="button" className="reset-button" onClick={() => onRemove(selected.id)}>{t('블록 삭제')}</Button>
        </div>
      </>}
    </section>
  );
};

export default TerrainTools;
