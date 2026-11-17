import type { WorldPoint } from './map';
import type { StrategyDocument } from './strategy';
import type { StrategyPhase } from './strategy-timeline';

export const timelineDuration = (timeline: readonly StrategyPhase[]): number =>
  timeline.reduce((total, phase) => total + phase.durationMs, 0);

const blend = (from: number, to: number, fraction: number): number =>
  from * (1 - fraction) + to * fraction;

export const sampleTimeline = (strategy: StrategyDocument, timeMs: number) => {
  const totalMs = timelineDuration(strategy.timeline);
  const time = Math.min(totalMs, Math.max(0, timeMs));
  const heroes = new Map(strategy.heroes.map((hero) => [hero.id, hero]));
  let startMs = 0;
  for (const phase of strategy.timeline) {
    const elapsed = time - startMs;
    const fraction = Math.min(1, elapsed / phase.durationMs);
    for (const pose of phase.poses) {
      const hero = heroes.get(pose.heroPlacementId);
      if (!hero) continue;
      const turn = ((pose.yaw - hero.yaw + 540) % 360) - 180;
      const position: WorldPoint = [
        blend(hero.position[0], pose.position[0], fraction),
        blend(hero.position[1], pose.position[1], fraction),
        blend(hero.position[2], pose.position[2], fraction),
      ];
      heroes.set(hero.id, { ...hero, position, yaw: (hero.yaw + turn * fraction + 360) % 360 });
    }
    if (elapsed < phase.durationMs) {
      const active = new Set(phase.events.filter(({ offsetMs, durationMs }) =>
        offsetMs <= elapsed && elapsed < offsetMs + durationMs).map(({ abilityPlacementId }) => abilityPlacementId));
      return {
        phaseLabel: phase.label, heroes: [...heroes.values()],
        abilities: strategy.abilities.filter(({ id }) => active.has(id)).map((ability) => ({ ...ability, visible: true })),
      };
    }
    startMs += phase.durationMs;
  }
  return { phaseLabel: strategy.timeline.at(-1)?.label ?? '', heroes: [...heroes.values()], abilities: [] };
};
