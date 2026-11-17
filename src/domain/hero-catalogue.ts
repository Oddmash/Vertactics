export const heroRoles = ['damage', 'tank', 'support'] as const;
export type HeroRole = (typeof heroRoles)[number];

type HeroDefinition = {
  name: string;
  localizedName: string;
  role: HeroRole;
  source: string;
  abilities: { id: string; name: string }[];
};

export const heroCatalogue = {
  tracer: {
    name: 'Tracer',
    localizedName: '트레이서',
    role: 'damage',
    source: 'https://overwatch.blizzard.com/en-us/heroes/tracer/',
    abilities: [
      { id: 'pulse-pistols', name: 'Pulse Pistols' },
      { id: 'blink', name: 'Blink' },
      { id: 'recall', name: 'Recall' },
      { id: 'pulse-bomb', name: 'Pulse Bomb' },
    ],
  },
  reinhardt: {
    name: 'Reinhardt',
    localizedName: '라인하르트',
    role: 'tank',
    source: 'https://overwatch.blizzard.com/en-us/heroes/reinhardt/',
    abilities: [
      { id: 'rocket-hammer', name: 'Rocket Hammer' },
      { id: 'charge', name: 'Charge' },
      { id: 'fire-strike', name: 'Fire Strike' },
      { id: 'barrier-field', name: 'Barrier Field' },
      { id: 'earthshatter', name: 'Earthshatter' },
    ],
  },
  ana: {
    name: 'Ana',
    localizedName: '아나',
    role: 'support',
    source: 'https://overwatch.blizzard.com/en-us/heroes/ana/',
    abilities: [
      { id: 'biotic-rifle', name: 'Biotic Rifle' },
      { id: 'sleep-dart', name: 'Sleep Dart' },
      { id: 'biotic-grenade', name: 'Biotic Grenade' },
      { id: 'nano-boost', name: 'Nano Boost' },
    ],
  },
} satisfies Record<string, HeroDefinition>;

export type CatalogueHero = keyof typeof heroCatalogue;
export const isCatalogueHero = (id: string): id is CatalogueHero => Object.hasOwn(heroCatalogue, id);
export const getHero = (id: string): HeroDefinition | undefined => isCatalogueHero(id) ? heroCatalogue[id] : undefined;
export const heroName = (id: string) => getHero(id)?.localizedName ?? id;
