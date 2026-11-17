import type { MapLocation } from '../map/competitive-overviews';
import { Select } from '../ui/controls';
import { useLocale } from '../ui/locale';

const MapLocationPicker = ({ locations, value, onChange }: {
  locations: MapLocation[];
  value: string;
  onChange: (value: string) => void;
}) => {
  const { locale, t } = useLocale();
  return (
    <label className="location-picker">
      {t('주요 위치')}
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{t('전장 전체')}</option>
        {locations.map(({ id, name }) => (
          <option key={id} value={id}>{name[locale === 'ko' ? 0 : 1]}</option>
        ))}
      </Select>
    </label>
  );
};

export default MapLocationPicker;
