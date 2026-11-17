import { useState } from 'react';
import { loadStrategyDraft, saveStrategyDraft } from '../storage/strategy-draft';
import type { StrategyDraft } from '../storage/strategy-draft';

type Props = {
  draft: StrategyDraft;
  onRestore: (draft: StrategyDraft) => void;
};

const StrategyDraftTools = ({ draft, onRestore }: Props) => {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState<StrategyDraft>();

  const save = async () => {
    setBusy(true);
    setMessage('');
    setSaved(undefined);
    try {
      await saveStrategyDraft(draft);
      setMessage('이 브라우저에 전략을 저장했습니다.');
    } catch {
      setMessage('전략을 저장할 수 없습니다. 브라우저 저장 공간이나 설정을 확인하세요.');
    } finally {
      setBusy(false);
    }
  };

  const load = async () => {
    setBusy(true);
    setMessage('');
    setSaved(undefined);
    try {
      const snapshot = await loadStrategyDraft();
      setSaved(snapshot);
      if (!snapshot) setMessage('이 브라우저에 저장된 전략이 없습니다.');
    } catch {
      setMessage('저장된 전략을 읽을 수 없습니다. 현재 편집을 계속할 수 있습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="hero-tools" aria-labelledby="strategy-draft-title">
      <h2 id="strategy-draft-title">로컬 전략</h2>
      <div className="hero-actions">
        <button type="button" className="reset-button" disabled={busy} onClick={() => void save()}>전략 저장</button>
        <button type="button" className="reset-button" disabled={busy} onClick={() => void load()}>저장본 확인</button>
      </div>
      <p>이 브라우저에 마지막으로 저장한 전략 한 개를 보관합니다.</p>
      {message && <p role="status">{message}</p>}
      {saved && <div className="pending-edit">
        <p>{saved.map.name} · {saved.strategy.title}</p>
        <p>복원하면 저장본의 지도와 전략으로 전환합니다. 같은 지도를 편집 중이면 현재 변경사항을 덮어씁니다.</p>
        <div className="hero-actions">
          <button type="button" className="reset-button" onClick={() => {
            onRestore(saved);
            setSaved(undefined);
            setMessage('저장된 전략을 복원했습니다.');
          }}>전략 복원</button>
          <button type="button" className="reset-button" onClick={() => setSaved(undefined)}>복원 취소</button>
        </div>
      </div>}
    </section>
  );
};

export default StrategyDraftTools;
