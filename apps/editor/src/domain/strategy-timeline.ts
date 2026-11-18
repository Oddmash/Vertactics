import { isWorldPoint } from './map';
import type { WorldPoint } from './map';

type HeroPose = {
  heroPlacementId: string;
  position: WorldPoint;
  yaw: number;
};

type AbilityEvent = {
  id: string;
  abilityPlacementId: string;
  offsetMs: number;
  durationMs: number;
};

export type StrategyPhase = {
  id: string;
  label: string;
  durationMs: number;
  poses: HeroPose[];
  events: AbilityEvent[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isTime = (value: unknown, min: number): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min;

export const parseStrategyTimeline = (
  value: unknown,
  heroIds: ReadonlySet<string>,
  abilityIds: ReadonlySet<string>,
): StrategyPhase[] => {
  if (!Array.isArray(value)) throw new Error('Invalid strategy timeline');
  const phaseIds = new Set<string>();
  const eventIds = new Set<string>();
  let totalMs = 0;
  return Array.from(value, (phase: unknown, index): StrategyPhase => {
    const error = () => new Error(`Invalid timeline phase at index ${index}`);
    if (!isRecord(phase)) throw error();
    const { id, label, durationMs, poses, events } = phase;
    if (!isText(id) || phaseIds.has(id) || !isText(label) || !isTime(durationMs, 1) ||
      !Array.isArray(poses) || !Array.isArray(events) || !Number.isSafeInteger(totalMs + durationMs)) throw error();
    phaseIds.add(id);
    totalMs += durationMs;
    const posed = new Set<string>();
    return {
      id, label: label.trim(), durationMs,
      poses: Array.from(poses, (pose: unknown): HeroPose => {
        if (!isRecord(pose)) throw error();
        const { heroPlacementId, position, yaw } = pose;
        if (!isText(heroPlacementId) || !heroIds.has(heroPlacementId) || posed.has(heroPlacementId) ||
          !isWorldPoint(position) || typeof yaw !== 'number' || !(yaw >= 0 && yaw < 360)) throw error();
        posed.add(heroPlacementId);
        return { heroPlacementId, position: [...position], yaw };
      }),
      events: Array.from(events, (event: unknown): AbilityEvent => {
        if (!isRecord(event)) throw error();
        const { id: eventId, abilityPlacementId, offsetMs, durationMs: eventDuration } = event;
        if (!isText(eventId) || eventIds.has(eventId) || !isText(abilityPlacementId) ||
          !abilityIds.has(abilityPlacementId) || !isTime(offsetMs, 0) ||
          !isTime(eventDuration, 1) || eventDuration > durationMs - offsetMs) throw error();
        eventIds.add(eventId);
        return { id: eventId, abilityPlacementId, offsetMs, durationMs: eventDuration };
      }),
    };
  });
};
