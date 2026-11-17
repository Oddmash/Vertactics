import type { HeroPlacement, Team } from '../domain/strategy';

import { heroCatalogue, heroName, heroRoles, isCatalogueHero } from '../domain/hero-catalogue';
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
}: Props) => (
  <section className="hero-tools" aria-labelledby="hero-tools-title">
    <h2 id="hero-tools-title">영웅 배치</h2>
    <form onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const hero = data.get('hero');
      const team = data.get('team');
      if (typeof hero === 'string' && isCatalogueHero(hero) &&
        (team === 'attack' || team === 'defense')) onPlace(hero, team);
    }}>
      <fieldset className="edit-controls" disabled={locked}>
      <label>영웅 <select name="hero">
        {heroRoles.map((role) => (
          <optgroup key={role} label={roleNames[role]}>
            {Object.entries(heroCatalogue).filter(([, hero]) => hero.role === role).map(([id, hero]) => (
              <option key={id} value={id}>{hero.localizedName}</option>
            ))}
          </optgroup>
        ))}
      </select></label>
      <label>팀 <select name="team">
        {Object.entries(teamNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select></label>
      <button className="reset-button" type="submit">배치 시작</button>
      </fieldset>
    </form>
    {pendingMessage && <div className="pending-edit">
      <p role="status">{pendingMessage}</p>
      <button type="button" className="reset-button" onClick={onCancel}>취소</button>
    </div>}
    <div className="hero-actions">
      <button type="button" className="reset-button" disabled={!canUndo} onClick={onUndo}>실행 취소</button>
      <button type="button" className="reset-button" disabled={!canRedo} onClick={onRedo}>다시 실행</button>
    </div>
    {heroes.length > 0 && <ul className="terrain-list" aria-label="배치한 영웅">
      {heroes.map((hero) => (
        <li key={hero.id}>
          <button className="terrain-button" type="button" aria-pressed={selectedId === hero.id} onClick={() => onSelect(hero.id)}>
            <span className={`terrain-swatch team-${hero.team}`} aria-hidden="true" />
            <span>{heroName(hero.heroId)}</span>
            <small>{teamNames[hero.team]}</small>
          </button>
        </li>
      ))}
    </ul>}
  </section>
);

export default HeroTools;
