import { expect, it } from 'vitest';
import { getHero, heroCatalogue, heroName, heroRoles, isCatalogueHero } from './hero-catalogue';

it('provides one starter hero from each role and sourced, unique ability IDs', () => {
  expect(new Set(Object.values(heroCatalogue).map((hero) => hero.role))).toEqual(new Set(heroRoles));
  for (const [id, hero] of Object.entries(heroCatalogue)) {
    expect(isCatalogueHero(id)).toBe(true);
    expect(hero.source).toMatch(/^https:\/\/overwatch\.blizzard\.com\//);
    expect(new Set(hero.abilities.map((ability) => ability.id)).size).toBe(hero.abilities.length);
  }
});

it('keeps unknown hero references readable in imported drafts', () => {
  expect(getHero('toString')).toBeUndefined();
  expect(heroName('future-hero')).toBe('future-hero');
});
