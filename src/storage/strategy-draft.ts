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
const draftKey = 'workspace';

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

export const saveStrategyDraft = async (draft: StrategyDraft): Promise<void> => {
  const snapshot = parseDraft(draft);
  await transactDraft('readwrite', (store) => store.put(snapshot, draftKey));
};

export const loadStrategyDraft = async (): Promise<StrategyDraft | undefined> => {
  const value: unknown = await transactDraft('readonly', (store) => store.get(draftKey));
  return value === undefined ? undefined : parseDraft(value);
};
