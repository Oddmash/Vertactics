import { describe, expect, it } from 'vitest';
import { createStrategy, parseStrategy } from './strategy';

const empty = createStrategy('strategy-1', 'elevation-lab', 'First plan');
const placement = { id: 'p1', heroId: 'tracer', team: 'attack', position: [-9.5, 4, -5], yaw: 90 };

describe('strategy documents', () => {
  it('creates an empty versioned strategy linked to a map', () => {
    expect(empty).toEqual({
      schemaVersion: 1, id: 'strategy-1', mapId: 'elevation-lab', title: 'First plan', heroes: [],
    });
  });

  it('round-trips a hero on a high surface without changing coordinates or yaw', () => {
    const document = { ...empty, heroes: [placement] };
    expect(parseStrategy(JSON.parse(JSON.stringify(document)))).toEqual(document);
  });

  it('detaches parsed positions from the input document', () => {
    const document = parseStrategy({ ...empty, heroes: [placement] });
    expect(document.heroes[0]?.position).not.toBe(placement.position);
  });

  it('rejects unsupported versions, missing map IDs, and duplicate placement IDs', () => {
    expect(() => parseStrategy({ ...empty, schemaVersion: 2 })).toThrow(/version/);
    expect(() => createStrategy('strategy-1', '', 'First plan')).toThrow(/strategy/);
    expect(() => parseStrategy({ ...empty, heroes: [placement, placement] })).toThrow(/Duplicate/);
  });

  it.each([
    { team: 'neutral' },
    { heroId: '' },
    { position: [0, Infinity, 0] },
    { position: [1, 2] },
    { yaw: -1 },
    { yaw: 360 },
    { yaw: NaN },
  ])('rejects invalid placement inputs %j', (patch) => {
    expect(() => parseStrategy({ ...empty, heroes: [{ ...placement, ...patch }] })).toThrow(/heroes\[0\]/);
  });
});
