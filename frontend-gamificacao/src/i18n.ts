// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import pt from './locales/pt.json';
import en from './locales/en.json';
// Importe os outros depois:
// import de from './locales/de.json';
// import fr from './locales/fr.json';
// import nl from './locales/nl.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      // de: { translation: de },
      // fr: { translation: fr },
      // nl: { translation: nl }
    },
    fallbackLng: 'en', // Se o navegador for, por exemplo, italiano, cai no inglês
    interpolation: {
      escapeValue: false, // O React já protege contra XSS por padrão
    },
  });

export default i18n;