import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './translations/en.json';
import ar from './translations/ar.json';

const i18n = new I18n({
    en,
    ar
});

i18n.enableFallback = true;
i18n.defaultLocale = 'ar'; // Default to Arabic for CityOrders

const LANGUAGE_KEY = 'userLanguage';

export async function initI18n(): Promise<string> {
    let savedLanguage: string | null = null;
    try {
        savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    } catch (e) {
        console.warn('Error reading language key:', e);
    }

    let deviceLanguage = 'ar';
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.navigator) {
        deviceLanguage = window.navigator.language || (window.navigator as any).userLanguage || 'ar';
    } else {
        const locales = Localization.getLocales();
        deviceLanguage = (locales && locales.length > 0 ? locales[0].languageCode : 'ar') || 'ar';
    }

    const language = savedLanguage || (deviceLanguage?.toLowerCase().startsWith('ar') ? 'ar' : 'en');
    i18n.locale = language;

    const isRTL = language === 'ar';
    if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
    }

    return language;
}

export async function changeLanguage(lang: string) {
    i18n.locale = lang;
    try {
        await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (e) {
        console.warn('Error saving language key:', e);
    }

    I18nManager.forceRTL(lang === 'ar');
}

export function t(key: string, params?: Record<string, any>): string {
    return i18n.t(key, params);
}

export default i18n;
