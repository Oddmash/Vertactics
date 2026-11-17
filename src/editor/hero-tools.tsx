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
  heroes, locked, selectedId, pendingMessage, canUndo, canRedo, onPlace, onSelect, onUndo, onRedo, onCancel,
}: Props) => {
  const { locale, t } = useLocale();
  return (
    <section className="hero-tools" aria-labelledby="hero-tools-title">
      <h2 id="hero-tools-title" tabIndex={-1}>{t('영웅 배치')}</h2>
      <form onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const hero = data.get('hero');
        const team = data.get('team');
        if (typeof hero === 'string' && isCatalogueHero(hero) &&
          (team === 'attack' || team === 'defense')) onPlace(hero, team);
      }}>
        <fieldset className="edit-controls" disabled={locked}>
        <label>{t('영웅') + ' '}<Select name="hero" aria-label={t('영웅')}>
          {heroRoles.map((role) => (
            <optgroup key={role} label={t(roleNames[role])}>
              {Object.entries(heroCatalogue).filter(([, hero]) => hero.role === role).map(([id, hero]) => (
                <option key={id} value={id}>{locale === 'en' ? hero.name : hero.localizedName}</option>
              ))}
            </optgroup>
          ))}
        </Select></label>
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
