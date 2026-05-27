import React, { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight, ClipboardList } from 'lucide-react-native';
import { Snackbar, Surface, Text, useTheme } from 'react-native-paper';
import { EmptyState, Skeleton } from '../../../src/components/ui/Skeleton';
import { useOrders } from '../../../src/hooks/orders';
import { formatCurrency, formatDate, getStatusColor } from '../../../src/utils/format';
import { translateStatus } from '../../../src/utils/messages';

export default function OrdersScreen() {
    const theme = useTheme();
    const { data: orders, isLoading, error, refetch } = useOrders();
    const previousStatuses = React.useRef<Record<number, string>>({});
    const [notice, setNotice] = React.useState('');

    const stats = useMemo(() => {
        const allOrders = orders || [];
        const active = allOrders.filter((order) => {
            const status = order.status.toLowerCase();
            return status !== 'delivered' && status !== 'cancelled';
        }).length;

        return {
            total: allOrders.length,
            active,
        };
    }, [orders]);

    React.useEffect(() => {
        if (!orders) return;

        const previous = previousStatuses.current;
        const changed = orders.find((order) => previous[order.id] && previous[order.id] !== order.status);

        previousStatuses.current = orders.reduce<Record<number, string>>((acc, order) => {
            acc[order.id] = order.status;
            return acc;
        }, {});

        if (changed) {
            setNotice(`Order #${changed.orderNumber} updated: ${translateStatus(changed.status)}`);
        }
    }, [orders]);

    useFocusEffect(
        useCallback(() => {
            const interval = setInterval(() => refetch(), 15000);
            return () => clearInterval(interval);
        }, [refetch])
    );

    const onRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const renderHeader = () => (
        <Surface style={styles.headerCard} elevation={0}>
            <View style={styles.headerTop}>
                <View style={[styles.headerIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                    <ClipboardList size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.headerCopy}>
                    <Text variant="headlineSmall" style={styles.title}>My orders</Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Track live orders and review your previous purchases.
                    </Text>
                </View>
            </View>
            <View style={styles.headerStats}>
                <View style={styles.statBox}>
                    <Text variant="labelSmall" style={styles.statLabel}>Active</Text>
                    <Text variant="titleMedium" style={styles.statValue}>{stats.active}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text variant="labelSmall" style={styles.statLabel}>Total</Text>
                    <Text variant="titleMedium" style={styles.statValue}>{stats.total}</Text>
                </View>
            </View>
        </Surface>
    );

    const renderSkeletons = () => (
        <View style={styles.skeletonWrap}>
            {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.skeletonItem}>
                    <Skeleton height={108} borderRadius={22} />
                </View>
            ))}
        </View>
    );

    if (error) {
        return (
            <View style={styles.centered}>
                <EmptyState
                    icon="alert-circle-outline"
                    title="Could not load orders"
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
                data={isLoading && !orders ? [] : orders}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const statusColor = getStatusColor(item.status);

                    return (
                        <Surface style={styles.card} elevation={0}>
                            <TouchableOpacity
                                activeOpacity={0.75}
                                onPress={() => router.push(`/(tabs)/orders/${item.id}`)}
                                style={styles.cardTouchable}
                                accessibilityRole="button"
                                accessibilityLabel={`Open order ${item.orderNumber}`}
                            >
                                <View style={styles.cardBody}>
                                    <View style={styles.mainInfo}>
                                        <View style={styles.brandRow}>
                                            <Text variant="titleMedium" style={styles.brandName} numberOfLines={1}>
                                                {item.brandName}
                                            </Text>
                                            <Text variant="bodySmall" style={styles.orderNumber}>#{item.orderNumber}</Text>
                                        </View>
                                        <Text variant="bodySmall" style={styles.date}>{formatDate(item.createdAt)}</Text>
                                        <Text variant="titleMedium" style={[styles.total, { color: theme.colors.primary }]}>
                                            {formatCurrency(item.total)}
                                        </Text>
                                    </View>
                                    <View style={styles.statusCol}>
                                        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}16` }]}>
                                            <Text style={[styles.statusText, { color: statusColor }]}>
                                                {translateStatus(item.status)}
                                            </Text>
                                        </View>
                                        <ChevronRight size={18} color="#CBD5E1" style={styles.chevron} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Surface>
                    );
                }}
                ListEmptyComponent={
                    isLoading ? renderSkeletons() : (
                        <EmptyState
                            icon="clipboard-text-outline"
                            title="No orders yet"
                            message="When you place an order, you can track it from here."
                            actionLabel="Start shopping"
                            onAction={() => router.push('/(tabs)/home')}
                        />
                    )
                }
                refreshControl={
                    <RefreshControl refreshing={isLoading && orders !== undefined} onRefresh={onRefresh} />
                }
            />
            <Snackbar visible={!!notice} onDismiss={() => setNotice('')} duration={4000}>
                {notice}
            </Snackbar>
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
        paddingBottom: 32,
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
    statBox: {
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
        marginBottom: 12,
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 12,
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
    cardTouchable: {
        padding: 16,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    mainInfo: {
        flex: 1,
        minWidth: 0,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 8,
    },
    brandName: {
        flex: 1,
        color: '#0F172A',
        fontWeight: '900',
    },
    orderNumber: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '800',
    },
    date: {
        color: '#64748B',
        marginBottom: 8,
    },
    total: {
        fontWeight: '900',
    },
    statusCol: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        minHeight: 30,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '900',
    },
    chevron: {
        marginTop: 8,
    },
});
