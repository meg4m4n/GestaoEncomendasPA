import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="bg-white text-gray-900 rounded-md px-2 py-1 text-sm border border-gray-300"
    >
      <option value="en-US">English</option>
      <option value="pt">Português</option>
    </select>
  );
}