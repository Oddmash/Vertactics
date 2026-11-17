import { Button, Input, Select } from '../ui/controls';
import { useLocale } from '../ui/locale';
import { useState } from 'react';
import type { StrategyDocument } from '../domain/strategy';
import type { StrategyPhase } from '../domain/strategy-timeline';
import { getHero } from '../domain/hero-catalogue';

type Props = {
  strategy: StrategyDocument;
  locked: boolean;
  onChange: (timeline: StrategyPhase[]) => void;
};

const readMs = (data: FormData, name: string) => Math.round(Number(data.get(name)) * 1000);

const StrategyTimelineTools = ({ strategy, locked, onChange }: Props) => {
  const { t } = useLocale();
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('');
  const { timeline, heroes, abilities } = strategy;
  const abilityLabels = new Map(abilities.map(({ id, heroId, abilityId }, index) => {
    const name = getHero(heroId)?.abilities.find((ability) => ability.id === abilityId)?.name ?? abilityId;
    return [id, `${name} · ${index + 1}`];
  }));
  const selected = timeline.find(({ id }) => id === selectedId) ?? timeline[0];

  const update = (next: StrategyPhase) => {
    onChange(timeline.map((phase) => phase.id === next.id ? next : phase));
    setMessage('');
  };

  return (
    <section className="hero-tools" aria-labelledby="timeline-title">
      <h2 id="timeline-title">{t('전술 단계')}</h2>
      <Button type="button" className="reset-button" disabled={locked} onClick={() => {
        const id = crypto.randomUUID();
        onChange([...timeline, { id, label: t('단계 {0}', timeline.length + 1), durationMs: 5000, poses: [], events: [] }]);
        setSelectedId(id);
        setMessage('');
      }}>{t('단계 추가')}</Button>
      {selected && <>
        <label>{t('현재 단계') + ' '}<Select aria-label={t('현재 단계')} value={selected.id} onChange={(event) => {
          setSelectedId(event.target.value);
          setMessage('');
        }}>
          {timeline.map((phase, index) => <option key={phase.id} value={phase.id}>{index + 1}. {phase.label}</option>)}
        </Select></label>
        <fieldset className="edit-controls" disabled={locked}>
          <form key={JSON.stringify([selected.id, selected.label, selected.durationMs])} onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const label = String(data.get('label')).trim();
            const durationMs = readMs(data, 'duration');
            if (!label || !Number.isSafeInteger(durationMs) || durationMs < 1) return;
            if (selected.events.some((item) => item.offsetMs + item.durationMs > durationMs)) {
              setMessage('단계 길이는 배치한 능력 이벤트보다 짧을 수 없습니다.');
              return;
            }
            update({ ...selected, label, durationMs });
          }}>
            <label>{t('단계 이름') + ' '}<Input name="label" defaultValue={selected.label} maxLength={80} required /></label>
            <label>{t('단계 길이 (초)') + ' '}<Input name="duration" type="number" min="0.001" max="86400" step="0.001"
              defaultValue={selected.durationMs / 1000} required /></label>
            <Button type="submit" className="reset-button">{t('단계 설정 적용')}</Button>
          </form>
          <Button type="button" className="reset-button" disabled={heroes.length === 0} onClick={() => update({
            ...selected, poses: heroes.map(({ id, position, yaw }) => ({ heroPlacementId: id, position, yaw })),
          })}>{t('현재 영웅 위치 기록')}</Button>
          <p>{t('기록한 영웅') + ' '}{selected.poses.length}{t('명')}</p>
          {abilities.length > 0 && <form key={selected.id} onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const abilityPlacementId = data.get('ability');
            const offsetMs = readMs(data, 'offset');
            const durationMs = readMs(data, 'event-duration');
            if (typeof abilityPlacementId !== 'string' || !Number.isSafeInteger(offsetMs) ||
              !Number.isSafeInteger(durationMs) || offsetMs < 0 || durationMs < 1) return;
            if (durationMs > selected.durationMs - offsetMs) {
              setMessage('능력 이벤트의 시작과 종료는 단계 안에 있어야 합니다.');
              return;
            }
            update({ ...selected, events: [...selected.events, {
              id: crypto.randomUUID(), abilityPlacementId, offsetMs, durationMs,
            }] });
          }}>
            <label>{t('배치한 능력') + ' '}<Select name="ability" aria-label={t('이벤트에 사용할 능력')} required>
              {Array.from(abilityLabels, ([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Select></label>
            <label>{t('이벤트 시작 (초)') + ' '}<Input name="offset" type="number" min="0" step="0.001" defaultValue="0" required /></label>
            <label>{t('이벤트 길이 (초)') + ' '}<Input name="event-duration" type="number" min="0.001" step="0.001" defaultValue="1" required /></label>
            <Button type="submit" className="reset-button">{t('능력 이벤트 추가')}</Button>
          </form>}
          {selected.events.length > 0 && <ul aria-label={t('단계 능력 이벤트')}>
            {selected.events.map((event, index) => <li key={event.id}>
              <span>{abilityLabels.get(event.abilityPlacementId)} · {event.offsetMs / 1000}{t('초 ·') + ' '}{event.durationMs / 1000}{t('초 동안')}</span>
              <Button type="button" className="reset-button"
                onClick={() => update({ ...selected, events: selected.events.filter(({ id }) => id !== event.id) })}
              >{t('이벤트') + ' '}{index + 1}{' ' + t('삭제')}</Button>
            </li>)}
          </ul>}
          <Button type="button" className="reset-button" onClick={() => {
            onChange(timeline.filter(({ id }) => id !== selected.id));
            setSelectedId('');
            setMessage('');
          }}>{t('현재 단계 삭제')}</Button>
        </fieldset>
      </>}
      {message && <p role="status">{t(message)}</p>}
    </section>
  );
};

export default StrategyTimelineTools;
