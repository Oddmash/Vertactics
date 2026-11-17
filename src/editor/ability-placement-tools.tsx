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
  const selected = items.find((item) => item.id === selectedId);

  return (
    <section className="hero-tools" aria-labelledby="placed-abilities-title">
      <h2 id="placed-abilities-title">배치한 능력</h2>
      {pending && <div className="pending-edit">
        <p role="status">{pending}</p>
        <button type="button" className="reset-button" onClick={onCancel}>능력 배치 취소</button>
      </div>}
      {items.length > 0 && <ul className="terrain-list">
        {items.map((item) => {
          const abilityName = getHero(item.heroId)?.abilities.find(({ id }) => id === item.abilityId)?.name ?? item.abilityId;
          return <li key={item.id}>
            <button type="button" className="terrain-button" aria-pressed={item.id === selectedId}
              onClick={() => onSelect(item.id)}>
              <span>{abilityName}</span><small>{item.visible ? '표시 중' : '숨김'}</small>
            </button>
          </li>;
        })}
      </ul>}
      {selected && <>
        <dl>
          <div><dt>능력 좌표 (X, Y, Z)</dt><dd>{selected.position.map((axis) => Number(axis.toFixed(2))).join(', ')}</dd></div>
          <div><dt>능력 방향</dt><dd>{(selected.heading + selected.direction + 360) % 360}°</dd></div>
          {selected.shape === 'area' && <div><dt>지속 시간</dt>
            <dd>{selected.durationSeconds === undefined ? '미설정' : `${selected.durationSeconds}초`}</dd>
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
            <label>배치한 영역 지속 시간 (초) <input name="duration" type="number"
              min={minAbilityDurationSeconds} max={maxAbilityDurationSeconds} step="any" defaultValue={selected.durationSeconds}
            /></label>
            <button type="submit" className="reset-button">지속 시간 적용</button>
          </fieldset>
        </form>}
        <fieldset className="hero-actions edit-controls" disabled={locked}>
          <button type="button" className="reset-button" onClick={() => onMove(selected)}>능력 이동</button>
          <button type="button" className="reset-button"
            onClick={() => onUpdate({ ...selected, heading: (selected.heading + 45) % 360 })}>능력 45° 회전</button>
          <button type="button" className="reset-button"
            onClick={() => onUpdate({ ...selected, visible: !selected.visible })}>
            {selected.visible ? '능력 숨기기' : '능력 표시하기'}
          </button>
          <button type="button" className="reset-button" onClick={() => onRemove(selected.id)}>능력 삭제</button>
        </fieldset>
      </>}
    </section>
  );
};

export default AbilityPlacementTools;
