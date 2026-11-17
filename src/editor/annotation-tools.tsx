import { useState } from 'react';
import { annotationKinds, annotationPointCount } from '../domain/annotation';
import type { Annotation, AnnotationKind } from '../domain/annotation';
import type { WorldPoint } from '../domain/map';

export type SurfacePick = { hint: string; apply: (position: WorldPoint) => void };

const names: Record<AnnotationKind, string> = {
  route: '이동 경로', line: '선', circle: '원', area: '영역', note: '메모',
};

type Props = {
  items: Annotation[];
  locked: boolean;
  selected: Annotation | undefined;
  pending: SurfacePick | null;
  onSelect: (id: string) => void;
  onPick: (pick: SurfacePick | null) => void;
  onSave: (item: Annotation) => void;
  onRemove: (id: string) => void;
};

const AnnotationTools = ({ items, locked, selected, pending, onSelect, onPick, onSave, onRemove }: Props) => {
  const [kind, setKind] = useState<AnnotationKind>('route');
  const start = () => onPick({
    hint: '첫 지점을 클릭하세요.',
    apply: (first) => {
      const item = { id: crypto.randomUUID(), kind, label: names[kind], points: [first] };
      if (annotationPointCount(kind) === 1) onSave(item);
      else onPick({ hint: '두 번째 지점을 클릭하세요.', apply: (second) => onSave({ ...item, points: [first, second] }) });
    },
  });

  return (
    <section className="hero-tools annotation-tools" aria-labelledby="annotation-title">
      <h2 id="annotation-title">전술 마커</h2>
      <fieldset className="edit-controls" disabled={locked}>
      <label>유형 <select value={kind} onChange={(event) => {
        const value = annotationKinds.find((item) => item === event.target.value);
        if (value) setKind(value);
      }}>
        {annotationKinds.map((value) => <option key={value} value={value}>{names[value]}</option>)}
      </select></label>
      <button type="button" className="reset-button" onClick={start}>마커 그리기</button>
      </fieldset>
      {pending && <div className="pending-edit">
        <p role="status">{pending.hint}</p>
        <button type="button" className="reset-button" onClick={() => onPick(null)}>그리기 취소</button>
      </div>}
      {items.length > 0 && <ul className="terrain-list" aria-label="배치한 마커">
        {items.map((item) => (
          <li key={item.id}><button type="button" className="terrain-button" aria-pressed={selected?.id === item.id}
            onClick={() => onSelect(item.id)}>
            <span className="terrain-swatch annotation-swatch" aria-hidden="true" />
            <span>{item.label}</span><small>{names[item.kind]}</small>
          </button></li>
        ))}
      </ul>}
      {selected && <fieldset className="annotation-properties edit-controls" disabled={locked}>
        <form key={`${selected.id}:${selected.label}`} onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get('label');
          if (typeof value === 'string' && value.trim() && value.trim() !== selected.label) {
            onSave({ ...selected, label: value.trim() });
          }
        }}>
          <label>이름 <input name="label" maxLength={80} defaultValue={selected.label} required /></label>
          <button type="submit" className="reset-button">이름 저장</button>
        </form>
        <ol aria-label="마커 지점">
          {selected.points.map(([x, y, z], index) => (
            <li key={index}>
              <span>{[x, y, z].map((value) => Number(value.toFixed(2))).join(', ')}</span>
              <div className="hero-actions">
                <button type="button" className="reset-button" onClick={() => onPick({
                  hint: '이동할 지점을 클릭하세요.',
                  apply: (position) => onSave({ ...selected, points: selected.points.map((point, offset) => offset === index ? position : point) }),
                })}>지점 {index + 1} 이동</button>
                {selected.kind === 'route' && selected.points.length > 2 &&
                  <button type="button" className="reset-button" onClick={() =>
                    onSave({ ...selected, points: selected.points.filter((_, offset) => offset !== index) })
                  }>지점 {index + 1} 삭제</button>}
              </div>
            </li>
          ))}
        </ol>
        <div className="hero-actions">
          {selected.kind === 'route' && selected.points.length < 64 &&
            <button type="button" className="reset-button" onClick={() => onPick({
              hint: '경로의 다음 지점을 클릭하세요.',
              apply: (position) => onSave({ ...selected, points: [...selected.points, position] }),
            })}>지점 추가</button>}
          <button type="button" className="reset-button" onClick={() => onRemove(selected.id)}>마커 삭제</button>
        </div>
      </fieldset>}
    </section>
  );
};

export default AnnotationTools;
