import { Button, Input, Select } from '../ui/controls';
import { useLocale } from '../ui/locale';
import { useState } from 'react';
import { measureRoute } from '../domain/measurement';
import { annotationKinds, annotationPointCount } from '../domain/annotation';
import type { Annotation, AnnotationKind } from '../domain/annotation';
import type { WorldPoint } from '../domain/map';

export type SurfacePick = { hint: string; apply: (position: WorldPoint) => void };

const names: Record<AnnotationKind, string> = {
  route: '이동 경로', line: '선', circle: '원', area: '영역', note: '메모', pen: '펜',
};

type Props = {
  items: Annotation[];
  locked: boolean;
  selected: Annotation | undefined;
  pending: SurfacePick | null;
  penActive: boolean;
  onPen: () => void;
  onSelect: (id: string) => void;
  onPick: (pick: SurfacePick | null) => void;
  onSave: (item: Annotation) => void;
  onRemove: (id: string) => void;
};

const AnnotationTools = ({ items, locked, selected, pending, penActive, onPen, onSelect, onPick, onSave, onRemove }: Props) => {
  const { t } = useLocale();
  const routeLength = selected?.kind === 'route' ? measureRoute(selected.points) : undefined;
  const [kind, setKind] = useState<AnnotationKind>('route');
  const start = (kind: AnnotationKind) => onPick({
    hint: '첫 지점을 클릭하세요.',
    apply: (first) => {
      const item = { id: crypto.randomUUID(), kind, label: t(names[kind]), points: [first] };
      if (annotationPointCount(kind) === 1) onSave(item);
      else onPick({ hint: '두 번째 지점을 클릭하세요.', apply: (second) => onSave({ ...item, points: [first, second] }) });
    },
  });

  return (
    <section className="hero-tools annotation-tools" aria-labelledby="annotation-title">
      <h2 id="annotation-title" tabIndex={-1}>{t('전술 마커')}</h2>
      <fieldset className="edit-controls" disabled={locked}>
      <label>{t('유형') + ' '}<Select value={kind} onChange={(event) => {
        const value = annotationKinds.find((item) => item === event.target.value);
        if (value) setKind(value);
      }}>
        {annotationKinds.filter((value) => value !== 'pen').map((value) => <option key={value} value={value}>{t(names[value])}</option>)}
      </Select></label>
      <div className="marker-actions">
        <Button type="button" className="reset-button" aria-pressed={penActive} onClick={onPen}>{t('펜')}</Button>
        <Button type="button" className="reset-button" onClick={() => start('line')}>{t('두 점으로 직선')}</Button>
      </div>
      <Button type="button" className="reset-button" onClick={() => start(kind)}>{t('마커 그리기')}</Button>
      </fieldset>
      {pending && <div className="pending-edit">
        <p role="status">{t(pending.hint)}</p>
        <Button type="button" className="reset-button" onClick={() => onPick(null)}>{t('그리기 취소')}</Button>
      </div>}
      {items.length > 0 && <ul className="terrain-list" aria-label={t('배치한 마커')}>
        {items.map((item) => (
          <li key={item.id}><Button type="button" className="terrain-button" aria-pressed={selected?.id === item.id}
            onClick={() => onSelect(item.id)}>
            <span className="terrain-swatch annotation-swatch" aria-hidden="true" />
            <span>{item.label}</span><small>{t(names[item.kind])}</small>
          </Button></li>
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
          <label>{t('이름') + ' '}<Input name="label" maxLength={80} defaultValue={selected.label} required /></label>
          <Button type="submit" className="reset-button">{t('이름 저장')}</Button>
        </form>
        {routeLength && <dl aria-label={t('경로 거리')}>
          <div><dt>{t('수평 경로 길이')}</dt><dd>{Number(routeLength.horizontal.toFixed(2))} u</dd></div>
          <div><dt>{t('3D 경로 길이')}</dt><dd>{Number(routeLength.distance.toFixed(2))} u</dd></div>
        </dl>}
        {selected.kind !== 'pen' && <ol aria-label={t('마커 지점')}>
          {selected.points.map((_, index) => (
            <li key={index}>
              <span>{t('지점')} {index + 1}</span>
              <div className="hero-actions">
                <Button type="button" className="reset-button" onClick={() => onPick({
                  hint: '이동할 지점을 클릭하세요.',
                  apply: (position) => onSave({ ...selected, points: selected.points.map((point, offset) => offset === index ? position : point) }),
                })}>{t('지점') + ' '}{index + 1}{' ' + t('이동')}</Button>
                {selected.kind === 'route' && selected.points.length > 2 &&
                  <Button type="button" className="reset-button" onClick={() =>
                    onSave({ ...selected, points: selected.points.filter((_, offset) => offset !== index) })
                  }>{t('지점') + ' '}{index + 1}{' ' + t('삭제')}</Button>}
              </div>
            </li>
          ))}
        </ol>}
        <div className="hero-actions">
          {selected.kind === 'route' && selected.points.length < 64 &&
            <Button type="button" className="reset-button" onClick={() => onPick({
              hint: '경로의 다음 지점을 클릭하세요.',
              apply: (position) => onSave({ ...selected, points: [...selected.points, position] }),
            })}>{t('지점 추가')}</Button>}
          <Button type="button" className="reset-button" onClick={() => onRemove(selected.id)}>{t('마커 삭제')}</Button>
        </div>
      </fieldset>}
    </section>
  );
};

export default AnnotationTools;
