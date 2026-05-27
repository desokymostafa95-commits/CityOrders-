import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Searchbar, Surface, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AnnouncementsBanner from '../../../src/components/AnnouncementsBanner';
import { EmptyState, Skeleton } from '../../../src/components/ui/Skeleton';
import { SectionHeader } from '../../../src/components/ui/SectionHeader';
import { SectorCard } from '../../../src/components/ui/SectorCard';
import { useMarketSectors } from '../../../src/hooks/catalog';
import { useActiveAnnouncements } from '../../../src/hooks/useAnnouncements';

export default function HomeScreen() {
    const theme = useTheme();
    const { data: sectors, isLoading, error, refetch: refetchSectors } = useMarketSectors();
    const { data: announcements, refetch: refetchAnnouncements } = useActiveAnnouncements();
    const [searchQuery, setSearchQuery] = useState('');

    const onRefresh = React.useCallback(() => {
        refetchSectors();
        refetchAnnouncements();
    }, [refetchSectors, refetchAnnouncements]);

    const stats = useMemo(() => {
        const sectorCount = sectors?.length ?? 0;
        const storeCount = sectors?.reduce((sum, sector) => sum + (sector.brandsCount || 0), 0) ?? 0;
        return [
            { label: 'Sectors', value: sectorCount, icon: 'shape-outline' },
            { label: 'Stores', value: storeCount, icon: 'storefront-outline' },
            { label: 'Delivery', value: 'Live', icon: 'truck-fast-outline' },
        ];
    }, [sectors]);

    const filteredSectors = sectors?.filter((sector) =>
        sector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sector.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (error) {
        return (
            <View style={styles.centered}>
                <EmptyState
                    icon="alert-circle-outline"
                    title="Could not load sectors"
                    message="Please try again in a moment."
                    actionLabel="Retry"
                    onAction={refetchSectors}
                />
            </View>
        );
    }

    const renderHeader = () => (
        <View style={styles.header}>
            <Surface style={styles.hero} elevation={0}>
                <View style={styles.heroTopRow}>
                    <View style={[styles.brandMark, { backgroundColor: theme.colors.secondaryContainer }]}>
                        <MaterialCommunityIcons name="shopping-outline" size={22} color={theme.colors.secondary} />
                    </View>
                    <View style={styles.badge}>
                        <Text variant="labelSmall" style={styles.badgeText}>CITYORDERS MARKET</Text>
                    </View>
                </View>

                <Text variant="displaySmall" style={styles.title}>
                    Shop your city in minutes
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    Food, fashion, phones, computers and daily essentials from stores around you.
                </Text>

                <Searchbar
                    placeholder="Search sectors, stores, products"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    mode="bar"
                    elevation={0}
                />

                <View style={styles.statsRow}>
                    {stats.map((item) => (
                        <View key={item.label} style={styles.statItem}>
                            <MaterialCommunityIcons name={item.icon as any} size={17} color={theme.colors.primary} />
                            <Text variant="labelLarge" style={styles.statValue}>{item.value}</Text>
                            <Text variant="labelSmall" style={styles.statLabel}>{item.label}</Text>
                        </View>
                    ))}
                </View>
            </Surface>

            {announcements && announcements.length > 0 && (
                <AnnouncementsBanner announcements={announcements} />
            )}

            <SectionHeader title="Browse sectors" containerStyle={styles.sectionHeader} />
        </View>
    );

    const renderSkeletons = () => (
        <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={styles.skeletonContainer}>
                    <Skeleton height={154} borderRadius={18} />
                </View>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={isLoading ? [] : filteredSectors}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <SectorCard
                        sector={item}
                        onPress={() => router.push({ pathname: '/(tabs)/home/sector/[slug]', params: { slug: item.slug } })}
                    />
                )}
                ListEmptyComponent={
                    isLoading ? renderSkeletons() : (
                        <EmptyState
                            icon="shape-outline"
                            title="No sectors found"
                            message="Try another search term."
                        />
                    )
                }
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isLoading && sectors !== undefined} onRefresh={onRefresh} />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centered: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingTop: 18,
        paddingBottom: 8,
    },
    hero: {
        marginHorizontal: 16,
        marginBottom: 18,
        borderRadius: 22,
        padding: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOpacity: 0.06,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    brandMark: {
        width: 46,
        height: 46,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        minHeight: 30,
        paddingHorizontal: 12,
        borderRadius: 15,
        justifyContent: 'center',
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FED7AA',
    },
    badgeText: {
        color: '#9A3412',
        fontWeight: '900',
    },
    title: {
        color: '#0F172A',
        fontWeight: '900',
        marginBottom: 8,
    },
    subtitle: {
        color: '#475569',
        marginBottom: 18,
        maxWidth: 620,
    },
    searchBar: {
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 14,
    },
    searchInput: {
        fontSize: 15,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statItem: {
        flex: 1,
        minHeight: 62,
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 9,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
    },
    statValue: {
        color: '#0F172A',
        fontWeight: '900',
        marginTop: 3,
    },
    statLabel: {
        color: '#64748B',
        marginTop: 1,
    },
    sectionHeader: {
        paddingBottom: 0,
    },
    listContent: {
        width: '100%',
        maxWidth: 960,
        alignSelf: 'center',
        paddingBottom: 32,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
    },
    skeletonContainer: {
        width: '50%',
        padding: 6,
    },
});
