import { parseAnnotations } from './annotation';
import type { Annotation } from './annotation';
import { isWorldPoint } from './map';
import type { WorldPoint } from './map';

export const teams = ['attack', 'defense'] as const;
export type Team = (typeof teams)[number];

export type HeroPlacement = {
  id: string;
  heroId: string;
  team: Team;
  position: WorldPoint;
  yaw: number;
};

export type StrategyDocument = {
  schemaVersion: 1;
  id: string;
  mapId: string;
  title: string;
  heroes: HeroPlacement[];
  annotations: Annotation[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const parseHero = (value: unknown, index: number): HeroPlacement => {
  if (!isRecord(value)) throw new Error(`Invalid heroes[${index}]`);
  const { id, heroId, team, position, yaw } = value;

  if (!isText(id) || !isText(heroId) || (team !== 'attack' && team !== 'defense') ||
    !isWorldPoint(position) || typeof yaw !== 'number' ||
    !Number.isFinite(yaw) || yaw < 0 || yaw >= 360) {
    throw new Error(`Invalid heroes[${index}]`);
  }

  return { id, heroId, team, position: [...position], yaw };
};

export const parseStrategy = (value: unknown): StrategyDocument => {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isText(value.id) ||
    !isText(value.mapId) || !isText(value.title) || !Array.isArray(value.heroes)) {
    throw new Error('Invalid strategy document or unsupported schema version');
  }

  const heroes = Array.from(value.heroes, parseHero);
  if (new Set(heroes.map(({ id }) => id)).size !== heroes.length) {
    throw new Error('Duplicate placement id');
  }

  return { schemaVersion: 1, id: value.id, mapId: value.mapId, title: value.title, heroes,
    annotations: parseAnnotations(value.annotations === undefined ? [] : value.annotations),
  };
};

export const createStrategy = (id: string, mapId: string, title: string): StrategyDocument =>
  parseStrategy({ schemaVersion: 1, id, mapId, title, heroes: [] });
