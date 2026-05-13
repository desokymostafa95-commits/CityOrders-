import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { initI18n, changeLanguage } from '../i18n';
import { storage } from '../utils/storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    themeMode: ThemeMode;
    language: string;
    setThemeMode: (mode: ThemeMode) => Promise<void>;
    setLanguage: (lang: string) => Promise<void>;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'user-theme-mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [language, setLanguageState] = useState<string>('en');

    useEffect(() => {
        const loadSettings = async () => {
            const savedTheme = await storage.getItem(THEME_KEY);
            if (savedTheme) setThemeModeState(savedTheme as ThemeMode);

            const lang = await initI18n();
            setLanguageState(lang);
        };
        loadSettings();
    }, []);

    const setThemeMode = async (mode: ThemeMode) => {
        await storage.setItem(THEME_KEY, mode);
        setThemeModeState(mode);
    };

    const setLanguage = async (lang: string) => {
        await changeLanguage(lang);
        setLanguageState(lang);
    };

    const isDark = themeMode === 'system'
        ? systemColorScheme === 'dark'
        : themeMode === 'dark';

    return (
        <ThemeContext.Provider value={{ themeMode, language, setThemeMode, setLanguage, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
