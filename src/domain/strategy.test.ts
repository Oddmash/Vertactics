import { describe, expect, it } from 'vitest';
import { createStrategy, parseStrategy } from './strategy';

const empty = createStrategy('strategy-1', 'elevation-lab', 'First plan');
const placement = { id: 'p1', heroId: 'tracer', team: 'attack', position: [-9.5, 4, -5], yaw: 90 };

describe('strategy documents', () => {
  it('creates an empty versioned strategy linked to a map', () => {
    expect(empty).toEqual({
      schemaVersion: 1, id: 'strategy-1', mapId: 'elevation-lab', title: 'First plan', heroes: [], annotations: [], abilities: [],
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

describe('strategy annotations', () => {
  it('defaults older v1 documents to an empty annotation collection', () => {
    expect(parseStrategy({ schemaVersion: 1, id: 'old', mapId: 'elevation-lab', title: 'Old', heroes: [] }).annotations)
      .toEqual([]);
  });

  it('preserves route elevations and rejects malformed shapes', () => {
    const route = { id: 'r1', kind: 'route', label: 'Flank', points: [[0, 0, 0], [2, 4, 6]] };
    expect(parseStrategy({ ...empty, annotations: [route] }).annotations).toEqual([route]);
    expect(() => parseStrategy({ ...empty, annotations: [route, route] })).toThrow(/duplicate/);
    expect(() => parseStrategy({ ...empty, annotations: [{ ...route, kind: 'note' }] })).toThrow(/point count/);
  });
});

describe('strategy abilities', () => {
  const ability = {
    id: 'ability-1', heroId: 'tracer', abilityId: 'blink', shape: 'vector', range: 8,
    width: 1, angle: 60, direction: 0, verification: 'custom', position: [2, 4, 6], heading: 90, visible: true,
  };

  it('round-trips an independent ability and initializes legacy documents', () => {
    const document = { ...empty, abilities: [ability] };
    expect(parseStrategy(JSON.parse(JSON.stringify(document)))).toEqual(document);
    expect(parseStrategy({ ...empty, abilities: undefined }).abilities).toEqual([]);
  });

  it('rejects duplicate ids, invalid geometry and unrecognized provenance', () => {
    expect(() => parseStrategy({ ...empty, abilities: [ability, ability] })).toThrow(/abilities/);
    for (const patch of [{ width: Infinity }, { heading: NaN }, { position: [0, 0] }, { verification: 'verified' }]) {
      expect(() => parseStrategy({ ...empty, abilities: [{ ...ability, ...patch }] })).toThrow(/abilities/);
    }
  });
});
