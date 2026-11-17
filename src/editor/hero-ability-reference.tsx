import { useId, useState } from 'react';
import { getAbilityPatchReference, getAbilitySummary } from '../domain/ability-reference';
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
  const [hovered, setHovered] = useState<string>();
  const [focused, setFocused] = useState<string>();
  const [pinned, setPinned] = useState<string>();
  const active = hovered ?? focused ?? pinned;
  const detail = abilities.find(({ id }) => id === active);
  const patch = detail && getAbilityPatchReference(heroId, detail.id);

  return (
    <section className="hero-ability-reference" aria-labelledby={title} onKeyDown={(event) => {
      if (event.key !== 'Escape' || !active) return;
      event.stopPropagation();
      setHovered(undefined);
      setFocused(undefined);
      setPinned(undefined);
    }}>
      <h3 id={title}>{t('{0}의 스킬', heroName)}</h3>
      <div className="hero-ability-list" onPointerLeave={() => setHovered(undefined)}>
        {abilities.map(({ id, name }) => (
          <Button key={id} className="reset-button hero-ability-option" aria-pressed={pinned === id}
            aria-describedby={detail?.id === id ? detailsId : undefined}
            onPointerEnter={(event) => { if (event.pointerType !== 'touch') setHovered(id); }}
            onFocus={() => setFocused(id)}
            onBlur={() => setFocused(undefined)}
            onClick={() => setPinned((current) => current === id ? undefined : id)}>
            {name}
          </Button>
        ))}
      </div>
      {detail && <div className="hero-ability-detail" id={detailsId} role="region" aria-label={t('스킬 상세')}>
        <strong>{detail.name}</strong>
        <p>{getAbilitySummary(heroId, detail.id, locale) ?? t('스킬 설명은 공식 영웅 페이지에서 확인할 수 있습니다.')}</p>
        {patch && <dl className="hero-ability-stat"><dt>{t(patch.label)}</dt><dd>{patch.value}</dd></dl>}
        <a href={source} target="_blank" rel="noreferrer">{t('공식 스킬 출처')}</a>
        {patch && <a href={patch.source} target="_blank" rel="noreferrer">{t('{0} 패치 노트', patch.patch)}</a>}
      </div>}
    </section>
  );
};

export default HeroAbilityReference;
