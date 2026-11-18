import { Select } from './controls';
import { useLocale } from './locale';

const LocalePicker = () => {
  const { locale, setLocale } = useLocale();
  const label = locale === 'ko' ? '언어' : 'Language';

  return (
    <label className="locale-picker">
      {label}
      <Select value={locale} onChange={(event) => setLocale(event.target.value === 'en' ? 'en' : 'ko')}>
        <option value="ko" lang="ko">한국어</option>
        <option value="en" lang="en">English</option>
      </Select>
    </label>
  );
};

export default LocalePicker;
