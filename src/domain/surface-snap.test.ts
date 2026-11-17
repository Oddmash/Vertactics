import { expect, it } from 'vitest';
import { snapSurfacePoint } from './surface-snap';

it('rounds horizontal coordinates while preserving the picked elevation', () => {
  expect(snapSurfacePoint([7.3, 2, 5.2], [8, 1, 6], [4, 2, 6])).toEqual([7, 2, 5]);
});

it('stays inside the tread and keeps the hit coordinate when it has no grid intersection', () => {
  expect(snapSurfacePoint([0.6, 0.5, 1.8], [0.9, 0.25, 1.7], [0.8, 0.5, 0.4])).toEqual([1, 0.5, 1.8]);
});
