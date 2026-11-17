import { parseMap } from '../domain/map';
import type { MapDefinition } from '../domain/map';
import { parseStrategy } from '../domain/strategy';
import type { StrategyDocument } from '../domain/strategy';

export type StrategyDraft = {
  version: 1;
  map: MapDefinition;
  strategy: StrategyDocument;
};

const storeName = 'drafts';
export type SavedStrategyDraft = {
  id: string;
  updatedAt: number;
  draft: StrategyDraft;
};

const parseDraft = (value: unknown): StrategyDraft => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Invalid strategy draft');
  }
  const { version, map, strategy } = value as Record<string, unknown>;
  if (version !== 1) throw new Error('Unsupported strategy draft version');
  const parsedMap = parseMap(map);
  const parsedStrategy = parseStrategy(strategy);
  if (parsedMap.id !== parsedStrategy.mapId) throw new Error('Strategy draft map mismatch');
  return { version, map: parsedMap, strategy: parsedStrategy };
};

const openDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('vertactics-strategy', 1);
  let blocked = false;
  request.onupgradeneeded = () => request.result.createObjectStore(storeName);
  request.onerror = () => reject(request.error);
  request.onblocked = () => {
    blocked = true;
    reject(new Error('Strategy database is blocked'));
  };
  request.onsuccess = () => {
    const database = request.result;
    if (blocked) {
      database.close();
      return;
    }
    database.onversionchange = () => database.close();
    resolve(database);
  };
});

const transactDraft = async <T,>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const request = operation(transaction.objectStore(storeName));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error ?? request.error ?? new Error('Strategy transaction aborted'));
    });
  } finally {
    database.close();
  }
};

export const saveStrategyDraft = async (
  draft: StrategyDraft,
  title: string,
  existingId?: string,
): Promise<SavedStrategyDraft> => {
  const id = existingId ?? crypto.randomUUID();
  const snapshot = parseDraft({ ...draft, strategy: { ...draft.strategy, id, title } });
  const saved = { id, updatedAt: Date.now(), draft: snapshot };
  await transactDraft('readwrite', (store) => existingId ? store.put(saved, id) : store.add(saved, id));
  return saved;
};

export const deleteStrategyDraft = async (id: string): Promise<void> => {
  await transactDraft('readwrite', (store) => store.delete(id));
};

export const listStrategyDrafts = async (): Promise<{ drafts: SavedStrategyDraft[]; unreadable: number }> => {
  const values: unknown[] = await transactDraft('readonly', (store) => store.getAll());
  const drafts: SavedStrategyDraft[] = [];
  let unreadable = 0;
  for (const value of values) {
    try {
      if (typeof value !== 'object' || value === null) throw new Error('Invalid saved strategy');
      if ('draft' in value) {
        const draft = parseDraft(value.draft);
        if (!('id' in value) || value.id !== draft.strategy.id ||
          !('updatedAt' in value) || typeof value.updatedAt !== 'number' ||
          !Number.isFinite(value.updatedAt)) throw new Error('Invalid saved strategy metadata');
        drafts.push({ id: value.id, updatedAt: value.updatedAt, draft });
      } else {
        const draft = parseDraft(value);
        drafts.push({ id: 'workspace', updatedAt: 0, draft });
      }
    } catch {
      unreadable++;
    }
  }
  drafts.sort((first, second) => second.updatedAt - first.updatedAt || first.id.localeCompare(second.id));
  return { drafts, unreadable };
};
