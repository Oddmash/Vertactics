import { expect, it } from 'vitest';
import { getAbilityIcon, getAbilityPatchReferences, getAbilitySummary, getKoreanAbilityName } from './ability-reference';
import owkrCatalogue from './owkr-catalogue.json';
import { getHero, heroCatalogue, heroName, heroRoles, isCatalogueHero } from './hero-catalogue';

it('provides all 54 listed heroes with sourced, unique ability IDs', () => {
  expect(Object.keys(heroCatalogue)).toHaveLength(54);
  expect(Object.keys(heroCatalogue).sort()).toEqual(Object.keys(owkrCatalogue.heroes).sort());
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

it('covers each catalogue ability with bilingual text and its official icon', () => {
  for (const [heroId, hero] of Object.entries(heroCatalogue)) {
    for (const { id } of hero.abilities) {
      expect(getKoreanAbilityName(heroId, id), `${heroId}:${id}`).toBeTruthy();
      expect(getAbilitySummary(heroId, id, 'ko')).toBeTruthy();
      expect(getAbilitySummary(heroId, id, 'en')).toBeTruthy();
      expect(getAbilityIcon(heroId, id)).toMatch(/^https:\/\/d15f34w2p8l1cc\.cloudfront\.net\/overwatch\/[a-f0-9]+\.png$/);
    }
  }
});

it('keeps sourced range and hotfix values tied to their own patch dates', () => {
  const [compactor] = getAbilityPatchReferences('roadhog', 'trash-compactor');
  expect(compactor?.values).toEqual(expect.arrayContaining([
    ['폭발 피해', '75–200'], ['폭발 내부 반경', 2, 'm'], ['폭발 외부 반경', 6, 'm'],
  ]));
  const breather = getAbilityPatchReferences('roadhog', 'take-a-breather');
  expect(breather.map(({ patch }) => patch)).toEqual(['2026-10-13', '2026-10-06']);
  expect(breather[0]?.values).toContainEqual(['최대 지속시간', 2.5, 's']);
  expect(getAbilityPatchReferences('toString', 'constructor')).toEqual([]);
});
