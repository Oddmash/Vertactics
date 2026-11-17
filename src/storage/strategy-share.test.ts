import { expect, it } from 'vitest';
import { gzipSync } from 'node:zlib';
import { parseMap } from '../domain/map';
import { createStrategy } from '../domain/strategy';
import { decodeStrategyShare, encodeStrategyShare, maxShareCharacters } from './strategy-share';
import type { StrategyDraft } from './strategy-draft';

const map = parseMap({
  schemaVersion: 2, id: 'map', name: '지도',
  terrain: [{ id: 'floor', name: '바닥', kind: 'floor', origin: [0, -1, 0], size: [4, 1, 4] }],
});
const draft: StrategyDraft = { version: 1, map, strategy: createStrategy('plan', map.id, '전략') };

it('round-trips a Unicode strategy in a URL-safe payload', async () => {
  const encoded = await encodeStrategyShare(draft);
  expect(encoded).toMatch(/^[a-zA-Z0-9_-]+$/);
  await expect(decodeStrategyShare(encoded)).resolves.toEqual(draft);
});

it('rejects malformed, incompatible and oversized share payloads', async () => {
  const encodeRaw = (source: string) => gzipSync(source).toString('base64url');
  await expect(decodeStrategyShare('not_gzip')).rejects.toThrow();
  await expect(decodeStrategyShare(encodeRaw(JSON.stringify({ ...draft, version: 2 })))).rejects.toThrow();
  await expect(decodeStrategyShare('a'.repeat(maxShareCharacters + 1))).rejects.toThrow();
  await expect(decodeStrategyShare(encodeRaw('a'.repeat(5 * 1024 * 1024 + 1)))).rejects.toThrow(/expanded size/);

  let seed = 17;
  const title = Array.from({ length: 24_000 }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return String.fromCharCode(33 + (seed >>> 16) % 90);
  }).join('');
  await expect(encodeStrategyShare({ ...draft, strategy: { ...draft.strategy, title } })).rejects.toThrow(/link size/);
});
