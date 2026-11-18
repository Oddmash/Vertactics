import { parseStrategyDraft } from '../domain/strategy-draft';
import type { StrategyDraft } from '../domain/strategy-draft';

export const sharePrefix = '#strategy=';
export const maxShareCharacters = 12_000;
const maxDraftBytes = 5 * 1024 * 1024;

export const encodeStrategyShare = async (draft: StrategyDraft): Promise<string> => {
  const source = new Blob([JSON.stringify(draft)]);
  if (source.size > maxDraftBytes) throw new Error('Strategy exceeds the expanded size limit');
  const compressed = new Uint8Array(await new Response(source.stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  if (Math.ceil(compressed.length * 4 / 3) > maxShareCharacters) throw new Error('Strategy exceeds the link size limit');
  return btoa(String.fromCharCode(...compressed)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};

export const decodeStrategyShare = async (payload: string): Promise<StrategyDraft> => {
  if (!payload || payload.length > maxShareCharacters || !/^[a-zA-Z0-9_-]+$/.test(payload)) {
    throw new Error('Invalid strategy link');
  }
  const compressed = Uint8Array.from(atob(payload.replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0));
  const reader = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let totalBytes = 0;
  const parts: string[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxDraftBytes) throw new Error('Shared strategy exceeds the expanded size limit');
      parts.push(decoder.decode(value, { stream: true }));
    }
    parts.push(decoder.decode());
    return parseStrategyDraft(JSON.parse(parts.join('')));
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
};
