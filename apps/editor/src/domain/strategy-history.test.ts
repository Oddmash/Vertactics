import type { AbilityPlacement } from './ability-preview';
import type { StrategyPhase } from './strategy-timeline';
import { describe, expect, it } from 'vitest';
import { createStrategy } from './strategy';
import type { HeroPlacement } from './strategy';
import { createStrategyHistory, reduceStrategyHistory } from './strategy-history';

const hero: HeroPlacement = {
  id: 'hero-1', heroId: 'tracer', team: 'attack', position: [0, 0, 0], yaw: 0,
};
const initial = createStrategyHistory(createStrategy('strategy-1', 'elevation-lab', 'First plan'));

describe('strategy history', () => {
  it('undoes and redoes an entire placement update with elevation and direction', () => {
    const placed = reduceStrategyHistory(initial, { type: 'place', hero });
    const moved = reduceStrategyHistory(placed, {
      type: 'update', id: hero.id, patch: { position: [10.5, 2, 6], yaw: 90, team: 'defense' },
    });
    const undone = reduceStrategyHistory(moved, { type: 'undo' });
    expect(undone.present).toBe(placed.present);
    expect(reduceStrategyHistory(undone, { type: 'redo' }).present).toBe(moved.present);
    expect(moved.present.heroes[0]?.position).toEqual([10.5, 2, 6]);
  });

  it('clears redo after a new change and restores removed placements on undo', () => {
    const placed = reduceStrategyHistory(initial, { type: 'place', hero });
    const updated = reduceStrategyHistory(placed, { type: 'update', id: hero.id, patch: { yaw: 45 } });
    const undone = reduceStrategyHistory(updated, { type: 'undo' });
    const removed = reduceStrategyHistory(undone, { type: 'remove', id: hero.id });
    expect(removed.present.heroes).toEqual([]);
    expect(reduceStrategyHistory(removed, { type: 'redo' })).toBe(removed);
    expect(reduceStrategyHistory(removed, { type: 'undo' }).present.heroes).toEqual([hero]);
  });

  it('does not add history for absent targets or unchanged values', () => {
    const placed = reduceStrategyHistory(initial, { type: 'place', hero });
    expect(reduceStrategyHistory(placed, { type: 'remove', id: 'missing' })).toBe(placed);
    expect(reduceStrategyHistory(placed, {
      type: 'update', id: hero.id, patch: { position: [0, 0, 0] },
    })).toBe(placed);
    expect(reduceStrategyHistory(initial, { type: 'undo' })).toBe(initial);
  });
});

it('records timeline changes and restores dependent poses and events on undo', () => {
  const ability: AbilityPlacement = {
    id: 'ability-1', heroId: 'tracer', abilityId: 'blink', shape: 'vector', range: 8, width: 1,
    angle: 60, direction: 0, verification: 'custom', position: [1, 2, 3], heading: 0, visible: true,
  };
  const placedHero = reduceStrategyHistory(initial, { type: 'place', hero });
  const placedAbility = reduceStrategyHistory(placedHero, { type: 'set-ability', ability });
  const phase: StrategyPhase = {
    id: 'entry', label: 'Entry', durationMs: 3000,
    poses: [{ heroPlacementId: hero.id, position: [3, 4, 5], yaw: 45 }],
    events: [{ id: 'flash', abilityPlacementId: ability.id, offsetMs: 1000, durationMs: 500 }],
  };
  const recording = reduceStrategyHistory(placedAbility, { type: 'set-timeline', timeline: [phase] });
  expect(reduceStrategyHistory(recording, { type: 'set-timeline', timeline: [phase] })).toBe(recording);
  const removedHero = reduceStrategyHistory(recording, { type: 'remove', id: hero.id });
  expect(removedHero.present.timeline).toEqual([{ ...phase, poses: [] }]);
  expect(reduceStrategyHistory(removedHero, { type: 'undo' }).present.timeline).toEqual([phase]);
  const removedAbility = reduceStrategyHistory(recording, { type: 'remove-ability', id: ability.id });
  expect(removedAbility.present.timeline).toEqual([{ ...phase, events: [] }]);
  expect(reduceStrategyHistory(removedAbility, { type: 'undo' }).present.timeline).toEqual([phase]);
});
