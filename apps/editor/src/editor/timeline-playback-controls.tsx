import { Button, Input, Select } from '../ui/controls';
import { useLocale } from '../ui/locale';
type Props = {
  durationMs: number;
  phaseLabel: string;
  timeMs: number;
  playing: boolean;
  speed: number;
  onToggle: () => void;
  onSeek: (time: number) => void;
  onSpeed: (speed: number) => void;
  onExit: () => void;
  exitLabel?: string;
};

const TimelinePlaybackControls = ({ durationMs, phaseLabel, timeMs, playing, speed, onToggle, onSeek, onSpeed, onExit, exitLabel = '편집으로 돌아가기' }: Props) => {
  const { t } = useLocale();
  return (
    <section className="view-options" aria-label={t('전략 재생')}>
      <Button type="button" className="reset-button" onClick={onToggle}>{playing ? t('일시정지') : t('재생')}</Button>
      <label>{t('재생 위치') + ' '}<Input aria-label={t('재생 위치')} type="range" min={0} max={durationMs} step={1}
        value={Math.round(timeMs)} onChange={(event) => onSeek(event.target.valueAsNumber)}
      /></label>
      <span>{phaseLabel} · {(timeMs / 1000).toFixed(2)} / {(durationMs / 1000).toFixed(2)}{t('초')}</span>
      <label>{t('재생 속도') + ' '}<Select aria-label={t('재생 속도')} value={speed} onChange={(event) => onSpeed(Number(event.target.value))}>
        <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option>
      </Select></label>
      <Button type="button" className="reset-button" onClick={onExit}>{t(exitLabel)}</Button>
    </section>
  );
};

export default TimelinePlaybackControls;
