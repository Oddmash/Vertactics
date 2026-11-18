import { parseMap } from './map';
import type { MapDefinition } from './map';
import { parseStrategy } from './strategy';
import type { StrategyDocument } from './strategy';

export type StrategyDraft = {
  version: 1;
  map: MapDefinition;
  strategy: StrategyDocument;
};

export const parseStrategyDraft = (value: unknown): StrategyDraft => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Invalid strategy draft');
  }
  const { version, map, strategy } = value as Record<string, unknown>;
  if (version !== 1) throw new Error('Unsupported strategy draft version');
  const parsedMap = parseMap(map);
  const parsedStrategy = parseStrategy(strategy);
  if (parsedMap.id !== parsedStrategy.mapId) throw new Error('Strategy draft map mismatch');
  return { version, map: parsedMap, strategy: parsedStrategy };
};
