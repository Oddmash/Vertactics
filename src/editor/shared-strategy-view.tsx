import { Button } from '../ui/controls';
import { useLocale } from '../ui/locale';
import LocalePicker from '../ui/locale-picker';
import { useRef, useState } from 'react';
import type { StrategyDraft } from '../domain/strategy-draft';
import MapViewport from '../render/map-viewport';
import type { ViewMode } from '../render/map-camera';
import { sampleTimeline, timelineDuration } from '../domain/timeline-playback';
import { downloadFile, fileStem } from './download-file';
import TimelinePlaybackControls from './timeline-playback-controls';
import useTimelinePlayback from './use-timeline-playback';

const SharedStrategyView = ({ draft, onDuplicate }: { draft: StrategyDraft; onDuplicate: () => void }) => {
  const { t } = useLocale();
  const { map, strategy } = draft;
  const [mode, setMode] = useState<ViewMode>('3d');
  const [reset, setReset] = useState(0);
  const [message, setMessage] = useState('');
  const capture = useRef<(() => Promise<Blob>) | null>(null);
  const durationMs = timelineDuration(strategy.timeline);
  const { state: playback, start, stop, toggle, seek, changeSpeed } = useTimelinePlayback(durationMs);
  const frame = playback ? sampleTimeline(strategy, playback.timeMs) : null;
  const stem = fileStem(map.id);

  return (
    <div className="editor">
      <header className="app-header">
        <span className="brand"><img className="brand-mark" src="favicon.png" alt="" width={30} height={30} />Vertactics</span>
        <span>{t('읽기 전용 전략')}</span>
        <LocalePicker />
        <small className="fan-notice">{t('Vertactics는 Blizzard Entertainment와 제휴하지 않은 Overwatch 팬 프로젝트입니다.')}</small>
        <Button type="button" className="reset-button" onClick={onDuplicate}>{t('편집용 복제')}</Button>
      </header>
      <main className="workspace shared-workspace">
        <section className="view-panel panel" aria-labelledby="shared-title">
          <div className="viewport-toolbar">
            <div><h1 id="shared-title">{strategy.title}</h1><p>{t(map.name)}</p></div>
            <div className="viewport-actions">
              <div className="mode-switch" role="group" aria-label={t('지도 보기')}>
                <Button type="button" aria-label={t('2D 탑다운')} aria-pressed={mode === '2d'} onClick={() => setMode('2d')}>2D</Button>
                <Button type="button" aria-label={t('3D 원근')} aria-pressed={mode === '3d'} onClick={() => setMode('3d')}>3D</Button>
              </div>
              <Button type="button" className="reset-button" onClick={() => setReset((value) => value + 1)}>{t('시점 초기화')}</Button>
              <Button type="button" className="reset-button" onClick={() =>
                downloadFile(new Blob([JSON.stringify(draft)], { type: 'application/json' }), `${stem}-strategy.json`)
              }>{t('전략 JSON 내보내기')}</Button>
              <Button type="button" className="reset-button" onClick={() => {
                const take = capture.current;
                setMessage('');
                if (take) void take().then(
                  (image) => downloadFile(image, `${stem}-${mode}.png`),
                  () => setMessage('지도 화면을 PNG로 저장할 수 없습니다.'),
                );
                else setMessage('지도 화면을 PNG로 저장할 수 없습니다.');
              }}>{t('지도 PNG 저장')}</Button>
            </div>
          </div>
          {message && <p role="status">{t(message)}</p>}
          {durationMs > 0 && (playback
            ? <TimelinePlaybackControls durationMs={durationMs} phaseLabel={frame?.phaseLabel ?? ''}
              timeMs={playback.timeMs} playing={playback.playing} speed={playback.speed}
              onToggle={toggle} onSeek={seek} onSpeed={changeSpeed} onExit={stop} exitLabel={t('재생 종료')} />
            : <div className="view-options"><Button type="button" className="reset-button" onClick={start}>{t('전략 재생')}</Button></div>)}
          <div className="viewport" data-testid="viewport">
            <MapViewport map={map} capture={capture} mode={mode} reset={reset} layerId="" snap={false}
              selectedTerrainIds={new Set()} selectedHeroId={null} selectedAnnotationId={null}
              heroes={frame?.heroes ?? strategy.heroes} abilities={frame?.abilities ?? strategy.abilities}
              annotations={strategy.annotations} sightline={null} onSelect={() => {}} onSelectHero={() => {}}
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default SharedStrategyView;
