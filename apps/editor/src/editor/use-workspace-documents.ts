import { useCallback, useMemo, useState } from 'react';
import type { MapDefinition } from '../domain/map';
import { createStrategy } from '../domain/strategy';
import { createStrategyHistory, reduceStrategyHistory } from '../domain/strategy-history';
import type { StrategyAction, StrategyHistory } from '../domain/strategy-history';
import { maps } from '../map';
import type { StrategyDraft } from '../domain/strategy-draft';
import useWorkspaceRecovery from './use-workspace-recovery';

const useWorkspaceDocuments = (initialDraft?: StrategyDraft) => {
  const [mapId, setMapId] = useState(initialDraft?.map.id ?? maps[0]!.id);
  const [restoredMaps, setRestoredMaps] = useState<Record<string, MapDefinition>>(() =>
    initialDraft ? { [initialDraft.map.id]: initialDraft.map } : {});
  const [histories, setHistories] = useState<Record<string, StrategyHistory>>(() =>
    initialDraft ? { [initialDraft.map.id]: createStrategyHistory(initialDraft.strategy) } : {});
  const [revision, setRevision] = useState(0);
  const map = (Object.hasOwn(restoredMaps, mapId) ? restoredMaps[mapId] : maps.find(({ id }) => id === mapId))!;
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

  const restoreDraft = ({ map: savedMap, strategy }: StrategyDraft, persist: boolean) => {
    setRestoredMaps((current) => ({ ...current, [savedMap.id]: savedMap }));
    setHistories((current) => ({ ...current, [savedMap.id]: createStrategyHistory(strategy) }));
    setMapId(savedMap.id);
    if (persist) setRevision((value) => value + 1);
  };

  return { catalogue: maps, map, history, draft, recovery, editStrategy, openMap: setMapId, restoreDraft };
};

export default useWorkspaceDocuments;
