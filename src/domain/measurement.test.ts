import { expect, it } from 'vitest';
import { measureRoute, measureSegment } from './measurement';

it('measures horizontal span, signed elevation and direct distance in world units', () => {
  expect(measureSegment([1, 2, 1], [4, 14, 5])).toEqual({ horizontal: 5, rise: 12, distance: 13 });
  expect(measureSegment([4, 14, 5], [1, 2, 1])).toEqual({ horizontal: 5, rise: -12, distance: 13 });
});

it('adds the lengths of waypoint segments, including changes in elevation', () => {
  expect(measureRoute([[0, 0, 0], [3, 12, 4], [3, 0, 9]])).toEqual({ horizontal: 10, distance: 26 });
  expect(measureRoute([[0, 2, 0], [0, 5, 0]])).toEqual({ horizontal: 0, distance: 3 });
  expect(measureRoute([[0, 0, 0]])).toEqual({ horizontal: 0, distance: 0 });
});
