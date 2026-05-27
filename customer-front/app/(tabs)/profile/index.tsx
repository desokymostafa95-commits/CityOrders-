import React from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Pressable } from 'react-native';
import { Text, List, Button, useTheme, Avatar, Divider, Surface, ActivityIndicator, Portal } from 'react-native-paper';
import { router } from 'expo-router';
import { removeToken } from '../../../src/api/http';
import { useQuery } from '@tanstack/react-query';
import http from '../../../src/api/http';
import { ENDPOINTS } from '../../../src/api/endpoints';
import { Check, ChevronRight, Languages, LogOut, MapPin, Settings, Shield, X } from 'lucide-react-native';
import i18n, { t, changeLanguage } from '../../../src/i18n';

export default function ProfileScreen() {
    const theme = useTheme();
    const [languageDialogVisible, setLanguageDialogVisible] = React.useState(false);

    const { data: profile, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const { data } = await http.get(ENDPOINTS.CUSTOMER.ME);
            return data;
        },
    });

    const handleLogout = async () => {
        await removeToken();
        router.replace('/(auth)/login');
    };

    const applyLanguageChange = async (lang: string) => {
        setLanguageDialogVisible(false);
        await changeLanguage(lang);
        if (Platform.OS === 'web') {
            window.location.reload();
        } else {
            Alert.alert(
                t('profile.change_lang_title'),
                t('profile.change_lang_restart'),
                [{ text: 'OK' }]
            );
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Surface style={styles.avatarWrapper} elevation={0}>
                        <Avatar.Text
                            size={90}
                            label={profile?.name?.substring(0, 2).toUpperCase() || 'US'}
                            style={{ backgroundColor: theme.colors.primaryContainer }}
                            labelStyle={{ color: theme.colors.primary, fontWeight: '800' }}
                        />
                    </Surface>
                    <Text variant="headlineSmall" style={styles.name}>{profile?.name}</Text>
                    <Text variant="bodyMedium" style={styles.email}>{profile?.email}</Text>

                    <View style={styles.rolesContainer}>
                        {profile?.roles?.map((role: string) => (
                            <Surface key={role} style={[styles.roleBadge, { backgroundColor: theme.colors.primary + '10' }]} elevation={0}>
                                <Text variant="labelSmall" style={[styles.roleText, { color: theme.colors.primary }]}>
                                    {role === 'Customer' ? t('profile.customer') : role}
                                </Text>
                            </Surface>
                        ))}
                    </View>
                </View>

                <View style={styles.menuSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>{t('profile.title')}</Text>
                    <Surface style={styles.menuSurface} elevation={0}>
                        <List.Item
                            title={t('profile.my_addresses')}
                            description={t('profile.manage_addresses')}
                            left={() => <View style={styles.menuIcon}><MapPin size={22} color={theme.colors.primary} /></View>}
                            right={() => <ChevronRight size={18} color="#D0D0D0" style={{ alignSelf: 'center' }} />}
                            onPress={() => router.push('/(tabs)/profile/addresses')}
                            titleStyle={styles.menuTitle}
                        />
                        <Divider style={styles.menuDivider} />
                        <List.Item
                            title={t('profile.settings')}
                            description={t('profile.settings_desc')}
                            left={() => <View style={styles.menuIcon}><Settings size={22} color="#757575" /></View>}
                            right={() => <ChevronRight size={18} color="#D0D0D0" style={{ alignSelf: 'center' }} />}
                            onPress={() => setLanguageDialogVisible(true)}
                            titleStyle={styles.menuTitle}
                        />
                        <Divider style={styles.menuDivider} />
                        <List.Item
                            title={t('profile.terms_privacy')}
                            description={t('profile.terms_privacy_desc')}
                            left={() => <View style={styles.menuIcon}><Shield size={22} color="#757575" /></View>}
                            right={() => <ChevronRight size={18} color="#D0D0D0" style={{ alignSelf: 'center' }} />}
                            titleStyle={styles.menuTitle}
                        />
                    </Surface>
                </View>

                <Button
                    mode="contained"
                    onPress={handleLogout}
                    icon={() => <LogOut size={18} color="white" />}
                    style={styles.logoutBtn}
                    contentStyle={styles.logoutContent}
                    buttonColor={theme.colors.error}
                >
                    {t('profile.logout')}
                </Button>

                <View style={styles.footer}>
                    <Text variant="labelSmall" style={styles.version}>CITYORDERS v1.0.0</Text>
                </View>
            </ScrollView>

            <Portal>
                {languageDialogVisible && (
                    <View style={styles.modalOverlay}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Close language selector"
                            style={StyleSheet.absoluteFill}
                            onPress={() => setLanguageDialogVisible(false)}
                        />
                        <Surface style={styles.languageModal} elevation={4}>
                            <View style={styles.modalHeader}>
                                <View style={[styles.modalIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                                    <Languages size={22} color={theme.colors.primary} />
                                </View>
                                <View style={styles.modalTitleWrap}>
                                    <Text variant="titleMedium" style={styles.modalTitle}>
                                        {t('profile.change_lang_title')}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.modalSubtitle}>
                                        {t('profile.change_lang_message')}
                                    </Text>
                                </View>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Close"
                                    onPress={() => setLanguageDialogVisible(false)}
                                    style={styles.closeButton}
                                >
                                    <X size={18} color="#757575" />
                                </Pressable>
                            </View>

                            <View style={styles.languageList}>
                                <LanguageOption
                                    label="العربية"
                                    subLabel="Arabic"
                                    selected={i18n.locale === 'ar'}
                                    onPress={() => applyLanguageChange('ar')}
                                    color={theme.colors.primary}
                                />
                                <LanguageOption
                                    label="English"
                                    subLabel="English"
                                    selected={i18n.locale === 'en'}
                                    onPress={() => applyLanguageChange('en')}
                                    color={theme.colors.primary}
                                />
                            </View>
                        </Surface>
                    </View>
                )}
            </Portal>
        </View>
    );
}

function LanguageOption({
    label,
    subLabel,
    selected,
    onPress,
    color,
}: {
    label: string;
    subLabel: string;
    selected: boolean;
    onPress: () => void;
    color: string;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={[styles.languageOption, selected && { borderColor: color, backgroundColor: `${color}12` }]}
        >
            <View>
                <Text variant="titleSmall" style={styles.languageLabel}>{label}</Text>
                <Text variant="bodySmall" style={styles.languageSubLabel}>{subLabel}</Text>
            </View>
            <View style={[styles.checkCircle, selected && { backgroundColor: color, borderColor: color }]}>
                {selected && <Check size={14} color="#FFFFFF" />}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        width: '100%',
        maxWidth: 760,
        alignSelf: 'center',
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
        borderRadius: 24,
        paddingVertical: 26,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    avatarWrapper: {
        padding: 4,
        borderRadius: 50,
        backgroundColor: '#FFF7ED',
    },
    name: {
        fontWeight: '900',
        marginTop: 16,
    },
    email: {
        color: '#757575',
        marginTop: 2,
        fontWeight: '500',
    },
    rolesContainer: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 8,
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    roleText: {
        fontWeight: '800',
        fontSize: 10,
    },
    menuSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontWeight: '800',
        marginBottom: 12,
        marginLeft: 4,
    },
    menuSurface: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    menuIcon: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuTitle: {
        fontWeight: '700',
    },
    menuDivider: {
        backgroundColor: '#F1F5F9',
        marginLeft: 56,
    },
    logoutBtn: {
        borderRadius: 14,
        marginBottom: 24,
    },
    logoutContent: {
        height: 54,
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    version: {
        color: '#D0D0D0',
        fontWeight: '700',
        letterSpacing: 2,
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.42)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    languageModal: {
        width: '100%',
        maxWidth: 430,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        padding: 18,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 18,
    },
    modalIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitleWrap: {
        flex: 1,
    },
    modalTitle: {
        fontWeight: '900',
        color: '#212121',
    },
    modalSubtitle: {
        color: '#757575',
        marginTop: 3,
        lineHeight: 18,
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F6F6F6',
    },
    languageList: {
        gap: 10,
    },
    languageOption: {
        minHeight: 64,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    languageLabel: {
        fontWeight: '900',
        color: '#212121',
    },
    languageSubLabel: {
        color: '#757575',
        marginTop: 2,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D6D6D6',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
