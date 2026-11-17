import { useRef } from 'react';
import owkrCatalogue from '../domain/owkr-catalogue.json';
import { useLocale } from '../ui/locale';

const modeNames = {
  control: '쟁탈',
  escort: '호위',
  hybrid: '혼합',
  push: '밀기',
  flashpoint: '플래시포인트',
};

const editorMapIds: Record<string, string> = { 'kings-row': 'kings-row-a' };

const MapCatalogue = ({ onSelect }: { onSelect: (id: string) => void }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const { locale, t } = useLocale();
  const selectMap = (id: string) => {
    onSelect(id);
    dialog.current?.close();
  };

  return (
    <>
      <button type="button" className="reset-button" onClick={() => dialog.current?.showModal()}>
        {t('전장 목록')}
      </button>
      <dialog ref={dialog} className="map-library panel" aria-labelledby="map-library-title"
        onKeyDown={(event) => event.stopPropagation()}>
        <div className="panel-heading">
          <h2 id="map-library-title">{t('전장 목록')}</h2>
          <button type="button" className="reset-button" onClick={() => dialog.current?.close()}>{t('닫기')}</button>
        </div>
        <div className="map-library-body">
          {Object.entries(modeNames).map(([mode, name]) => (
            <section key={mode} aria-labelledby={`map-mode-${mode}`}>
              <h3 id={`map-mode-${mode}`}>{t(name)}</h3>
              <ul role="list">
                {owkrCatalogue.maps.filter((map) => map.mode === mode).map(({ id, nameKo, nameEn }) => {
                  const name = locale === 'ko' ? nameKo : nameEn;
                  const editorMapId = editorMapIds[id];
                  return (
                    <li key={id}>
                      <div>
                        <span>{name}</span>
                        <small>{t(editorMapId ? 'A 거점 근사 지도' : '지형 준비 중')}</small>
                      </div>
                      {editorMapId && (
                        <button type="button" className="reset-button" onClick={() => selectMap(editorMapId)}
                          aria-label={t('{0} 열기', name)}>{t('열기')}</button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </dialog>
    </>
  );
};

export default MapCatalogue;
