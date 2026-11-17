import { useState } from 'react';
import HeroAbilityReference from './hero-ability-reference';
import portraitUrls from '../domain/hero-portraits.json';
import { Button, Select } from '../ui/controls';
import { useLocale } from '../ui/locale';
import type { HeroPlacement, Team } from '../domain/strategy';

import { getHero, heroCatalogue, heroName, heroRoles, isCatalogueHero } from '../domain/hero-catalogue';
import type { CatalogueHero, HeroRole } from '../domain/hero-catalogue';

export const teamNames: Record<Team, string> = { attack: '공격팀', defense: '수비팀' };

export const roleNames: Record<HeroRole, string> = { damage: '공격', tank: '돌격', support: '지원' };

type Props = {
  heroes: HeroPlacement[];
  locked: boolean;
  selectedId: string | null;
  catalogueId: CatalogueHero;
  onChooseHero: (id: CatalogueHero) => void;
  pendingMessage: string;
  canUndo: boolean;
  canRedo: boolean;
  onPlace: (heroId: CatalogueHero, team: Team) => void;
  onSelect: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCancel: () => void;
};

const HeroTools = ({
  heroes, locked, selectedId, catalogueId, onChooseHero, pendingMessage, canUndo, canRedo, onPlace, onSelect, onUndo, onRedo, onCancel,
}: Props) => {
  const { locale, t } = useLocale();
  const selectedProfile = heroCatalogue[catalogueId];
  const name = locale === 'en' ? selectedProfile.name : selectedProfile.localizedName;
  const [failedPortraits, setFailedPortraits] = useState<ReadonlySet<string>>(() => new Set());
  const portraits: Record<string, string> = portraitUrls;
  const chooseRole = (role: HeroRole) => {
    if (role === selectedProfile.role) return;
    const first = Object.entries(heroCatalogue).find(([, hero]) => hero.role === role)?.[0];
    if (first && isCatalogueHero(first)) onChooseHero(first);
  };
  return (
    <section className="hero-tools" aria-labelledby="hero-tools-title">
      <h2 id="hero-tools-title" tabIndex={-1}>{t('영웅 배치')}</h2>
      <div className="hero-role-switch" role="group" aria-label={t('영웅 역할')}>
        {heroRoles.map((role) => (
          <Button key={role} className="reset-button" aria-pressed={selectedProfile.role === role}
            onClick={() => chooseRole(role)}>{t(roleNames[role])}</Button>
        ))}
      </div>
      <div className="hero-roster" role="group" aria-label={t('영웅 선택')}>
        {Object.entries(heroCatalogue).filter(([, hero]) => hero.role === selectedProfile.role).map(([id, hero]) => {
          const label = locale === 'en' ? hero.name : hero.localizedName;
          const portrait = portraits[id];
          return (
            <Button key={id} className="hero-roster-card" aria-pressed={catalogueId === id}
              onClick={() => { if (isCatalogueHero(id)) onChooseHero(id); }}>
              {portrait && !failedPortraits.has(id) ? <img src={portrait} alt="" width="48" height="48" loading="lazy"
                referrerPolicy="no-referrer" onError={() => setFailedPortraits((current) => new Set([...current, id]))} />
                : <span className="hero-portrait-fallback" aria-hidden="true">{label.slice(0, 2)}</span>}
              <span className="hero-roster-name">{label}</span>
            </Button>
          );
        })}
      </div>
      <HeroAbilityReference key={catalogueId} heroId={catalogueId} heroName={name}
        source={selectedProfile.source} abilities={selectedProfile.abilities} />
      <small className="hero-portrait-credit">{t('영웅 이미지 © Blizzard Entertainment')}</small>
      <form onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const team = data.get('team');
        if (team === 'attack' || team === 'defense') onPlace(catalogueId, team);
      }}>
        <fieldset className="edit-controls" disabled={locked}>
        <label>{t('팀') + ' '}<Select name="team">
          {Object.entries(teamNames).map(([id, name]) => <option key={id} value={id}>{t(name)}</option>)}
        </Select></label>
        <Button className="reset-button" type="submit">{t('배치 시작')}</Button>
        </fieldset>
      </form>
      {pendingMessage && <div className="pending-edit">
        <p role="status">{pendingMessage}</p>
        <Button type="button" className="reset-button" onClick={onCancel}>{t('취소')}</Button>
      </div>}
      <div className="hero-actions">
        <Button type="button" className="reset-button" disabled={!canUndo} onClick={onUndo}>{t('실행 취소')}</Button>
        <Button type="button" className="reset-button" disabled={!canRedo} onClick={onRedo}>{t('다시 실행')}</Button>
      </div>
      {heroes.length > 0 && <ul className="terrain-list" aria-label={t('배치한 영웅')}>
        {heroes.map((hero) => (
          <li key={hero.id}>
            <Button className="terrain-button" type="button" aria-pressed={selectedId === hero.id} onClick={() => onSelect(hero.id)}>
              <span className={`terrain-swatch team-${hero.team}`} aria-hidden="true" />
              <span>{locale === 'en' ? getHero(hero.heroId)?.name ?? hero.heroId : heroName(hero.heroId)}</span>
              <small>{t(teamNames[hero.team])}</small>
            </Button>
          </li>
        ))}
      </ul>}
    </section>
  );
};

export default HeroTools;
