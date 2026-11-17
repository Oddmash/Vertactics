import { useRef, useState } from 'react';
import { parseStrategyDraft } from '../storage/strategy-draft';
import type { StrategyDraft } from '../storage/strategy-draft';
import { downloadFile, fileStem } from './download-file';

type Props = {
  draft: StrategyDraft;
  onImport: (draft: StrategyDraft) => void;
};

const maxBytes = 5 * 1024 * 1024;

const StrategyFileTools = ({ draft, onImport }: Props) => {
  const [pending, setPending] = useState<StrategyDraft>();
  const [message, setMessage] = useState('');
  const requestId = useRef(0);

  const read = async (file: File) => {
    const id = ++requestId.current;
    setPending(undefined);
    setMessage('');
    if (file.size > maxBytes) {
      setMessage('5 MiB 이하의 전략 JSON을 선택하세요.');
      return;
    }
    try {
      const parsed = parseStrategyDraft(JSON.parse(await file.text()));
      if (id === requestId.current) setPending(parsed);
    } catch {
      if (id === requestId.current) setMessage('전략 JSON을 읽을 수 없습니다. 파일 형식과 버전을 확인하세요.');
    }
  };

  return (
    <section className="hero-tools" aria-label="전략 파일">
      <h2>전략 파일</h2>
      <label className="strategy-name">전략 JSON 가져오기 <input type="file" accept=".json,application/json" onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) void read(file);
      }} /></label>
      <button type="button" className="reset-button" onClick={() => {
        setMessage('');
        const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
        if (blob.size > maxBytes) {
          setMessage('전략 JSON이 5 MiB를 초과합니다.');
          return;
        }
        downloadFile(blob, `${fileStem(draft.map.id)}-strategy.json`);
      }}>전략 JSON 내보내기</button>
      {pending && <div className="pending-edit">
        <p>{pending.map.name} · {pending.strategy.title}</p>
        <p>같은 지도의 현재 편집 내용이 파일의 내용으로 바뀝니다.</p>
        <div className="hero-actions">
          <button type="button" className="reset-button" onClick={() => {
            onImport({ ...pending, strategy: { ...pending.strategy, id: crypto.randomUUID() } });
            setPending(undefined);
            setMessage('전략 파일을 열었습니다.');
          }}>전략 파일 열기</button>
          <button type="button" className="reset-button" onClick={() => setPending(undefined)}>가져오기 취소</button>
        </div>
      </div>}
      {message && <p role="status">{message}</p>}
    </section>
  );
};

export default StrategyFileTools;
