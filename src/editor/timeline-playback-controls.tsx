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
};

const TimelinePlaybackControls = ({ durationMs, phaseLabel, timeMs, playing, speed, onToggle, onSeek, onSpeed, onExit }: Props) => (
  <section className="view-options" aria-label="전략 재생">
    <button type="button" className="reset-button" onClick={onToggle}>{playing ? '일시정지' : '재생'}</button>
    <label>재생 위치 <input aria-label="재생 위치" type="range" min={0} max={durationMs} step={1}
      value={Math.round(timeMs)} onChange={(event) => onSeek(event.target.valueAsNumber)}
    /></label>
    <span>{phaseLabel} · {(timeMs / 1000).toFixed(2)} / {(durationMs / 1000).toFixed(2)}초</span>
    <label>재생 속도 <select aria-label="재생 속도" value={speed} onChange={(event) => onSpeed(Number(event.target.value))}>
      <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option>
    </select></label>
    <button type="button" className="reset-button" onClick={onExit}>편집으로 돌아가기</button>
  </section>
);

export default TimelinePlaybackControls;
