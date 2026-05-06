import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(initReactI18next)
  .use(HttpApi)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr', 'ar'],
    debug: true, 
    interpolation: {
      escapeValue: false,
    },
    backend: {
      // Had l-path gha-i-welli i-qleb 3la {{ns}}.json wast folders
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Hna khass t-zid ga3 les paths dyal les fichiers JSON kima namespaces
    ns: [
      'common', 
      'superadmin/settings', 
      'superadmin/rcar', 
      'superadmin/parametrage/parametragee' // Tabbe3 l-path kamel nichan
    ],
    defaultNS: 'common',
  });

export default i18n;