import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const customColors = {
    primary: '#6366f1', // Modern Indigo
    secondary: '#10b981', // Emerald
    error: '#ef4444', // Rose/Red
};

export const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        ...customColors,
        surface: '#ffffff',
        background: '#f8fafc', // Slate 50
        onSurface: '#0f172a', // Slate 900
    },
};

export const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        ...customColors,
        primary: '#818cf8', // Lighter indigo for dark mode
        surface: '#1e293b', // Slate 800
        background: '#0f172a', // Slate 900
        onSurface: '#f8fafc', // Slate 50
        onSurfaceVariant: '#94a3b8', // Slate 400
        outline: '#334155', // Slate 700
    },
};
