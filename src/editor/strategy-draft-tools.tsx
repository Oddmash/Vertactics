import { Button, Input } from '../ui/controls';
import { useLocale } from '../ui/locale';
import { useState } from 'react';
import { deleteStrategyDraft, listStrategyDrafts, saveStrategyDraft } from '../storage/strategy-draft';
import type { SavedStrategyDraft } from '../storage/strategy-draft';
import type { StrategyDraft } from '../domain/strategy-draft';

type Props = {
  draft: StrategyDraft;
  onRestore: (draft: StrategyDraft) => void;
};

const StrategyDraftTools = ({ draft, onRestore }: Props) => {
  const { locale, t } = useLocale();
  const formatDate = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [drafts, setDrafts] = useState<SavedStrategyDraft[]>();
  const [selectedId, setSelectedId] = useState<string>();
  const [deleting, setDeleting] = useState(false);
  const [active, setActive] = useState<{ id: string; mapId: string; strategyId: string; title: string }>();
  const selected = drafts?.find(({ id }) => id === selectedId);
  const existingId = active?.mapId === draft.map.id && active.strategyId === draft.strategy.id ? active.id : undefined;

  const run = async (operation: () => Promise<void>, errorMessage: string) => {
    setBusy(true);
    setMessage('');
    try {
      await operation();
    } catch {
      setMessage(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  const load = () => run(async () => {
    const result = await listStrategyDrafts();
    setDrafts(result.drafts);
    setSelectedId(result.drafts[0]?.id);
    setDeleting(false);
    if (result.unreadable) setMessage(result.drafts.length > 0
      ? '읽을 수 없는 저장본을 제외했습니다.'
      : '저장된 전략을 읽을 수 없습니다. 현재 편집을 계속할 수 있습니다.');
    else if (result.drafts.length === 0) setMessage('이 브라우저에 저장된 전략이 없습니다.');
  }, '저장된 전략을 읽을 수 없습니다. 현재 편집을 계속할 수 있습니다.');

  const save = (title: string, id?: string) => run(async () => {
    const entry = await saveStrategyDraft(draft, title, id);
    setActive({ id: entry.id, mapId: draft.map.id, strategyId: draft.strategy.id, title: entry.draft.strategy.title });
    setDrafts((current) => current && [entry, ...current.filter((item) => item.id !== entry.id)]);
    setSelectedId(undefined);
    setDeleting(false);
    setMessage('이 브라우저에 전략을 저장했습니다.');
  }, '전략을 저장할 수 없습니다. 브라우저 저장 공간이나 설정을 확인하세요.');

  return (
    <section className="hero-tools" aria-labelledby="strategy-draft-title">
      <h2 id="strategy-draft-title" tabIndex={-1}>{t('로컬 전략')}</h2>
      <form key={JSON.stringify([draft.map.id, draft.strategy.id, existingId, active?.title])} onSubmit={(event) => {
        event.preventDefault();
        const title = String(new FormData(event.currentTarget).get('title')).trim();
        if (!title) return;
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        void save(title, submitter?.getAttribute('value') === 'new' ? undefined : existingId);
      }}>
        <label className="strategy-name">{t('전략 이름') + ' '}<Input name="title" maxLength={80} required
          defaultValue={existingId ? active?.title : draft.strategy.id === 'local-draft' ? t(draft.strategy.title) : draft.strategy.title} />
        </label>
        <div className="hero-actions">
          <Button type="submit" className="reset-button" disabled={busy}>{t('전략 저장')}</Button>
          {existingId && <Button type="submit" className="reset-button" value="new" disabled={busy}>{t('새 이름으로 저장')}</Button>}
          <Button type="button" className="reset-button" disabled={busy} onClick={() => void load()}>{t('저장본 확인')}</Button>
        </div>
      </form>
      {message && <p role="status">{t(message)}</p>}
      {drafts && drafts.length > 0 && <ul className="terrain-list" aria-label={t('저장된 전략')}>
        {drafts.map(({ id, draft: item, updatedAt }) => {
          const updated = new Date(updatedAt);
          return <li key={id}>
          <Button type="button" className="terrain-button saved-strategy" disabled={busy} aria-pressed={selectedId === id}
            onClick={() => { setSelectedId(id); setDeleting(false); }}>
            <span>{item.strategy.title}</span>
            <small>{t(item.map.name)}</small>
            {updatedAt > 0 && Number.isFinite(updated.getTime()) && (
              <small><time dateTime={updated.toISOString()}>{formatDate.format(updated)}</time></small>
            )}
          </Button>
        </li>;
        })}
      </ul>}
      {selected && <div className="pending-edit">
        <p>{t(selected.draft.map.name)} · {selected.draft.strategy.title}</p>
        <p>{t('복원하면 같은 지도의 현재 편집 내용을 저장본으로 바꿉니다.')}</p>
        <div className="hero-actions">
          <Button type="button" className="reset-button" disabled={busy} onClick={() => {
            onRestore(selected.draft);
            setActive({ id: selected.id, mapId: selected.draft.map.id, strategyId: selected.draft.strategy.id,
              title: selected.draft.strategy.title });
            setSelectedId(undefined);
            setMessage('저장된 전략을 복원했습니다.');
          }}>{t('전략 복원')}</Button>
          <Button type="button" className="reset-button" disabled={busy} onClick={() => void run(async () => {
            const duplicate = await saveStrategyDraft(selected.draft, t('{0} 복제', selected.draft.strategy.title));
            setDrafts((current) => [duplicate, ...(current ?? [])]);
            setSelectedId(duplicate.id);
            setDeleting(false);
            setMessage('전략을 복제했습니다.');
          }, t('전략을 복제할 수 없습니다.'))}>{t('전략 복제')}</Button>
          <Button type="button" className="reset-button" disabled={busy} onClick={() => setDeleting(true)}>{t('전략 삭제')}</Button>
          <Button type="button" className="reset-button" disabled={busy}
            onClick={() => { setSelectedId(undefined); setDeleting(false); }}>{t('복원 취소')}</Button>
        </div>
        {deleting && <div className="hero-actions">
          <Button type="button" className="reset-button" disabled={busy} onClick={() => void run(async () => {
            await deleteStrategyDraft(selected.id);
            setDrafts((current) => current?.filter(({ id }) => id !== selected.id));
            if (active?.id === selected.id) setActive(undefined);
            setSelectedId(undefined);
            setDeleting(false);
            setMessage('저장된 전략을 삭제했습니다.');
          }, t('전략을 삭제할 수 없습니다.'))}>{t('삭제 확인')}</Button>
          <Button type="button" className="reset-button" disabled={busy} onClick={() => setDeleting(false)}>{t('삭제 취소')}</Button>
        </div>}
      </div>}
    </section>
  );
};

export default StrategyDraftTools;
