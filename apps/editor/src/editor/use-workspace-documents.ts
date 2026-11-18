import { useCallback, useMemo, useRef, useState } from 'react';
import { mapSchemaVersion, parseMap } from '../domain/map';
import type { MapDefinition } from '../domain/map';
import { createStrategy } from '../domain/strategy';
import { createStrategyHistory, reduceStrategyHistory } from '../domain/strategy-history';
import type { StrategyAction, StrategyHistory } from '../domain/strategy-history';
import { maps } from '../map';
import type { StrategyDraft } from '../domain/strategy-draft';
import useWorkspaceRecovery from './use-workspace-recovery';

type MapHistory = { past: MapDefinition[]; future: MapDefinition[] };

const emptyMapHistory: MapHistory = { past: [], future: [] };

const useWorkspaceDocuments = (initialDraft?: StrategyDraft) => {
  const [catalogue, setCatalogue] = useState(() => initialDraft
    ? [...maps.filter(({ id }) => id !== initialDraft.map.id), initialDraft.map] : maps);
  const [mapId, setMapId] = useState(initialDraft?.map.id ?? maps[0]!.id);
  const [mapHistories, setMapHistories] = useState<Record<string, MapHistory>>({});
  const [histories, setHistories] = useState<Record<string, StrategyHistory>>(() =>
    initialDraft ? { [initialDraft.map.id]: createStrategyHistory(initialDraft.strategy) } : {});
  const [revision, setRevision] = useState(0);
  const [importMessage, setImportMessage] = useState('');
  const [mapMessage, setMapMessage] = useState('');
  const importRequest = useRef(0);

  const map = catalogue.find(({ id }) => id === mapId)!;
  const timeline = Object.hasOwn(mapHistories, mapId) ? mapHistories[mapId]! : emptyMapHistory;
  const initialHistory = useMemo(() => createStrategyHistory(createStrategy('local-draft', mapId, '새 전략')), [mapId]);
  const history = Object.hasOwn(histories, mapId) ? histories[mapId]! : initialHistory;
  const draft: StrategyDraft = useMemo(() => ({ version: 1, map, strategy: history.present }), [map, history.present]);
  const recovery = useWorkspaceRecovery(draft, revision);

  const editStrategy = useCallback((action: StrategyAction) => {
    setRevision((value) => value + 1);
    setHistories((current) => ({
      ...current,
      [mapId]: reduceStrategyHistory(Object.hasOwn(current, mapId) ? current[mapId]! : initialHistory, action),
    }));
  }, [initialHistory, mapId]);

  const openMap = (id: string) => {
    setMapMessage('');
    setMapId(id);
  };

  const addMap = (next: MapDefinition) => {
    setCatalogue((current) => current.some(({ id }) => id === next.id) ? current : [...current, next]);
    openMap(next.id);
    setRevision((value) => value + 1);
  };

  const createMap = (name: string, floorName: string) => {
    addMap(parseMap({
      schemaVersion: mapSchemaVersion, id: crypto.randomUUID(), name, metadata: { verification: 'synthetic' },
      terrain: [{ id: 'base', name: floorName, kind: 'floor', origin: [-8, -1, -8], size: [16, 1, 16] }],
    }));
  };

  const importMap = async (file: File) => {
    const request = ++importRequest.current;
    let imported: MapDefinition;
    try {
      if (file.size > 1_000_000) throw new Error('Map file too large');
      imported = parseMap(JSON.parse(await file.text()));
    } catch {
      if (request === importRequest.current) setImportMessage('지도 JSON을 읽을 수 없습니다.');
      return false;
    }
    if (request !== importRequest.current) return false;
    if (catalogue.some(({ id }) => id === imported.id)) {
      setImportMessage('같은 ID의 지도가 이미 있습니다.');
      return false;
    }
    addMap(imported);
    setImportMessage('');
    return true;
  };

  const restoreDraft = ({ map: savedMap, strategy }: StrategyDraft, persist: boolean) => {
    ++importRequest.current;
    setImportMessage('');
    setCatalogue((current) => current.some(({ id }) => id === savedMap.id)
      ? current.map((item) => item.id === savedMap.id ? savedMap : item)
      : [...current, savedMap]);
    setHistories((current) => ({ ...current, [savedMap.id]: createStrategyHistory(strategy) }));
    setMapHistories((current) => ({ ...current, [savedMap.id]: emptyMapHistory }));
    openMap(savedMap.id);
    if (persist) setRevision((value) => value + 1);
  };

  const replaceMap = (next: MapDefinition) => {
    setRevision((value) => value + 1);
    setCatalogue((current) => current.map((item) => item.id === next.id ? next : item));
    setMapMessage('');
  };

  const updateTerrain = (terrain: unknown[], layers = map.layers) => {
    try {
      const metadata = map.metadata?.verification === 'verified' ? { ...map.metadata, verification: 'unverified' } : map.metadata;
      const next = parseMap({ ...map, terrain, metadata, layers });
      setMapHistories((current) => ({ ...current, [mapId]: { past: [...timeline.past, map], future: [] } }));
      replaceMap(next);
      return next;
    } catch {
      setMapMessage('지형 값을 확인하세요. 지도에는 블록이 한 개 이상 필요합니다.');
      return undefined;
    }
  };

  const moveMapHistory = (direction: 'undo' | 'redo') => {
    const stack = direction === 'undo' ? timeline.past : timeline.future;
    const next = stack.at(-1);
    if (!next) return undefined;
    setMapHistories((current) => ({
      ...current,
      [mapId]: direction === 'undo'
        ? { past: stack.slice(0, -1), future: [...timeline.future, map] }
        : { past: [...timeline.past, map], future: stack.slice(0, -1) },
    }));
    replaceMap(next);
    return next;
  };

  return {
    catalogue, map, history, timeline, draft, recovery, importMessage, mapMessage,
    editStrategy, openMap, createMap, importMap, restoreDraft, updateTerrain, moveMapHistory,
  };
};

export default useWorkspaceDocuments;
