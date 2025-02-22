import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pt from './locales/pt';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'pt': pt,
    },
    lng: 'pt',
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;