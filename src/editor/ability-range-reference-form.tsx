import { Button, Disclosure, Input, Select } from '../ui/controls';
import { useLocale } from '../ui/locale';
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
  const { t } = useLocale();
  const reference = ability.rangeReference;

  return (
    <Disclosure>
      <summary>{t('게임 거리 참고값')}</summary>
      <dl>
        <div><dt>{t('지도 도형 범위')}</dt><dd>{t('사용자 설정 ·') + ' '}{ability.range} u</dd></div>
        {reference && <>
          <div><dt>{t('게임 거리')}</dt><dd>{t(labels[reference.status])} · {reference.meters} m</dd></div>
          <div><dt>{t('게임 버전')}</dt><dd>{reference.gameVersion}</dd></div>
          <div><dt>{t('출처')}</dt><dd>{reference.source}</dd></div>
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
          <label>{t('참고값 유형') + ' '}<Select aria-label={t('참고값 유형')} name="reference-status" defaultValue={reference?.status ?? 'estimated'}>
            <option value="estimated">{t(labels.estimated)}</option>
            <option value="measured">{t(labels.measured)}</option>
          </Select></label>
          <label>{t('게임 거리 (m)') + ' '}<Input type="number" name="meters" min="0.01" max="1000" step="any"
            defaultValue={reference?.meters} required /></label>
          <label>{t('게임 버전') + ' '}<Input name="game-version" maxLength={80} pattern={'.*\\S.*'}
            defaultValue={reference?.gameVersion} required /></label>
          <label>{t('출처') + ' '}<Input name="source" maxLength={300} pattern={'.*\\S.*'} defaultValue={reference?.source} required /></label>
          <Button type="submit" className="reset-button">{t('참고값 저장')}</Button>
          {reference && <Button type="button" className="reset-button" onClick={() => onReference(undefined)}>{t('참고값 지우기')}</Button>}
        </fieldset>
      </form>
    </Disclosure>
  );
};

export default AbilityRangeReferenceForm;
