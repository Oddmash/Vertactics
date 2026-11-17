import { Button } from './ui/controls';
import { useLocale } from './ui/locale';
import { useEffect, useState } from 'react';
import Editor from './editor/editor';
import SharedStrategyView from './editor/shared-strategy-view';
import { decodeStrategyShare, sharePrefix } from './storage/strategy-share';
import type { StrategyDraft } from './domain/strategy-draft';

const App = () => {
  const { t } = useLocale();
  const [hash, setHash] = useState(() => window.location.hash);
  const [initialDraft, setInitialDraft] = useState<StrategyDraft>();
  const [response, setResponse] = useState<{ hash: string; draft?: StrategyDraft }>();

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  useEffect(() => {
    if (!hash.startsWith(sharePrefix)) return;
    let active = true;
    void decodeStrategyShare(hash.slice(sharePrefix.length)).then(
      (draft) => { if (active) setResponse({ hash, draft }); },
      () => { if (active) setResponse({ hash }); },
    );
    return () => { active = false; };
  }, [hash]);

  const openEditor = (draft?: StrategyDraft) => {
    setInitialDraft(draft && { ...draft, strategy: { ...draft.strategy, id: crypto.randomUUID() } });
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState(null, '', url);
    setHash('');
  };

  if (!hash.startsWith(sharePrefix)) return <Editor initialDraft={initialDraft} />;
  if (response?.hash !== hash) return <main className="hero-tools"><p role="status">{t('공유 전략을 여는 중')}</p></main>;
  const shared = response.draft;
  if (shared) return <SharedStrategyView key={hash} draft={shared} onDuplicate={() => openEditor(shared)} />;
  return <main className="hero-tools">
    <h1>{t('공유 링크를 열 수 없습니다.')}</h1>
    <Button type="button" className="reset-button" onClick={() => openEditor()}>{t('편집기 열기')}</Button>
  </main>;
};

export default App;
