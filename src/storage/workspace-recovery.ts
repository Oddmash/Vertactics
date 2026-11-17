import { parseStrategyDraft } from './strategy-draft';
import type { StrategyDraft } from './strategy-draft';

const recoveryKey = 'vertactics-workspace-recovery';

export const readWorkspaceRecovery = (): StrategyDraft | null => {
  const stored = localStorage.getItem(recoveryKey);
  return stored === null ? null : parseStrategyDraft(JSON.parse(stored));
};

export const saveWorkspaceRecovery = (draft: StrategyDraft): void => {
  localStorage.setItem(recoveryKey, JSON.stringify(draft));
};

export const clearWorkspaceRecovery = (): void => {
  localStorage.removeItem(recoveryKey);
};
