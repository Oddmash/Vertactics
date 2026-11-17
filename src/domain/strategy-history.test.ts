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
