import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Button, useTheme, Avatar, Divider, Surface, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { removeToken } from '../../../src/api/http';
import { useQuery } from '@tanstack/react-query';
import http from '../../../src/api/http';
import { ENDPOINTS } from '../../../src/api/endpoints';
import { LogOut, MapPin, User, Settings, Shield, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
    const theme = useTheme();

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
                            label={profile?.name?.substring(0, 2).toUpperCase() || 'U'}
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
                                    {role.toUpperCase()}
                                </Text>
                            </Surface>
                        ))}
                    </View>
                </View>

                <View style={styles.menuSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Account</Text>
                    <Surface style={styles.menuSurface} elevation={0}>
                        <List.Item
                            title="My Addresses"
                            description="Save and manage delivery locations"
                            left={props => <View style={styles.menuIcon}><MapPin size={22} color={theme.colors.primary} /></View>}
                            right={props => <ChevronRight size={18} color="#D0D0D0" style={{ alignSelf: 'center' }} />}
                            onPress={() => router.push('/(tabs)/profile/addresses')}
                            titleStyle={styles.menuTitle}
                        />
                        <Divider style={styles.menuDivider} />
                        <List.Item
                            title="Settings"
                            description="App preferences and notifications"
                            left={props => <View style={styles.menuIcon}><Settings size={22} color="#757575" /></View>}
                            right={props => <ChevronRight size={18} color="#D0D0D0" style={{ alignSelf: 'center' }} />}
                            titleStyle={styles.menuTitle}
                        />
                        <Divider style={styles.menuDivider} />
                        <List.Item
                            title="Legal & Privacy"
                            description="Terms, privacy and safety"
                            left={props => <View style={styles.menuIcon}><Shield size={22} color="#757575" /></View>}
                            right={props => <ChevronRight size={18} color="#D0D0D0" style={{ alignSelf: 'center' }} />}
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
                    Log Out
                </Button>

                <View style={styles.footer}>
                    <Text variant="labelSmall" style={styles.version}>CITYORDERS v1.0.0</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    avatarWrapper: {
        padding: 4,
        borderRadius: 50,
        backgroundColor: '#F8F8F8',
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
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F0F0F0',
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
        backgroundColor: '#FAFAFA',
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
});
