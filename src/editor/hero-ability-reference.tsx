import LoadingImage from '../ui/loading-image';
import { useId, useState } from 'react';
import { getAbilityPatchReferences, getAbilitySummary, getKoreanAbilityName, getAbilityIcon, abilitySourceForLocale } from '../domain/ability-reference';
import type { CatalogueHero } from '../domain/hero-catalogue';
import { Button } from '../ui/controls';
import { useLocale } from '../ui/locale';

type Props = {
  heroId: CatalogueHero;
  heroName: string;
  source: string;
  abilities: { id: string; name: string }[];
};

const HeroAbilityReference = ({ heroId, heroName, source, abilities }: Props) => {
  const { locale, t } = useLocale();
  const title = useId();
  const detailsId = useId();
  const [hovered, setHovered] = useState<number>();
  const [focused, setFocused] = useState<number>();
  const [pinned, setPinned] = useState<number>();

  const localizedName = ({ id, name }: Props['abilities'][number]) =>
    locale === 'ko' ? getKoreanAbilityName(heroId, id) ?? name : name;
  const reference = abilities.map((ability) => ({
    id: ability.id,
    name: localizedName(ability),
    icon: getAbilityIcon(heroId, ability.id),
    description: getAbilitySummary(heroId, ability.id, locale) ?? '',
  }));
  const shown = hovered ?? focused ?? pinned;
  const detail = shown === undefined ? undefined : reference[shown];
  const patches = detail ? getAbilityPatchReferences(heroId, detail.id) : [];

  return (
    <section className="hero-ability-reference" aria-labelledby={title} onKeyDown={(event) => {
      if (event.key !== 'Escape' || shown === undefined) return;
      event.stopPropagation();
      setHovered(undefined);
      setFocused(undefined);
      setPinned(undefined);
    }}>
      <h3 id={title}>{t('{0}의 스킬', heroName)}</h3>
      <div className="hero-ability-list" onPointerLeave={() => setHovered(undefined)}>
        {reference.map(({ name, icon }, index) => (
          <Button key={name + index} className="reset-button hero-ability-option" aria-label={name}
            aria-pressed={pinned === index} aria-describedby={shown === index ? detailsId : undefined}
            onPointerEnter={(event) => { if (event.pointerType !== 'touch') setHovered(index); }}
            onFocus={() => setFocused(index)}
            onBlur={() => setFocused(undefined)}
            onClick={() => setPinned((current) => current === index ? undefined : index)}>
            {icon ? <LoadingImage src={icon} width={25} height={25} fallback="◇" />
              : <span aria-hidden="true">◇</span>}
          </Button>
        ))}
      </div>
      <div className="hero-ability-readout">
        {detail ? <div className="hero-ability-detail" id={detailsId} role="tooltip">
          <strong>{detail.name}</strong>
          <p>{detail.description || t('스킬 설명은 공식 영웅 페이지에서 확인할 수 있습니다.')}</p>
          {patches.length > 0 ? <dl className="hero-ability-stat">{patches.flatMap(({ patch, values }) =>
            values.map(([label, value, unit]) =>
              <div key={label}><dt>{t(label)} <small>{patch}</small></dt><dd>{value}{unit ? ` ${unit}` : ''}</dd></div>))}</dl>
            : <p className="hero-ability-hint">{t('검증된 수치가 아직 없습니다.')}</p>}
        </div> : <p className="hero-ability-hint">{t('스킬을 가리키거나 선택해 설명을 확인하세요.')}</p>}
      </div>
      <div className="hero-ability-sources">
        <a href={abilitySourceForLocale(source, locale)} target="_blank" rel="noreferrer">{t('공식 스킬 출처')}</a>
        {patches.map(({ patch, source }) => <a key={patch} href={abilitySourceForLocale(source, locale)} target="_blank" rel="noreferrer">{t('{0} 패치 노트', patch)}</a>)}
      </div>
    </section>
  );
};

export default HeroAbilityReference;
