import React, { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Searchbar, Text, useTheme } from 'react-native-paper';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { BrandCard } from '../../../../src/components/ui/BrandCard';
import { EmptyState, Skeleton } from '../../../../src/components/ui/Skeleton';
import { useAddresses } from '../../../../src/hooks/addresses';
import { useBrands } from '../../../../src/hooks/catalog';

const SORT_OPTIONS = [
    { key: 'name', label: 'Name' },
    { key: 'nearest', label: 'Nearest' },
    { key: 'delivery', label: 'Lowest delivery' },
];

export default function CategoryBrandsScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState('name');
    const { data: addresses } = useAddresses();
    const defaultAddress = addresses?.find(a => a.isDefault && a.lat && a.lng) || addresses?.find(a => a.lat && a.lng);
    const { data: brands, isLoading, error, refetch } = useBrands(slug, {
        search: searchQuery,
        sort,
        lat: defaultAddress?.lat,
        lng: defaultAddress?.lng,
    });
    const theme = useTheme();

    const onRefresh = React.useCallback(() => {
        refetch();
    }, [refetch]);

    const renderSkeletons = () => (
        <View style={styles.skeletonWrap}>
            {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                    <Skeleton height={88} borderRadius={18} />
                </View>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: slug ? slug : 'Stores',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#F8FAFC' },
            }} />

            {error ? (
                <EmptyState
                    icon="alert-circle-outline"
                    title="Could not load stores"
                    message="Please try again in a moment."
                    actionLabel="Retry"
                    onAction={refetch}
                />
            ) : (
                <FlatList
                    data={isLoading ? [] : brands}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
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
                                {SORT_OPTIONS.map(option => (
                                    <Chip
                                        key={option.key}
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
                                <Text variant="bodySmall" style={styles.locationHint}>
                                    Add a pinned address for nearest sorting and delivery estimates.
                                </Text>
                            )}
                        </View>
                    }
                    renderItem={({ item }) => (
                        <BrandCard
                            brand={item}
                            onPress={() => router.push({ pathname: '/(tabs)/home/brand/[brandId]', params: { brandId: String(item.id) } })}
                        />
                    )}
                    ListEmptyComponent={
                        isLoading ? renderSkeletons() : (
                            <EmptyState
                                icon="store-off-outline"
                                title="No stores found"
                                message="Try another search or category."
                            />
                        )
                    }
                    refreshControl={
                        <RefreshControl refreshing={isLoading && brands !== undefined} onRefresh={onRefresh} />
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
        flexGrow: 1,
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
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
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
        color: '#854D0E',
        marginTop: 4,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 14,
        padding: 10,
    },
    skeletonWrap: {
        paddingHorizontal: 16,
    },
});
