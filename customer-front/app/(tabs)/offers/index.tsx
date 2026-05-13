import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface, IconButton } from 'react-native-paper';
import { useOffers } from '../../../src/hooks/catalog';
import { router } from 'expo-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { formatCurrency } from '../../../src/utils/format';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Skeleton, EmptyState } from '../../../src/components/ui/Skeleton';
import { resolveImageUrl } from '../../../src/api/http';

dayjs.extend(relativeTime);

export default function OffersScreen() {
    const { data: offers, isLoading, error, refetch } = useOffers();
    const theme = useTheme();
    const [now, setNow] = useState(dayjs());

    useEffect(() => {
        const timer = setInterval(() => setNow(dayjs()), 1000);
        return () => clearInterval(timer);
    }, []);

    const onRefresh = React.useCallback(() => {
        refetch();
    }, [refetch]);

    const renderHeader = () => (
        <View style={styles.header}>
            <Text variant="headlineLarge" style={styles.title}>Special Offers</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>Grab the best deals from your favorite stores.</Text>
        </View>
    );

    const renderSkeletons = () => (
        <View style={{ padding: 16 }}>
            {[1, 2, 3].map((i) => (
                <View key={i} style={{ marginBottom: 16 }}>
                    <Skeleton height={140} borderRadius={16} />
                </View>
            ))}
        </View>
    );

    if (error) {
        return (
            <View style={styles.centered}>
                <EmptyState icon="alert-circle-outline" title="Error" message="Failed to load offers. Please try again later." />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={isLoading ? [] : offers}
                keyExtractor={(item) => `${item.brandId}-${item.productId}`}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const endAt = dayjs(item.endAt);
                    const duration = endAt.diff(now);
                    const isExpired = duration <= 0;

                    if (isExpired) return null;

                    const hours = Math.floor(duration / (1000 * 60 * 60));
                    const mins = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
                    const secs = Math.floor((duration % (1000 * 60)) / 1000);

                    const brandLogoUrl = resolveImageUrl(item.brandLogoUrl);
                    const productImageUrl = resolveImageUrl(item.productImageUrl);

                    return (
                        <Surface style={styles.card} elevation={0}>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => router.push(`/(tabs)/home/brand/${item.brandId}`)}
                            >
                                <View style={styles.brandRow}>
                                    <View style={styles.brandInfo}>
                                        {brandLogoUrl ? (
                                            <Image source={{ uri: brandLogoUrl }} style={styles.brandLogo} />
                                        ) : (
                                            <View style={[styles.brandLogoPlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
                                                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>{item.brandName[0]}</Text>
                                            </View>
                                        )}
                                        <Text variant="labelLarge" style={styles.brandName}>{item.brandName}</Text>
                                    </View>
                                    <View style={[styles.timerBadge, { backgroundColor: theme.colors.errorContainer }]}>
                                        <MaterialCommunityIcons name="timer-outline" size={14} color={theme.colors.error} />
                                        <Text variant="labelSmall" style={[styles.timerText, { color: theme.colors.error }]}>
                                            {hours}h {mins}m {secs}s
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.productRow}>
                                    <View style={styles.productInfo}>
                                        <Text variant="titleMedium" style={styles.productName}>{item.productName}</Text>
                                        <View style={styles.priceRow}>
                                            <Text variant="headlineSmall" style={[styles.offerPrice, { color: theme.colors.primary }]}>
                                                {formatCurrency(item.offerPrice)}
                                            </Text>
                                            <Text variant="bodyMedium" style={styles.originalPrice}>
                                                {formatCurrency(item.originalPrice)}
                                            </Text>
                                        </View>
                                    </View>
                                    {productImageUrl ? (
                                        <Image source={{ uri: productImageUrl }} style={styles.productImage} />
                                    ) : (
                                        <View style={[styles.productImagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                                            <MaterialCommunityIcons name="food" size={32} color={theme.colors.outline} />
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </Surface>
                    );
                }}
                ListEmptyComponent={
                    isLoading ? renderSkeletons() : (
                        <EmptyState
                            icon="tag-off-outline"
                            title="No active offers"
                            message="We don't have any offers for you right now. Check back soon!"
                        />
                    )
                }
                refreshControl={
                    <RefreshControl refreshing={isLoading && offers !== undefined} onRefresh={onRefresh} />
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
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    title: {
        fontWeight: '800',
        marginBottom: 4,
    },
    subtitle: {
        color: '#757575',
    },
    listContent: {
        paddingBottom: 24,
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        overflow: 'hidden',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F7F7F7',
    },
    brandInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandLogo: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    brandLogoPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandName: {
        marginLeft: 8,
        fontWeight: '700',
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    timerText: {
        marginLeft: 4,
        fontWeight: '700',
    },
    productRow: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    productInfo: {
        flex: 1,
        paddingRight: 12,
    },
    productName: {
        fontWeight: '700',
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    offerPrice: {
        fontWeight: '800',
        marginRight: 8,
    },
    originalPrice: {
        textDecorationLine: 'line-through',
        color: '#757575',
    },
    productImage: {
        width: 90,
        height: 90,
        borderRadius: 12,
    },
    productImagePlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
