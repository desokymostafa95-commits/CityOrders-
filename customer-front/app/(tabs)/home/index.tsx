import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView } from 'react-native';
import { Text, Searchbar, useTheme } from 'react-native-paper';
import { useCategories } from '../../../src/hooks/catalog';
import { router } from 'expo-router';
import { CategoryCard } from '../../../src/components/ui/CategoryCard';
import { SectionHeader } from '../../../src/components/ui/SectionHeader';
import { Skeleton, EmptyState } from '../../../src/components/ui/Skeleton';
import { useActiveAnnouncements } from '../../../src/hooks/useAnnouncements';
import AnnouncementsBanner from '../../../src/components/AnnouncementsBanner';

export default function HomeScreen() {
    const { data: categories, isLoading, error, refetch: refetchCategories } = useCategories();
    const { data: announcements, refetch: refetchAnnouncements } = useActiveAnnouncements();
    const [searchQuery, setSearchQuery] = useState('');
    const theme = useTheme();

    const onRefresh = React.useCallback(() => {
        refetchCategories();
        refetchAnnouncements();
    }, [refetchCategories, refetchAnnouncements]);

    const filteredCategories = categories?.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (error) {
        return (
            <View style={styles.centered}>
                <EmptyState
                    icon="alert-circle-outline"
                    title="Something went wrong"
                    message="We couldn't load the categories. Please try again later."
                />
            </View>
        );
    }

    const renderHeader = () => (
        <View style={styles.header}>
            <Text variant="headlineLarge" style={styles.title}>
                What are you craving today?
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
                Pick a category and see available stores.
            </Text>
            <Searchbar
                placeholder="Search stores or items"
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                inputStyle={styles.searchInput}
                mode="bar"
                elevation={0}
            />

            {announcements && announcements.length > 0 && (
                <AnnouncementsBanner announcements={announcements} />
            )}

            <SectionHeader title="Categories" containerStyle={styles.sectionHeader} />
        </View>
    );

    const renderSkeletons = () => (
        <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={styles.skeletonContainer}>
                    <Skeleton height={125} borderRadius={16} />
                </View>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={isLoading ? [] : filteredCategories}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <CategoryCard
                        category={item}
                        onPress={() => router.push(`/(tabs)/home/category/${item.slug}`)}
                    />
                )}
                ListEmptyComponent={
                    isLoading ? renderSkeletons() : (
                        <EmptyState
                            icon="food-off-outline"
                            title="No categories found"
                            message="Try searching for something else."
                        />
                    )
                }
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isLoading && categories !== undefined} onRefresh={onRefresh} />
                }
            />
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
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingTop: 24,
        paddingBottom: 8,
    },
    title: {
        fontWeight: '800',
        paddingHorizontal: 16,
        marginBottom: 4,
    },
    subtitle: {
        paddingHorizontal: 16,
        color: '#757575',
        marginBottom: 20,
    },
    searchBar: {
        marginHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        marginBottom: 16,
    },
    searchInput: {
        fontSize: 14,
    },
    sectionHeader: {
        paddingBottom: 0,
    },
    listContent: {
        paddingBottom: 24,
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
