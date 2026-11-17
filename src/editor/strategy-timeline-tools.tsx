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
      <h2 id="timeline-title">전술 단계</h2>
      <button type="button" className="reset-button" disabled={locked} onClick={() => {
        const id = crypto.randomUUID();
        onChange([...timeline, { id, label: `단계 ${timeline.length + 1}`, durationMs: 5000, poses: [], events: [] }]);
        setSelectedId(id);
        setMessage('');
      }}>단계 추가</button>
      {selected && <>
        <label>현재 단계 <select aria-label="현재 단계" value={selected.id} onChange={(event) => {
          setSelectedId(event.target.value);
          setMessage('');
        }}>
          {timeline.map((phase, index) => <option key={phase.id} value={phase.id}>{index + 1}. {phase.label}</option>)}
        </select></label>
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
            <label>단계 이름 <input name="label" defaultValue={selected.label} maxLength={80} required /></label>
            <label>단계 길이 (초) <input name="duration" type="number" min="0.001" max="86400" step="0.001"
              defaultValue={selected.durationMs / 1000} required /></label>
            <button type="submit" className="reset-button">단계 설정 적용</button>
          </form>
          <button type="button" className="reset-button" disabled={heroes.length === 0} onClick={() => update({
            ...selected, poses: heroes.map(({ id, position, yaw }) => ({ heroPlacementId: id, position, yaw })),
          })}>현재 영웅 위치 기록</button>
          <p>기록한 영웅 {selected.poses.length}명</p>
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
            <label>배치한 능력 <select name="ability" aria-label="이벤트에 사용할 능력" required>
              {Array.from(abilityLabels, ([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select></label>
            <label>이벤트 시작 (초) <input name="offset" type="number" min="0" step="0.001" defaultValue="0" required /></label>
            <label>이벤트 길이 (초) <input name="event-duration" type="number" min="0.001" step="0.001" defaultValue="1" required /></label>
            <button type="submit" className="reset-button">능력 이벤트 추가</button>
          </form>}
          {selected.events.length > 0 && <ul aria-label="단계 능력 이벤트">
            {selected.events.map((event, index) => <li key={event.id}>
              <span>{abilityLabels.get(event.abilityPlacementId)} · {event.offsetMs / 1000}초 · {event.durationMs / 1000}초 동안</span>
              <button type="button" className="reset-button"
                onClick={() => update({ ...selected, events: selected.events.filter(({ id }) => id !== event.id) })}
              >이벤트 {index + 1} 삭제</button>
            </li>)}
          </ul>}
          <button type="button" className="reset-button" onClick={() => {
            onChange(timeline.filter(({ id }) => id !== selected.id));
            setSelectedId('');
            setMessage('');
          }}>현재 단계 삭제</button>
        </fieldset>
      </>}
      {message && <p role="status">{message}</p>}
    </section>
  );
};

export default StrategyTimelineTools;
