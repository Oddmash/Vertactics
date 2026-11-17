import { parseStrategy } from './strategy';
import type { HeroPlacement, StrategyDocument } from './strategy';

export type StrategyHistory = {
  past: StrategyDocument[];
  present: StrategyDocument;
  future: StrategyDocument[];
};

export type StrategyAction =
  | { type: 'place'; hero: HeroPlacement }
  | { type: 'update'; id: string; patch: Partial<Pick<HeroPlacement, 'position' | 'yaw' | 'team'>> }
  | { type: 'remove'; id: string }
  | { type: 'undo' }
  | { type: 'redo' };

export const createStrategyHistory = (document: StrategyDocument): StrategyHistory => ({
  past: [],
  present: parseStrategy(document),
  future: [],
});

export const reduceStrategyHistory = (
  history: StrategyHistory,
  action: StrategyAction,
): StrategyHistory => {
  const { past, present, future } = history;
  if (action.type === 'undo') {
    const previous = past.at(-1);
    return previous
      ? { past: past.slice(0, -1), present: previous, future: [present, ...future] }
      : history;
  }
  if (action.type === 'redo') {
    const [next, ...remaining] = future;
    return next ? { past: [...past, present], present: next, future: remaining } : history;
  }

  let heroes: HeroPlacement[];
  if (action.type === 'place') {
    heroes = [...present.heroes, action.hero];
  } else {
    const current = present.heroes.find((hero) => hero.id === action.id);
    if (!current) return history;
    if (action.type === 'remove') {
      heroes = present.heroes.filter((hero) => hero !== current);
    } else {
      const updated = { ...current, ...action.patch };
      if (updated.yaw === current.yaw && updated.team === current.team &&
        updated.position.length === current.position.length &&
        updated.position.every((axis, index) => axis === current.position[index])) return history;
      heroes = present.heroes.map((hero) => hero === current ? updated : hero);
    }
  }

  return {
    past: [...past, present],
    present: parseStrategy({ ...present, heroes }),
    future: [],
  };
};
