import type { AbilityPlacement } from './ability-preview';
import type { Annotation } from './annotation';
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
  | { type: 'set-annotation'; annotation: Annotation }
  | { type: 'remove-annotation'; id: string }
  | { type: 'set-ability'; ability: AbilityPlacement }
  | { type: 'remove-ability'; id: string }
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

  if (action.type === 'set-annotation' || action.type === 'remove-annotation') {
    const id = action.type === 'set-annotation' ? action.annotation.id : action.id;
    const index = present.annotations.findIndex((item) => item.id === id);
    if (index < 0 && action.type === 'remove-annotation') return history;
    const annotations = [...present.annotations];
    if (action.type === 'remove-annotation') annotations.splice(index, 1);
    else if (index < 0) annotations.push(action.annotation);
    else annotations[index] = action.annotation;
    return { past: [...past, present], present: parseStrategy({ ...present, annotations }), future: [] };
  }

  if (action.type === 'set-ability' || action.type === 'remove-ability') {
    const id = action.type === 'set-ability' ? action.ability.id : action.id;
    const existing = present.abilities.some((item) => item.id === id);
    if (!existing && action.type === 'remove-ability') return history;
    const abilities = action.type === 'remove-ability'
      ? present.abilities.filter((item) => item.id !== id)
      : existing
        ? present.abilities.map((item) => item.id === id ? action.ability : item)
        : [...present.abilities, action.ability];
    return { past: [...past, present], present: parseStrategy({ ...present, abilities }), future: [] };
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
