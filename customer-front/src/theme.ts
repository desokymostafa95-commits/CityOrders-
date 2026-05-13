import { MD3LightTheme as DefaultTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
    displayLarge: {
        fontSize: 32,
        fontWeight: '700' as const,
        lineHeight: 40,
        letterSpacing: 0,
    },
    displayMedium: {
        fontSize: 28,
        fontWeight: '700' as const,
        lineHeight: 36,
        letterSpacing: 0,
    },
    displaySmall: {
        fontSize: 24,
        fontWeight: '700' as const,
        lineHeight: 32,
        letterSpacing: 0,
    },
    headlineLarge: {
        fontSize: 24,
        fontWeight: '600' as const,
        lineHeight: 32,
        letterSpacing: 0,
    },
    headlineMedium: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 28,
        letterSpacing: 0,
    },
    headlineSmall: {
        fontSize: 18,
        fontWeight: '600' as const,
        lineHeight: 24,
        letterSpacing: 0,
    },
    titleLarge: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 26,
        letterSpacing: 0,
    },
    titleMedium: {
        fontSize: 16,
        fontWeight: '600' as const,
        lineHeight: 24,
        letterSpacing: 0.15,
    },
    titleSmall: {
        fontSize: 14,
        fontWeight: '600' as const,
        lineHeight: 20,
        letterSpacing: 0.1,
    },
    labelLarge: {
        fontSize: 14,
        fontWeight: '500' as const,
        lineHeight: 20,
        letterSpacing: 0.1,
    },
    labelMedium: {
        fontSize: 12,
        fontWeight: '500' as const,
        lineHeight: 16,
        letterSpacing: 0.5,
    },
    labelSmall: {
        fontSize: 11,
        fontWeight: '500' as const,
        lineHeight: 16,
        letterSpacing: 0.5,
    },
    bodyLarge: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
        letterSpacing: 0.15,
    },
    bodyMedium: {
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
        letterSpacing: 0.25,
    },
    bodySmall: {
        fontSize: 12,
        fontWeight: '400' as const,
        lineHeight: 16,
        letterSpacing: 0.4,
    },
};

export const theme = {
    ...DefaultTheme,
    roundness: 16,
    colors: {
        ...DefaultTheme.colors,
        primary: '#FF4500', // Example food-delivery orange
        onPrimary: '#FFFFFF',
        primaryContainer: '#FFECE5',
        onPrimaryContainer: '#CC3700',
        secondary: '#000000',
        onSecondary: '#FFFFFF',
        secondaryContainer: '#F0F0F0',
        onSecondaryContainer: '#1F1F1F',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceVariant: '#F7F7F7',
        outline: '#E0E0E0',
        outlineVariant: '#F0F0F0',
    },
    fonts: configureFonts({ config: fontConfig }),
};

export type AppTheme = typeof theme;
