import type { MapLocation } from '../map/competitive-overviews';
import { SelectDropdown } from '../ui/oddmash/select-dropdown';
import { useLocale } from '../ui/locale';

const MapLocationPicker = ({ locations, value, onChange }: {
  locations: MapLocation[];
  value: string;
  onChange: (value: string) => void;
}) => {
  const { locale, t } = useLocale();
  return (
    <div className="location-picker">
      <span aria-hidden="true">{t('주요 위치')}</span>
      <SelectDropdown aria-label={t('주요 위치')} value={value} onValueChange={onChange} options={[
        { value: '', label: t('전장 전체') },
        ...locations.map(({ id, name }) => ({ value: id, label: name[locale === 'ko' ? 0 : 1] })),
      ]} />
    </div>
  );
};

export default MapLocationPicker;
