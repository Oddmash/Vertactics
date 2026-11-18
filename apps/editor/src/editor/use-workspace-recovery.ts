import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { clearWorkspaceRecovery, readWorkspaceRecovery, saveWorkspaceRecovery } from '../storage/workspace-recovery';
import type { StrategyDraft } from '../domain/strategy-draft';

const readRecovery = () => {
  try {
    return { saved: readWorkspaceRecovery(), unreadable: false };
  } catch {
    return { saved: null, unreadable: true };
  }
};

const useWorkspaceRecovery = (draft: StrategyDraft, revision: number) => {
  const [recovery, setRecovery] = useState(readRecovery);
  const [result, setResult] = useState<{ revision: number; saved: boolean }>();
  const seenRevision = useRef(0);
  const pending = useRef<{ draft: StrategyDraft; revision: number } | null>(null);

  const flush = useCallback(() => {
    if (recovery.saved || !pending.current) return;
    const change = pending.current;
    try {
      saveWorkspaceRecovery(change.draft);
      pending.current = null;
      setResult({ revision: change.revision, saved: true });
    } catch {
      setResult({ revision: change.revision, saved: false });
    }
  }, [recovery.saved]);

  useLayoutEffect(() => {
    if (revision === seenRevision.current) return;
    seenRevision.current = revision;
    pending.current = { draft, revision };
  }, [draft, revision]);

  useEffect(() => {
    if (recovery.saved || !pending.current) return;
    const timeout = window.setTimeout(flush, 350);
    return () => window.clearTimeout(timeout);
  }, [flush, recovery.saved, revision]);

  useEffect(() => {
    window.addEventListener('pagehide', flush);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [flush]);

  const restore = () => {
    const saved = recovery.saved;
    pending.current = null;
    if (saved) setResult({ revision, saved: true });
    setRecovery({ saved: null, unreadable: false });
    return saved;
  };

  const discard = () => {
    try {
      clearWorkspaceRecovery();
      setRecovery({ saved: null, unreadable: false });
    } catch {
      setResult({ revision, saved: false });
    }
  };

  return {
    saved: recovery.saved,
    unreadable: recovery.unreadable,
    status: result?.revision === revision ? result.saved ? 'saved' : 'error' : revision > 0 ? 'pending' : 'idle',
    discard,
    restore,
  } as const;
};

export default useWorkspaceRecovery;
