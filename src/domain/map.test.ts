import { describe, expect, it } from 'vitest';
import mapJson from '../map/elevation-lab.json';
import { mapBounds, parseMap, terrainBlocks, topElevation } from './map';

describe('map schema', () => {
  it('loads the versioned blockout and computes its world bounds', () => {
    const map = parseMap(mapJson);
    expect(map.terrain).toHaveLength(10);
    expect(mapBounds(map.terrain)).toEqual({
      min: [-18, -0.65, -12],
      max: [18, 4, 12],
      center: [0, 1.675, 0],
    });
  });

  it('rejects unsupported versions and duplicate terrain IDs', () => {
    expect(() => parseMap({ ...mapJson, schemaVersion: 2 })).toThrow(/unsupported/);
    expect(() => parseMap({ ...mapJson, terrain: [mapJson.terrain[0], mapJson.terrain[0]] }))
      .toThrow(/Duplicate terrain id/);
  });

  it('validates layer references and keeps older maps loadable', () => {
    expect(parseMap(mapJson).layers?.map(({ id }) => id)).toEqual(['ground', 'upper']);
    expect(() => parseMap({ ...mapJson, layers: [] })).toThrow(/layer ID/);
    expect(() => parseMap({ ...mapJson, layers: [mapJson.layers[0], mapJson.layers[0]] })).toThrow(/layer ID/);
    expect(parseMap({ ...mapJson, layers: undefined, terrain: [{ ...mapJson.terrain[0], layerId: undefined }] }).layers)
      .toBeUndefined();
  });

  it('rejects invalid vectors, nonpositive sizes, and invalid stairs', () => {
    const wall = mapJson.terrain.find(({ kind }) => kind === 'wall');
    const stairs = mapJson.terrain.find(({ kind }) => kind === 'stairs');
    for (const item of [
      { ...wall, origin: Object.assign(Array<number>(3), { 1: 0, 2: 0 }) },
      { ...wall, origin: [0, Infinity, 0] },
      { ...wall, size: [1, 0, 1] },
      { ...stairs, steps: 1 },
      { ...stairs, risesToward: '+y' },
    ]) {
      expect(() => parseMap({ ...mapJson, terrain: [item] })).toThrow(/terrain\[0\]/);
    }
  });
});

describe('terrain geometry', () => {
  it('places a box by its minimum corner and converts it to a render center', () => {
    const terrain = parseMap(mapJson).terrain.find(({ id }) => id === 'west-deck')!;
    expect(terrainBlocks(terrain)).toEqual([{ center: [-9.5, 2, -5], size: [11, 4, 8] }]);
    expect(topElevation(terrain)).toBe(4);
  });

  it.each([
    ['+x', [11, 21, 33], [15, 23, 33]],
    ['-x', [15, 21, 33], [11, 23, 33]],
    ['+z', [13, 21, 31], [13, 23, 35]],
    ['-z', [13, 21, 35], [13, 23, 31]],
  ] as const)('expands stairs toward %s from a shared base elevation', (risesToward, first, last) => {
    const terrain = {
      id: 'steps',
      name: 'Steps',
      kind: 'stairs' as const,
      origin: [10, 20, 30] as [number, number, number],
      size: [6, 6, 6] as [number, number, number],
      steps: 3,
      risesToward,
    };
    const blocks = terrainBlocks(terrain);
    expect(blocks).toHaveLength(3);
    expect(blocks[0]?.center).toEqual(first);
    expect(blocks[2]?.center).toEqual(last);
    expect(blocks.map(({ size }) => size[1])).toEqual([2, 4, 6]);
    expect(topElevation(terrain)).toBe(26);
  });
});

it('validates terrain properties and preserves the doorway opening', () => {
  const map = parseMap({
    ...mapJson, layers: undefined,
    terrain: [{
      id: 'door', name: 'Door', kind: 'doorway', origin: [0, 0, 0], size: [10, 5, 2],
      walkable: false, collision: true, blocksSight: true, material: '#173abc',
    }],
  });
  const doorway = map.terrain[0]!;
  expect(doorway).toMatchObject({ walkable: false, collision: true, blocksSight: true, material: '#173abc' });
  expect(terrainBlocks(doorway)).toEqual([
    { center: [0.75, 2, 1], size: [1.5, 4, 2] },
    { center: [9.25, 2, 1], size: [1.5, 4, 2] },
    { center: [5, 4.5, 1], size: [10, 1, 2] },
  ]);
  expect(() => parseMap({ ...map, terrain: [{ ...doorway, material: 'url()' }] })).toThrow(/metadata/);
});
