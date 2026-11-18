import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { getAbilityIcon, getAbilityPatchReferences, getAbilitySummary, getKoreanAbilityName } from './ability-reference';
import english from '../ui/english.json';
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
  const expectWebp = (file: string) => {
    const content = readFileSync(new URL(`../../public/${file}`, import.meta.url));
    expect(content.toString('ascii', 8, 12), file).toBe('WEBP');
  };
  for (const [heroId, hero] of Object.entries(heroCatalogue)) {
    expectWebp(`images/heroes/${heroId}.webp`);
    for (const { id } of hero.abilities) {
      expect(getKoreanAbilityName(heroId, id), `${heroId}:${id}`).toBeTruthy();
      expect(getAbilitySummary(heroId, id, 'ko')).toBeTruthy();
      expect(getAbilitySummary(heroId, id, 'en')).toBeTruthy();
      const icon = getAbilityIcon(heroId, id);
      expect(icon).toMatch(/^images\/abilities\/[a-f0-9]+\.webp$/);
      expectWebp(icon!);
    }
  }
  for (const { id } of owkrCatalogue.maps) expectWebp(`images/maps/${id}.webp`);
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

it('keeps the latest published change for each skill statistic localized and dated', () => {
  for (const [heroId, hero] of Object.entries(heroCatalogue)) {
    for (const { id } of hero.abilities) {
      const references = getAbilityPatchReferences(heroId, id);
      const labels = references.flatMap(({ values }) => values.map(([label]) => label));
      expect(new Set(labels).size, `${heroId}:${id}`).toBe(labels.length);
      for (const label of labels) expect(english).toHaveProperty(label);
      for (const { patch, source } of references) {
        expect(patch).toMatch(/^2026-\d{2}-\d{2}$/);
        expect(source).toContain(patch.slice(0, 7).replace('-', '/'));
      }
    }
  }
  const suzu = getAbilityPatchReferences('kiriko', 'protection-suzu');
  expect(suzu).toEqual([{
    patch: '2026-09-08',
    source: 'https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/09/',
    values: [['무적 지속시간', 0.5, 's'], ['폭발 반경', 4, 'm']],
  }]);
});
