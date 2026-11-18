import LoadingImage from '../ui/loading-image';
import { useRef } from 'react';
import type { MapDefinition } from '../domain/map';
import owkrCatalogue from '../domain/owkr-catalogue.json';
import { publicAsset } from '../ui/public-asset';
import overheadReferences from '../domain/map-overhead-references.json';
import { Button } from '../ui/controls';
import { useLocale } from '../ui/locale';

const modeNames = {
  escort: '호위',
  hybrid: '혼합',
  control: '쟁탈',
  push: '밀기',
  flashpoint: '플래시포인트',
};
const overheadById: Record<string, string> = overheadReferences;

const MapCatalogue = ({ maps, selectedId, onSelect }: {
  maps: MapDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
}) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const { locale, t } = useLocale();
  const selectMap = (id: string) => {
    onSelect(id);
    dialog.current?.close();
  };
  const editorMaps = new Map(maps.map((map) => [map.id, map]));
  const testMaps = import.meta.env.MODE === 'e2e'
    ? maps.filter(({ id }) => id !== 'kings-row-a' &&
      !owkrCatalogue.maps.some((entry) => entry.id === id)) : [];

  return (
    <>
      <Button type="button" className="reset-button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        {t('전장 변경')}
      </Button>
      <dialog ref={dialog} className="map-library panel" aria-labelledby="map-library-title"
        onKeyDown={(event) => event.stopPropagation()}>
        <div className="panel-heading">
          <h2 id="map-library-title">{t('전장 변경')}</h2>
          <Button type="button" className="reset-button" onClick={() => dialog.current?.close()}>{t('닫기')}</Button>
        </div>
        <div className="map-library-body">
          {testMaps.length > 0 && <section aria-labelledby="other-maps-title">
            <h3 id="other-maps-title">{t('테스트 전장')}</h3>
            <ul className="map-card-grid" role="list">
              {testMaps.map(({ id, name }) => (
                <li key={id}>
                  <Button type="button" className="reset-button map-card-action" onClick={() => selectMap(id)}
                    aria-current={id === selectedId ? 'true' : undefined}>{t(name)}</Button>
                </li>
              ))}
            </ul>
          </section>}
          {Object.entries(modeNames).map(([mode, name]) => (
            <section key={mode} aria-labelledby={`map-mode-${mode}`}>
              <h3 id={`map-mode-${mode}`}>{t(name)}</h3>
              <ul className="map-card-grid" role="list">
                {owkrCatalogue.maps.filter((map) => map.mode === mode).map(({ id, nameKo, nameEn }) => {
                  const name = locale === 'ko' ? nameKo : nameEn;
                  const editorId = editorMaps.has(id) ? id : id === 'kings-row' && editorMaps.has('kings-row-a') ? 'kings-row-a' : undefined;
                  const overhead = overheadById[id];
                  const selected = editorId !== undefined && editorId === selectedId;
                  return (
                    <li key={id} className="map-card">
                      <div className="map-card-image">
                        <LoadingImage src={publicAsset(`images/maps/${id}.webp`)} width={320} height={180} />
                      </div>
                      {editorId ? <Button type="button" className="reset-button map-card-action"
                        onClick={() => selectMap(editorId)} aria-label={t('{0} 열기', name)}
                        aria-current={selected ? 'true' : undefined}>
                        {name}
                        {editorId === 'kings-row-a' && <small>{t('A 거점 근사 지도')}</small>}
                      </Button> : <div className="map-card-action">
                        <span>{name}</span>
                        <small>{t('2D 지형 대조 중')}</small>
                      </div>}
                      {overhead && <a className="map-card-reference" href={overhead} target="_blank" rel="noreferrer">
                        {t('탑다운 참고')}
                      </a>}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <small>{t('전장 이미지 © Blizzard Entertainment')}</small>
        </div>
      </dialog>
    </>
  );
};

export default MapCatalogue;
