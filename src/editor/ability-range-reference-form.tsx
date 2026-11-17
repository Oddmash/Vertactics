import { parseAbilityRangeReference } from '../domain/ability-preview';
import type { AbilityPlacement, AbilityRangeReference } from '../domain/ability-preview';

const labels: Record<AbilityRangeReference['status'], string> = {
  measured: '사용자 실측',
  estimated: '사용자 추정',
};

type Props = {
  ability: AbilityPlacement;
  locked: boolean;
  onReference: (reference: AbilityRangeReference | undefined) => void;
};

const AbilityRangeReferenceForm = ({ ability, locked, onReference }: Props) => {
  const reference = ability.rangeReference;

  return (
    <details>
      <summary>게임 거리 참고값</summary>
      <dl>
        <div><dt>지도 도형 범위</dt><dd>사용자 설정 · {ability.range} u</dd></div>
        {reference && <>
          <div><dt>게임 거리</dt><dd>{labels[reference.status]} · {reference.meters} m</dd></div>
          <div><dt>게임 버전</dt><dd>{reference.gameVersion}</dd></div>
          <div><dt>출처</dt><dd>{reference.source}</dd></div>
        </>}
      </dl>
      <form key={JSON.stringify(reference ?? null)} onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const source = String(data.get('source')).trim();
        const gameVersion = String(data.get('game-version')).trim();
        if (!source || !gameVersion) return;
        const next = parseAbilityRangeReference({
          status: data.get('reference-status'), meters: Number(data.get('meters')), source, gameVersion,
        });
        if (JSON.stringify(next) !== JSON.stringify(reference)) onReference(next);
      }}>
        <fieldset className="edit-controls" disabled={locked}>
          <label>참고값 유형 <select aria-label="참고값 유형" name="reference-status" defaultValue={reference?.status ?? 'estimated'}>
            <option value="estimated">{labels.estimated}</option>
            <option value="measured">{labels.measured}</option>
          </select></label>
          <label>게임 거리 (m) <input type="number" name="meters" min="0.01" max="1000" step="any"
            defaultValue={reference?.meters} required /></label>
          <label>게임 버전 <input name="game-version" maxLength={80} pattern={'.*\\S.*'}
            defaultValue={reference?.gameVersion} required /></label>
          <label>출처 <input name="source" maxLength={300} pattern={'.*\\S.*'} defaultValue={reference?.source} required /></label>
          <button type="submit" className="reset-button">참고값 저장</button>
          {reference && <button type="button" className="reset-button" onClick={() => onReference(undefined)}>참고값 지우기</button>}
        </fieldset>
      </form>
    </details>
  );
};

export default AbilityRangeReferenceForm;
