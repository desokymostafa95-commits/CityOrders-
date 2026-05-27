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
        letterSpacing: 0,
    },
    titleSmall: {
        fontSize: 14,
        fontWeight: '600' as const,
        lineHeight: 20,
        letterSpacing: 0,
    },
    labelLarge: {
        fontSize: 14,
        fontWeight: '500' as const,
        lineHeight: 20,
        letterSpacing: 0,
    },
    labelMedium: {
        fontSize: 12,
        fontWeight: '500' as const,
        lineHeight: 16,
        letterSpacing: 0,
    },
    labelSmall: {
        fontSize: 11,
        fontWeight: '500' as const,
        lineHeight: 16,
        letterSpacing: 0,
    },
    bodyLarge: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
        letterSpacing: 0,
    },
    bodyMedium: {
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
        letterSpacing: 0,
    },
    bodySmall: {
        fontSize: 12,
        fontWeight: '400' as const,
        lineHeight: 16,
        letterSpacing: 0,
    },
};

export const theme = {
    ...DefaultTheme,
    roundness: 16,
    colors: {
        ...DefaultTheme.colors,
        primary: '#EA580C',
        onPrimary: '#FFFFFF',
        primaryContainer: '#FFEDD5',
        onPrimaryContainer: '#9A3412',
        secondary: '#2563EB',
        onSecondary: '#FFFFFF',
        secondaryContainer: '#DBEAFE',
        onSecondaryContainer: '#1E3A8A',
        tertiary: '#16A34A',
        onTertiary: '#FFFFFF',
        tertiaryContainer: '#DCFCE7',
        onTertiaryContainer: '#166534',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        surfaceVariant: '#F1F5F9',
        onSurface: '#0F172A',
        onSurfaceVariant: '#64748B',
        outline: '#CBD5E1',
        outlineVariant: '#E2E8F0',
        error: '#DC2626',
    },
    fonts: configureFonts({ config: fontConfig }),
};

export type AppTheme = typeof theme;
