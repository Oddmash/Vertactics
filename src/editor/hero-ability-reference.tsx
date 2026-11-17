import { useEffect, useId, useState } from 'react';
import { getAbilityPatchReference, getAbilitySummary, getKoreanAbilityName } from '../domain/ability-reference';
import type { CatalogueHero } from '../domain/hero-catalogue';
import { loadHeroAbilities } from '../domain/live-hero-abilities';
import type { LiveAbility } from '../domain/live-hero-abilities';
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
  const [remote, setRemote] = useState<LiveAbility[]>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [hovered, setHovered] = useState<number>();
  const [focused, setFocused] = useState<number>();
  const [pinned, setPinned] = useState<number>();
  const [brokenIcons, setBrokenIcons] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    loadHeroAbilities(heroId, locale).then((items) => {
      if (!cancelled) setRemote(items);
    }).catch(() => {
      if (!cancelled) setLoadFailed(true);
    });
    return () => { cancelled = true; };
  }, [heroId, locale]);

  const localizedName = ({ id, name }: Props['abilities'][number]) =>
    locale === 'ko' ? getKoreanAbilityName(heroId, id) ?? name : name;
  const reference: (LiveAbility & { id?: string })[] = remote?.map((ability) => ({
    ...ability,
    id: abilities.find((local) => localizedName(local).toLowerCase() === ability.name.toLowerCase())?.id,
  })) ?? abilities.map((ability) => ({
    id: ability.id,
    name: localizedName(ability),
    description: getAbilitySummary(heroId, ability.id, locale) ?? '',
  }));
  const shown = hovered ?? focused ?? pinned;
  const detail = shown === undefined ? undefined : reference[shown];
  const patch = detail?.id ? getAbilityPatchReference(heroId, detail.id) : undefined;

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
            {icon && !brokenIcons.has(icon)
              ? <img src={icon} alt="" width="25" height="25" referrerPolicy="no-referrer"
                onError={() => setBrokenIcons((current) => new Set([...current, icon]))} />
              : <span aria-hidden="true">{name.slice(0, 2)}</span>}
          </Button>
        ))}
        {detail && <div className="hero-ability-detail" id={detailsId} role="tooltip">
          <strong>{detail.name}</strong>
          <p>{detail.description || t(loadFailed ? '스킬 설명은 공식 영웅 페이지에서 확인할 수 있습니다.' : '스킬 정보를 불러오는 중입니다.')}</p>
          {patch && <dl className="hero-ability-stat"><dt>{t(patch.label)}</dt><dd>{patch.value}</dd></dl>}
        </div>}
      </div>
      <div className="hero-ability-sources">
        <a href={source} target="_blank" rel="noreferrer">{t('공식 스킬 출처')}</a>
        {patch && <a href={patch.source} target="_blank" rel="noreferrer">{t('{0} 패치 노트', patch.patch)}</a>}
      </div>
    </section>
  );
};

export default HeroAbilityReference;
