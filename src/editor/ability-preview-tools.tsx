import { useState } from 'react';
import { abilityShapes } from '../domain/ability-preview';
import type { AbilityPreviewSettings, AbilityShape } from '../domain/ability-preview';

const labels: Record<AbilityShape, string> = {
  circle: '원', sphere: '구', cone: '부채꼴', line: '직선',
  rectangle: '전방 직사각형', vector: '방향 화살표', area: '중심 영역',
};

type Props = {
  abilities: { id: string; name: string }[];
  preview: AbilityPreviewSettings | undefined;
  onPreview: (next: AbilityPreviewSettings | undefined) => void;
};

const AbilityPreviewTools = ({ abilities, preview, onPreview }: Props) => {
  const [shape, setShape] = useState<AbilityShape>(preview?.shape ?? 'circle');

  return (
    <details className="hero-tools">
      <summary>능력 범위 미리보기</summary>
      <form onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const ability = abilities.find(({ id }) => id === data.get('ability'));
        if (!ability) return;
        const range = Number(data.get('range'));
        const width = Number(data.get('width') ?? 1);
        const angle = Number(data.get('angle') ?? 60);
        const direction = Number(data.get('direction'));
        if (!(range > 0 && range <= 1000 && width > 0 && width <= 1000 &&
          angle > 0 && angle <= 360 && direction >= -360 && direction <= 360)) return;
        onPreview({ abilityId: ability.id, shape, range, width, angle, direction, verification: 'custom' });
      }}>
        <label>능력 <select name="ability" aria-label="능력" defaultValue={preview?.abilityId}>
          {abilities.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
        </select></label>
        <label>형태 <select name="shape" aria-label="미리보기 형태" value={shape} onChange={(event) => {
          const next = abilityShapes.find((value) => value === event.target.value);
          if (next) setShape(next);
        }}>
          {abilityShapes.map((value) => <option key={value} value={value}>{labels[value]}</option>)}
        </select></label>
        <label>범위 (u) <input name="range" type="number" min="0.1" max="1000" step="any" required defaultValue={preview?.range ?? 5} /></label>
        {(shape === 'rectangle' || shape === 'area') && <label>폭 (u) <input
          name="width" type="number" min="0.1" max="1000" step="any" required defaultValue={preview?.width ?? 4}
        /></label>}
        {shape === 'cone' && <label>부채꼴 각도 <input
          name="angle" type="number" min="1" max="360" step="any" required defaultValue={preview?.angle ?? 60}
        /></label>}
        <label>영웅 기준 방향 (°) <input name="direction" type="number" min="-360" max="360" step="any"
          required defaultValue={preview?.direction ?? 0}
        /></label>
        <button type="submit" className="reset-button">범위 표시</button>
      </form>
      <p>사용자 설정 · 지도 단위 (u)</p>
      {preview && <div className="hero-actions">
        <span role="status">{abilities.find(({ id }) => id === preview.abilityId)?.name} · {preview.range} u</span>
        <button className="reset-button" type="button" onClick={() => onPreview(undefined)}>범위 숨기기</button>
      </div>}
    </details>
  );
};

export default AbilityPreviewTools;
