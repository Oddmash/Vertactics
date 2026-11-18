'use client';

import { useState } from 'react';

const views = {
  '3D': {
    image: 'terrain-3d.webp',
    alt: '계단을 올라야 닿는 두 고지대와 그 사이 엄폐물이 보이는 입체 전장',
    caption: '계단과 고지대의 높이 차이를 확인하세요.',
  },
  '2D': {
    image: 'terrain-2d.webp',
    alt: '같은 전장에서 계단, 고지대, 엄폐물의 위치를 위에서 내려다본 평면 지도',
    caption: '같은 전장에서 진입로와 엄폐물의 위치를 확인하세요.',
  },
} as const;

type TerrainView = keyof typeof views;

const TerrainPreview = ({ assetRoot }: { assetRoot: string }) => {
  const [view, setView] = useState<TerrainView>('3D');
  const selected = views[view];

  return (
    <figure className="terrain-preview">
      <div className="preview-toolbar">
        <span>고저차 테스트 맵</span>
        <div className="preview-switch" role="group" aria-label="전장 미리보기 모드">
          {(['2D', '3D'] as const).map((mode) => (
            <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)}>
              {mode}
            </button>
          ))}
        </div>
      </div>
      <img src={assetRoot + selected.image} alt={selected.alt} width={840} height={491} fetchPriority={view === '3D' ? 'high' : 'auto'} />
      <figcaption className="preview-caption">
        <span role="status">{selected.caption}</span>
        <span className="preview-source">실제 편집기 화면</span>
      </figcaption>
    </figure>
  );
};

export default TerrainPreview;
