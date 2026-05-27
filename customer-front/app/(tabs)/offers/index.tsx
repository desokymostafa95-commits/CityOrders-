import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { router } from 'expo-router';
import { Surface, Text, useTheme } from 'react-native-paper';
import { resolveImageUrl } from '../../../src/api/http';
import { EmptyState, Skeleton } from '../../../src/components/ui/Skeleton';
import { useOffers } from '../../../src/hooks/catalog';
import { formatCurrency } from '../../../src/utils/format';

dayjs.extend(relativeTime);

export default function OffersScreen() {
    const { data: offers, isLoading, error, refetch } = useOffers();
    const theme = useTheme();
    const [now, setNow] = useState(dayjs());

    useEffect(() => {
        const timer = setInterval(() => setNow(dayjs()), 1000);
        return () => clearInterval(timer);
    }, []);

    const activeOffers = useMemo(
        () => (offers || []).filter((offer) => dayjs(offer.endAt).diff(now) > 0),
        [offers, now]
    );

    const onRefresh = React.useCallback(() => {
        refetch();
    }, [refetch]);

    const renderHeader = () => (
        <Surface style={styles.headerCard} elevation={0}>
            <View style={styles.headerTop}>
                <View style={[styles.headerIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                    <MaterialCommunityIcons name="sale-outline" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.headerCopy}>
                    <Text variant="headlineSmall" style={styles.title}>Best deals right now</Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Time-limited offers from nearby stores, updated live.
                    </Text>
                </View>
            </View>
            <View style={styles.headerStats}>
                <View style={styles.statPill}>
                    <Text variant="labelSmall" style={styles.statLabel}>Active deals</Text>
                    <Text variant="titleMedium" style={styles.statValue}>{activeOffers.length}</Text>
                </View>
                <View style={styles.statPill}>
                    <Text variant="labelSmall" style={styles.statLabel}>Timer</Text>
                    <Text variant="titleMedium" style={styles.statValue}>Live</Text>
                </View>
            </View>
        </Surface>
    );

    const renderSkeletons = () => (
        <View style={styles.skeletonWrap}>
            {[1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonItem}>
                    <Skeleton height={150} borderRadius={22} />
                </View>
            ))}
        </View>
    );

    if (error) {
        return (
            <View style={styles.centered}>
                <EmptyState
                    icon="alert-circle-outline"
                    title="Could not load offers"
                    message="Please try again in a moment."
                    actionLabel="Retry"
                    onAction={refetch}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={isLoading ? [] : activeOffers}
                keyExtractor={(item) => `${item.brandId}-${item.productId}`}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const endAt = dayjs(item.endAt);
                    const duration = endAt.diff(now);
                    const hours = Math.floor(duration / (1000 * 60 * 60));
                    const mins = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
                    const secs = Math.floor((duration % (1000 * 60)) / 1000);
                    const discountPercent = item.originalPrice > 0
                        ? Math.max(0, Math.round((1 - item.offerPrice / item.originalPrice) * 100))
                        : 0;

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
                                                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                                                    {item.brandName[0]}
                                                </Text>
                                            </View>
                                        )}
                                        <Text variant="labelLarge" style={styles.brandName} numberOfLines={1}>
                                            {item.brandName}
                                        </Text>
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
                                        {discountPercent > 0 && (
                                            <View style={styles.discountBadge}>
                                                <Text variant="labelSmall" style={styles.discountText}>
                                                    {discountPercent}% OFF
                                                </Text>
                                            </View>
                                        )}
                                        <Text variant="titleMedium" style={styles.productName} numberOfLines={2}>
                                            {item.productName}
                                        </Text>
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
                                            <MaterialCommunityIcons name="package-variant" size={32} color={theme.colors.outline} />
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
                            title="No active deals"
                            message="Check back later for new offers."
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
        backgroundColor: '#F8FAFC',
    },
    centered: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    listContent: {
        width: '100%',
        maxWidth: 860,
        alignSelf: 'center',
        paddingBottom: 28,
    },
    headerCard: {
        margin: 16,
        marginBottom: 18,
        padding: 16,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOpacity: 0.05,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIcon: {
        width: 54,
        height: 54,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCopy: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        color: '#0F172A',
        fontWeight: '900',
        marginBottom: 4,
    },
    subtitle: {
        color: '#64748B',
        lineHeight: 20,
    },
    headerStats: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 14,
    },
    statPill: {
        flex: 1,
        minHeight: 58,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    statLabel: {
        color: '#64748B',
        fontWeight: '800',
    },
    statValue: {
        color: '#0F172A',
        fontWeight: '900',
        marginTop: 2,
    },
    skeletonWrap: {
        paddingHorizontal: 16,
    },
    skeletonItem: {
        marginBottom: 16,
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 10,
    },
    brandInfo: {
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandLogo: {
        width: 28,
        height: 28,
        borderRadius: 10,
    },
    brandLogoPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandName: {
        flex: 1,
        marginLeft: 8,
        color: '#0F172A',
        fontWeight: '800',
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 10,
    },
    timerText: {
        marginLeft: 4,
        fontWeight: '800',
    },
    productRow: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    productInfo: {
        flex: 1,
        minWidth: 0,
        paddingRight: 12,
    },
    discountBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FED7AA',
        marginBottom: 8,
    },
    discountText: {
        color: '#9A3412',
        fontWeight: '900',
    },
    productName: {
        color: '#0F172A',
        fontWeight: '800',
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: 8,
    },
    offerPrice: {
        fontWeight: '900',
    },
    originalPrice: {
        textDecorationLine: 'line-through',
        color: '#64748B',
    },
    productImage: {
        width: 92,
        height: 92,
        borderRadius: 18,
    },
    productImagePlaceholder: {
        width: 92,
        height: 92,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
