import { Button, Input } from '../ui/controls';
import { useLocale } from '../ui/locale';
import AbilityRangeReferenceForm from './ability-range-reference-form';
import { isAbilityDuration, maxAbilityDurationSeconds, minAbilityDurationSeconds } from '../domain/ability-preview';
import type { AbilityPlacement } from '../domain/ability-preview';
import { getHero } from '../domain/hero-catalogue';

type Props = {
  items: AbilityPlacement[];
  selectedId: string | null;
  locked: boolean;
  pending: string | undefined;
  onSelect: (id: string) => void;
  onMove: (ability: AbilityPlacement) => void;
  onUpdate: (ability: AbilityPlacement) => void;
  onRemove: (id: string) => void;
  onCancel: () => void;
};

const AbilityPlacementTools = ({ items, selectedId, locked, pending, onSelect, onMove, onUpdate, onRemove, onCancel }: Props) => {
  const { t } = useLocale();
  const selected = items.find((item) => item.id === selectedId);

  return (
    <section className="hero-tools" aria-labelledby="placed-abilities-title">
      <h2 id="placed-abilities-title">{t('배치한 능력')}</h2>
      {pending && <div className="pending-edit">
        <p role="status">{t(pending)}</p>
        <Button type="button" className="reset-button" onClick={onCancel}>{t('능력 배치 취소')}</Button>
      </div>}
      {items.length > 0 && <ul className="terrain-list">
        {items.map((item) => {
          const abilityName = getHero(item.heroId)?.abilities.find(({ id }) => id === item.abilityId)?.name ?? item.abilityId;
          return <li key={item.id}>
            <Button type="button" className="terrain-button" aria-pressed={item.id === selectedId}
              onClick={() => onSelect(item.id)}>
              <span>{abilityName}</span><small>{item.visible ? t('표시 중') : t('숨김')}</small>
            </Button>
          </li>;
        })}
      </ul>}
      {selected && <>
        <dl>
          <div><dt>{t('능력 방향')}</dt><dd>{(selected.heading + selected.direction + 360) % 360}°</dd></div>
          {selected.shape === 'area' && <div><dt>{t('지속 시간')}</dt>
            <dd>{selected.durationSeconds === undefined ? t('미설정') : t('{0}초', selected.durationSeconds)}</dd>
          </div>}
        </dl>
        {selected.shape === 'area' && <form key={JSON.stringify([selected.id, selected.durationSeconds])} onSubmit={(event) => {
          event.preventDefault();
          const duration = new FormData(event.currentTarget).get('duration');
          const durationSeconds = duration ? Number(duration) : undefined;
          if (durationSeconds === selected.durationSeconds ||
            (durationSeconds !== undefined && !isAbilityDuration(durationSeconds))) return;
          onUpdate({ ...selected, durationSeconds });
        }}>
          <fieldset className="edit-controls" disabled={locked}>
            <label>{t('배치한 영역 지속 시간 (초)') + ' '}<Input name="duration" type="number"
              min={minAbilityDurationSeconds} max={maxAbilityDurationSeconds} step="any" defaultValue={selected.durationSeconds}
            /></label>
            <Button type="submit" className="reset-button">{t('지속 시간 적용')}</Button>
          </fieldset>
        </form>}
        <fieldset className="hero-actions edit-controls" disabled={locked}>
          <Button type="button" className="reset-button" onClick={() => onMove(selected)}>{t('능력 이동')}</Button>
          <Button type="button" className="reset-button"
            onClick={() => onUpdate({ ...selected, heading: (selected.heading + 45) % 360 })}>{t('능력 45° 회전')}</Button>
          <Button type="button" className="reset-button"
            onClick={() => onUpdate({ ...selected, visible: !selected.visible })}>
            {selected.visible ? t('능력 숨기기') : t('능력 표시하기')}
          </Button>
          <Button type="button" className="reset-button" onClick={() => onRemove(selected.id)}>{t('능력 삭제')}</Button>
        </fieldset>
        <AbilityRangeReferenceForm key={selected.id} ability={selected} locked={locked}
          onReference={(rangeReference) => onUpdate({ ...selected, rangeReference })}
        />
      </>}
    </section>
  );
};

export default AbilityPlacementTools;
