import { expect, it } from 'vitest';
import { abilityPolylines, abilityShapes } from './ability-preview';
import type { AbilityPreviewSettings } from './ability-preview';

const settings: AbilityPreviewSettings = {
  abilityId: 'blink', shape: 'line', range: 5, width: 4, angle: 60, direction: 0, verification: 'custom',
};

it('combines hero heading and preview offset around Y', () => {
  const line = abilityPolylines({ ...settings, direction: 45 }, [1, 3, 2], 45);
  expect(line).toEqual([[[1, 3, 2], [6, 3, expect.closeTo(2)]]]);
});

it('produces finite outlines for every shape and elevation for spheres', () => {
  for (const shape of abilityShapes) {
    const outlines = abilityPolylines({ ...settings, shape }, [0, 2, 0], 0);
    expect(outlines.flat().every((point) => point.every(Number.isFinite))).toBe(true);
    expect(outlines.flat()).not.toHaveLength(0);
  }
  const sphere = abilityPolylines({ ...settings, shape: 'sphere' }, [0, 2, 0], 0);
  expect(sphere).toHaveLength(3);
  expect(Math.max(...sphere.flat().map((point) => point[1]))).toBe(7);
});

it('closes the horizontal cone from its origin and spans the configured distance', () => {
  const cone = abilityPolylines({ ...settings, shape: 'cone' }, [0, 2, 0], 0)[0]!;
  expect(cone[0]).toEqual([0, 2, 0]);
  expect(cone.at(-1)).toEqual(cone[0]);
  expect(cone[25]).toEqual([0, 2, -5]);
});
