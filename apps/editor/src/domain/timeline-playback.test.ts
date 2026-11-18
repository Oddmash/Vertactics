import { expect, it } from 'vitest';
import { createStrategy } from './strategy';
import type { StrategyDocument } from './strategy';
import { sampleTimeline } from './timeline-playback';

const strategy: StrategyDocument = {
  ...createStrategy('test', 'test-map', 'Test'),
  heroes: [{ id: 'hero', heroId: 'tracer', team: 'attack', position: [0, 0, 0], yaw: 350 }],
  abilities: [{
    id: 'ability', heroId: 'tracer', abilityId: 'blink', shape: 'line', range: 5, width: 1,
    angle: 60, direction: 0, verification: 'custom', position: [1, 2, 3], heading: 0, visible: false,
  }],
  timeline: [
    { id: 'one', label: 'Approach', durationMs: 1000, poses: [{ heroPlacementId: 'hero', position: [4, 2, 8], yaw: 10 }],
      events: [{ id: 'use', abilityPlacementId: 'ability', offsetMs: 500, durationMs: 250 }] },
    { id: 'two', label: 'Hold', durationMs: 1000, poses: [], events: [] },
  ],
};

it('interpolates 3D positions and uses the shortest heading across north', () => {
  expect(sampleTimeline(strategy, -1).heroes[0]).toEqual(strategy.heroes[0]);
  expect(sampleTimeline(strategy, 500).heroes[0]).toMatchObject({ position: [2, 1, 4], yaw: 0 });
  expect(sampleTimeline(strategy, 1000).heroes[0]).toMatchObject({ position: [4, 2, 8], yaw: 10 });
  expect(sampleTimeline(strategy, 3000).heroes[0]).toMatchObject({ position: [4, 2, 8], yaw: 10 });
  expect(strategy.heroes[0]?.yaw).toBe(350);
});

it('uses half-open event windows and advances phases at their exact boundary', () => {
  expect(sampleTimeline(strategy, 499).abilities).toEqual([]);
  expect(sampleTimeline(strategy, 500).abilities[0]).toMatchObject({ id: 'ability', visible: true });
  expect(sampleTimeline(strategy, 749).abilities).toHaveLength(1);
  expect(sampleTimeline(strategy, 750).abilities).toEqual([]);
  expect(sampleTimeline(strategy, 999).phaseLabel).toBe('Approach');
  expect(sampleTimeline(strategy, 1000).phaseLabel).toBe('Hold');
  expect(sampleTimeline(strategy, 2000).abilities).toEqual([]);
  expect(strategy.abilities[0]?.visible).toBe(false);
});
