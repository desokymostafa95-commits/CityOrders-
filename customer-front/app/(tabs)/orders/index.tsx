import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, Surface, Chip } from 'react-native-paper';
import { useOrders } from '../../../src/hooks/orders';
import { router, useFocusEffect } from 'expo-router';
import { formatDate, formatCurrency, getStatusColor } from '../../../src/utils/format';
import { ChevronRight } from 'lucide-react-native';
import { Skeleton, EmptyState } from '../../../src/components/ui/Skeleton';

export default function OrdersScreen() {
    const theme = useTheme();

    const { data: orders, isLoading, error, refetch } = useOrders();

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
        <View style={styles.header}>
            <Text variant="headlineLarge" style={styles.title}>My Orders</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>Track and manage your current and past orders.</Text>
        </View>
    );

    const renderSkeletons = () => (
        <View style={{ padding: 16 }}>
            {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                    <Skeleton height={100} borderRadius={16} />
                </View>
            ))}
        </View>
    );

    if (error) {
        return (
            <View style={styles.centered}>
                <EmptyState icon="alert-circle-outline" title="Error" message="Failed to load orders. Please try again later." />
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
                renderItem={({ item }) => (
                    <Surface style={styles.card} elevation={0}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => router.push(`/(tabs)/orders/${item.id}`)}
                            style={styles.cardTouchable}
                        >
                            <View style={styles.cardBody}>
                                <View style={styles.mainInfo}>
                                    <View style={styles.brandRow}>
                                        <Text variant="titleMedium" style={styles.brandName}>{item.brandName}</Text>
                                        <Text variant="bodySmall" style={styles.orderNumber}>#{item.orderNumber}</Text>
                                    </View>
                                    <Text variant="bodySmall" style={styles.date}>{formatDate(item.createdAt)}</Text>
                                    <Text variant="titleMedium" style={[styles.total, { color: theme.colors.primary }]}>
                                        {formatCurrency(item.total)}
                                    </Text>
                                </View>
                                <View style={styles.statusCol}>
                                    <Chip
                                        compact
                                        textStyle={styles.statusText}
                                        style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '15' }]}
                                    >
                                        <Text style={{ color: getStatusColor(item.status), fontWeight: '700', fontSize: 10 }}>
                                            {item.status.toUpperCase()}
                                        </Text>
                                    </Chip>
                                    <ChevronRight size={18} color="#D0D0D0" style={{ marginTop: 8 }} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Surface>
                )}
                ListEmptyComponent={
                    isLoading ? renderSkeletons() : (
                        <EmptyState
                            icon="clipboard-text-outline"
                            title="No orders yet"
                            message="You haven't placed any orders yet. Start craving something!"
                            actionLabel="Start Ordering"
                            onAction={() => router.push('/(tabs)/home')}
                        />
                    )
                }
                refreshControl={
                    <RefreshControl refreshing={isLoading && orders !== undefined} onRefresh={onRefresh} />
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
        paddingBottom: 32,
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        overflow: 'hidden',
    },
    cardTouchable: {
        padding: 16,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mainInfo: {
        flex: 1,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    brandName: {
        fontWeight: '800',
    },
    orderNumber: {
        marginLeft: 8,
        color: '#757575',
        fontSize: 12,
    },
    date: {
        color: '#757575',
        marginBottom: 8,
    },
    total: {
        fontWeight: '800',
    },
    statusCol: {
        alignItems: 'flex-end',
    },
    statusChip: {
        borderRadius: 8,
        height: 28,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },
});
