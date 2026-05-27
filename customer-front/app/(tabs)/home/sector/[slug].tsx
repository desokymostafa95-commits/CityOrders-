import React, { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Searchbar, Surface, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { BrandCard } from '../../../../src/components/ui/BrandCard';
import { CategoryCard } from '../../../../src/components/ui/CategoryCard';
import { SectionHeader } from '../../../../src/components/ui/SectionHeader';
import { EmptyState, Skeleton } from '../../../../src/components/ui/Skeleton';
import { useAddresses } from '../../../../src/hooks/addresses';
import { useBrands, useCategories, useMarketSectors } from '../../../../src/hooks/catalog';

const SORT_OPTIONS = [
    { key: 'name', label: 'Name', icon: 'sort-alphabetical-ascending' },
    { key: 'nearest', label: 'Nearest', icon: 'map-marker-radius-outline' },
    { key: 'delivery', label: 'Lowest delivery', icon: 'truck-fast-outline' },
];

export default function SectorScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState('name');
    const theme = useTheme();
    const { data: sectors } = useMarketSectors();
    const sector = sectors?.find((item) => item.slug === slug);
    const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories(slug);
    const { data: addresses } = useAddresses();
    const defaultAddress = addresses?.find((address) => address.isDefault && address.lat && address.lng)
        || addresses?.find((address) => address.lat && address.lng);
    const { data: brands, isLoading: brandsLoading, error, refetch: refetchBrands } = useBrands(undefined, {
        search: searchQuery,
        sort,
        sector: slug,
        lat: defaultAddress?.lat,
        lng: defaultAddress?.lng,
    });

    const onRefresh = React.useCallback(() => {
        refetchCategories();
        refetchBrands();
    }, [refetchCategories, refetchBrands]);

    const renderSkeletons = () => (
        <View style={styles.storeSkeletonWrap}>
            {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                    <Skeleton height={88} borderRadius={18} />
                </View>
            ))}
        </View>
    );

    const renderHeader = () => (
        <View>
            <Surface style={styles.hero} elevation={0}>
                <View style={styles.heroIcon}>
                    <MaterialCommunityIcons name="shape-outline" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.heroCopy}>
                    <Text variant="headlineMedium" style={styles.title}>
                        {sector?.name || slug}
                    </Text>
                    {!!sector?.description && (
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            {sector.description}
                        </Text>
                    )}
                </View>
                <View style={styles.heroStats}>
                    <View style={styles.statBox}>
                        <Text variant="titleSmall" style={styles.statValue}>{categories?.length ?? 0}</Text>
                        <Text variant="labelSmall" style={styles.statLabel}>Categories</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text variant="titleSmall" style={styles.statValue}>{brands?.length ?? sector?.brandsCount ?? 0}</Text>
                        <Text variant="labelSmall" style={styles.statLabel}>Stores</Text>
                    </View>
                </View>
            </Surface>

            <View style={styles.header}>
                <Searchbar
                    placeholder="Search stores"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    mode="bar"
                    elevation={0}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                    {SORT_OPTIONS.map((option) => (
                        <Chip
                            key={option.key}
                            icon={option.icon}
                            selected={sort === option.key}
                            onPress={() => setSort(option.key)}
                            style={[styles.filterChip, sort === option.key && styles.filterChipSelected]}
                            textStyle={sort === option.key ? styles.filterChipSelectedText : styles.filterChipText}
                            selectedColor={theme.colors.primary}
                        >
                            {option.label}
                        </Chip>
                    ))}
                </ScrollView>
                {!defaultAddress && (
                    <View style={styles.locationHint}>
                        <MaterialCommunityIcons name="map-marker-outline" size={16} color="#A16207" />
                        <Text variant="bodySmall" style={styles.locationHintText}>
                            Add a pinned address for nearest sorting and delivery estimates.
                        </Text>
                    </View>
                )}
            </View>

            <SectionHeader title="Categories" containerStyle={styles.sectionHeader} />
            {categoriesLoading ? (
                <View style={styles.categoryGrid}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={styles.categorySkeleton}>
                            <Skeleton height={132} borderRadius={18} />
                        </View>
                    ))}
                </View>
            ) : (categories?.length ?? 0) > 0 ? (
                <View style={styles.categoryGrid}>
                    {categories?.map((category) => (
                        <View key={category.id} style={styles.categoryItem}>
                            <CategoryCard
                                category={category}
                                onPress={() => router.push({ pathname: '/(tabs)/home/category/[slug]', params: { slug: category.slug } })}
                            />
                        </View>
                    ))}
                </View>
            ) : (
                <View style={styles.inlineEmpty}>
                    <Text variant="bodyMedium" style={styles.inlineEmptyText}>No categories in this sector yet.</Text>
                </View>
            )}

            <SectionHeader title="Stores" containerStyle={styles.sectionHeader} />
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: sector?.name || 'Sector',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F8FAFC' },
                }}
            />

            {error ? (
                <EmptyState
                    icon="alert-circle-outline"
                    title="Could not load stores"
                    message="Please try again in a moment."
                    actionLabel="Retry"
                    onAction={refetchBrands}
                />
            ) : (
                <FlatList
                    data={brandsLoading ? [] : brands}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={renderHeader}
                    renderItem={({ item }) => (
                        <BrandCard
                            brand={item}
                            onPress={() => router.push({ pathname: '/(tabs)/home/brand/[brandId]', params: { brandId: String(item.id) } })}
                        />
                    )}
                    ListEmptyComponent={
                        brandsLoading ? renderSkeletons() : (
                            <EmptyState
                                icon="store-off-outline"
                                title="No stores found"
                                message="Try another search or category."
                            />
                        )
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={(brandsLoading && brands !== undefined) || (categoriesLoading && categories !== undefined)}
                            onRefresh={onRefresh}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    listContent: {
        width: '100%',
        maxWidth: 960,
        alignSelf: 'center',
        paddingVertical: 14,
        paddingBottom: 34,
        flexGrow: 1,
    },
    hero: {
        marginHorizontal: 16,
        marginBottom: 14,
        padding: 16,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        shadowColor: '#0F172A',
        shadowOpacity: 0.05,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 8 },
    },
    heroIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroCopy: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        color: '#0F172A',
        fontWeight: '900',
    },
    subtitle: {
        color: '#64748B',
        marginTop: 3,
    },
    heroStats: {
        flexDirection: 'row',
        gap: 7,
    },
    statBox: {
        minWidth: 70,
        minHeight: 58,
        borderRadius: 15,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        color: '#0F172A',
        fontWeight: '900',
    },
    statLabel: {
        color: '#64748B',
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    searchBar: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 12,
    },
    searchInput: {
        fontSize: 15,
    },
    filters: {
        paddingBottom: 8,
        gap: 8,
    },
    filterChip: {
        marginRight: 0,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    filterChipSelected: {
        backgroundColor: '#FFF7ED',
        borderColor: '#FDBA74',
    },
    filterChipText: {
        color: '#475569',
        fontWeight: '700',
    },
    filterChipSelectedText: {
        color: '#9A3412',
        fontWeight: '900',
    },
    locationHint: {
        minHeight: 42,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    locationHintText: {
        color: '#854D0E',
        flex: 1,
    },
    sectionHeader: {
        paddingBottom: 0,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
        marginBottom: 4,
    },
    categoryItem: {
        width: '50%',
    },
    categorySkeleton: {
        width: '50%',
        padding: 6,
    },
    inlineEmpty: {
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 16,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inlineEmptyText: {
        color: '#64748B',
    },
    storeSkeletonWrap: {
        paddingHorizontal: 16,
        paddingTop: 4,
    },
});
