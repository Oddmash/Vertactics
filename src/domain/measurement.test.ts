import { expect, it } from 'vitest';
import { measureSegment } from './measurement';

it('measures horizontal span, signed elevation and direct distance in world units', () => {
  expect(measureSegment([1, 2, 1], [4, 14, 5])).toEqual({ horizontal: 5, rise: 12, distance: 13 });
  expect(measureSegment([4, 14, 5], [1, 2, 1])).toEqual({ horizontal: 5, rise: -12, distance: 13 });
});
