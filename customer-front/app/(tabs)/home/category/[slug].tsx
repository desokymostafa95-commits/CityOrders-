import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useBrands } from '../../../../src/hooks/catalog';
import { BrandCard } from '../../../../src/components/ui/BrandCard';
import { Skeleton, EmptyState } from '../../../../src/components/ui/Skeleton';

export default function CategoryBrandsScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const { data: brands, isLoading, error, refetch } = useBrands(slug);
    const theme = useTheme();

    const onRefresh = React.useCallback(() => {
        refetch();
    }, [refetch]);

    const renderSkeletons = () => (
        <View style={{ padding: 16 }}>
            {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                    <Skeleton height={80} borderRadius={16} />
                </View>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Category',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#FFFFFF' },
            }} />

            {error ? (
                <EmptyState
                    icon="alert-circle-outline"
                    title="Oops!"
                    message="Failed to load brands. Please try again."
                />
            ) : (
                <FlatList
                    data={isLoading ? [] : brands}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <BrandCard
                            brand={item}
                            onPress={() => router.push(`/(tabs)/home/brand/${item.id}`)}
                        />
                    )}
                    ListEmptyComponent={
                        isLoading ? renderSkeletons() : (
                            <EmptyState
                                icon="store-off-outline"
                                title="No stores found"
                                message="There are no stores available in this category yet."
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
        backgroundColor: '#FFFFFF',
    },
    listContent: {
        paddingVertical: 12,
        flexGrow: 1,
    },
});
