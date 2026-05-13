import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';
import en from './translations/en.json';
import ar from './translations/ar.json';
import { storage } from '../utils/storage';

const i18n = new I18n({
    en,
    ar
});

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

const LANGUAGE_KEY = 'userLanguage';

export async function initI18n(): Promise<string> {
    const savedLanguage = await storage.getItem(LANGUAGE_KEY);

    let deviceLanguage = 'en';
    // Use window.navigator on web for more accurate browser language detection
    if (typeof window !== 'undefined' && window.navigator) {
        deviceLanguage = window.navigator.language || (window.navigator as any).userLanguage || 'en';
    } else {
        const locales = getLocales();
        deviceLanguage = (locales && locales.length > 0 ? locales[0].languageCode : 'en') || 'en';
    }

    // Support partial matches (e.g. 'ar-EG' -> 'ar')
    const language = (savedLanguage || (deviceLanguage?.toLowerCase().startsWith('ar') ? 'ar' : 'en')) || 'en';

    i18n.locale = language;

    // Handle RTL for Arabic
    const isRTL = language === 'ar';
    if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
        // RTL often requires a restart on native, but on Web it can be more immediate
    }

    return language;
}

export async function changeLanguage(lang: string) {
    i18n.locale = lang;
    await storage.setItem(LANGUAGE_KEY, lang);

    // Force RTL if Arabic
    I18nManager.forceRTL(lang === 'ar');

    // Note: App restart is often needed for RTL changes to take full effect in Expo
}

export function t(key: string, params?: Record<string, any>): string {
    return i18n.t(key, params);
}
