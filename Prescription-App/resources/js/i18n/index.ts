import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import bn from './locales/bn.json';

i18n.use(initReactI18next).init({
    resources: {
        en: { common: en },
        bn: { common: bn },
    },
    lng: detectInitialLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
});

export function setLanguage(lng: 'en' | 'bn') {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
    localStorage.setItem('locale', lng);
    document.body.classList.toggle('lang-bn', lng === 'bn');
}

function detectInitialLanguage(): 'en' | 'bn' {
    const fromMeta = document.querySelector('meta[name="user-locale"]') as HTMLMetaElement | null;
    if (fromMeta?.content === 'bn' || fromMeta?.content === 'en') return fromMeta.content;
    const fromStorage = localStorage.getItem('locale');
    if (fromStorage === 'bn' || fromStorage === 'en') return fromStorage;
    return 'en';
}

export default i18n;
