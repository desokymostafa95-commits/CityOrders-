import React from 'react';
import { StyleSheet, View, Alert, Platform } from 'react-native';
import { List, RadioButton, Surface, useTheme as usePaperTheme, Text, Divider } from 'react-native-paper';
import { useTheme } from '@/src/theme/ThemeContext';
import { t } from '@/src/i18n';
import { Languages, Palette, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';

export default function SettingsScreen() {
    const { themeMode, language, setThemeMode, setLanguage, isDark } = useTheme();
    const theme = usePaperTheme();

    const handleLanguageChange = (lang: string) => {
        if (lang === language) return;

        if (Platform.OS === 'web') {
            setLanguage(lang).then(() => {
                window.location.reload();
            });
            return;
        }

        Alert.alert(
            t('settings.title'),
            t('settings.restart_required'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.refresh'),
                    onPress: () => setLanguage(lang)
                }
            ]
        );
    };

    return (
        <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <List.Section>
                <List.Subheader style={{ color: theme.colors.primary }}>
                    <View style={styles.headerRow}>
                        <Languages size={18} color={theme.colors.primary} />
                        <Text style={[styles.headerText, { color: theme.colors.primary }]}>{t('settings.language')}</Text>
                    </View>
                </List.Subheader>
                <RadioButton.Group onValueChange={handleLanguageChange} value={language}>
                    <List.Item
                        title={t('settings.english')}
                        left={props => <RadioButton value="en" {...props} />}
                        onPress={() => handleLanguageChange('en')}
                    />
                    <List.Item
                        title={t('settings.arabic')}
                        left={props => <RadioButton value="ar" {...props} />}
                        onPress={() => handleLanguageChange('ar')}
                    />
                </RadioButton.Group>
            </List.Section>

            <Divider />

            <List.Section>
                <List.Subheader style={{ color: theme.colors.primary }}>
                    <View style={styles.headerRow}>
                        <Palette size={18} color={theme.colors.primary} />
                        <Text style={[styles.headerText, { color: theme.colors.primary }]}>{t('settings.theme')}</Text>
                    </View>
                </List.Subheader>
                <RadioButton.Group onValueChange={value => setThemeMode(value as any)} value={themeMode}>
                    <List.Item
                        title={t('settings.light')}
                        left={props => <RadioButton value="light" {...props} />}
                        onPress={() => setThemeMode('light')}
                    />
                    <List.Item
                        title={t('settings.dark')}
                        left={props => <RadioButton value="dark" {...props} />}
                        onPress={() => setThemeMode('dark')}
                    />
                    <List.Item
                        title={t('settings.system')}
                        left={props => <RadioButton value="system" {...props} />}
                        onPress={() => setThemeMode('system')}
                    />
                </RadioButton.Group>
            </List.Section>
            <Divider />

            <List.Section>
                <List.Subheader style={{ color: theme.colors.primary }}>
                    <View style={styles.headerRow}>
                        <MapPin size={18} color={theme.colors.primary} />
                        <Text style={[styles.headerText, { color: theme.colors.primary }]}>{t('location.title')}</Text>
                    </View>
                </List.Subheader>
                <List.Item
                    title={t('location.title')}
                    left={props => <List.Icon {...props} icon="map-marker" />}
                    right={props => <List.Icon {...props} icon="chevron-right" />}
                    onPress={() => router.push('/location')}
                />
            </List.Section>
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        marginLeft: 8,
        fontWeight: 'bold',
        fontSize: 16,
    }
});
