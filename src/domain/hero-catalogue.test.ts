import { expect, it } from 'vitest';
import { getHero, heroCatalogue, heroName, heroRoles, isCatalogueHero } from './hero-catalogue';

it('provides all 54 listed heroes with sourced, unique ability IDs', () => {
  expect(Object.keys(heroCatalogue)).toHaveLength(54);
  expect(new Set(Object.values(heroCatalogue).map((hero) => hero.role))).toEqual(new Set(heroRoles));
  for (const [id, hero] of Object.entries(heroCatalogue)) {
    expect(isCatalogueHero(id)).toBe(true);
    expect(hero.source).toMatch(/^https:\/\/overwatch\.blizzard\.com\//);
    expect(hero.abilities.length).toBeGreaterThan(0);
    expect(new Set(hero.abilities.map((ability) => ability.id)).size).toBe(hero.abilities.length);
  }
});

it('keeps starter placement IDs and uses the current Sombra role', () => {
  expect(heroCatalogue.tracer.abilities.some(({ id }) => id === 'blink')).toBe(true);
  expect(heroCatalogue.reinhardt.role).toBe('tank');
  expect(heroCatalogue.ana.role).toBe('support');
  expect(heroCatalogue.sombra.role).toBe('support');
});

it('keeps unknown hero references readable in imported drafts', () => {
  expect(getHero('toString')).toBeUndefined();
  expect(heroName('future-hero')).toBe('future-hero');
});
