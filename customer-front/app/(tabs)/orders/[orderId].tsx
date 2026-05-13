import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, useTheme, Chip, Button, Divider, Surface } from 'react-native-paper';
import { useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { useOrderDetails, useCancelOrder } from '../../../src/hooks/orders';
import { formatDate, formatCurrency, getStatusColor } from '../../../src/utils/format';
import { Package, Truck, Calendar, MapPin, XCircle, Info } from 'lucide-react-native';

export default function OrderDetailsScreen() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const id = parseInt(orderId);
    const theme = useTheme();

    const { data: order, isLoading, error, refetch } = useOrderDetails(id);
    const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

    useFocusEffect(
        useCallback(() => {
            const interval = setInterval(() => refetch(), 10000);
            return () => clearInterval(interval);
        }, [refetch])
    );

    const handleCancel = () => {
        Alert.alert(
            'Cancel Order',
            'Are you sure you want to cancel this order?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => cancelOrder(id)
                },
            ]
        );
    };

    if (isLoading && !order) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.centered}>
                <Text variant="titleLarge">Order not found</Text>
            </View>
        );
    }

    const isPending = order.status.toLowerCase() === 'pending';

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: `Order #${order.orderNumber}`,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#FFFFFF' },
            }} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isLoading && !!order} onRefresh={refetch} />}
            >
                {/* 1. Status Header */}
                <Surface style={styles.statusCard} elevation={0}>
                    <View style={styles.statusRow}>
                        <View>
                            <Text variant="labelSmall" style={styles.statusLabel}>STATUS</Text>
                            <Text variant="titleLarge" style={[styles.statusValue, { color: getStatusColor(order.status) }]}>
                                {order.status.toUpperCase()}
                            </Text>
                        </View>
                        <View style={[styles.brandIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                            <Package size={24} color={theme.colors.primary} />
                        </View>
                    </View>

                    <Divider style={styles.statusDivider} />

                    <View style={styles.metaInfo}>
                        <View style={styles.metaItem}>
                            <Calendar size={14} color="#757575" />
                            <Text variant="bodySmall" style={styles.metaText}>{formatDate(order.createdAt)}</Text>
                        </View>
                        <Text variant="bodySmall" style={styles.metaText}>•</Text>
                        <Text variant="bodySmall" style={styles.metaText}>{order.brandName}</Text>
                    </View>
                </Surface>

                {/* 2. Order Items */}
                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Order Items</Text>
                    <Surface style={styles.contentCard} elevation={0}>
                        {order.items.map((item, idx) => (
                            <View key={idx} style={styles.itemRow}>
                                <View style={styles.itemMain}>
                                    <View style={styles.itemHeader}>
                                        <Text variant="bodyLarge" style={styles.productName}>{item.productName}</Text>
                                        <Text variant="bodyLarge" style={styles.itemTotal}>{formatCurrency(item.lineTotal)}</Text>
                                    </View>
                                    <Text variant="bodySmall" style={styles.itemMeta}>
                                        {formatCurrency(item.unitPrice)} × {item.quantity}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        <View style={styles.costsContainer}>
                            <View style={styles.costRow}>
                                <Text style={styles.costLabel}>Subtotal</Text>
                                <Text style={styles.costValue}>{formatCurrency(order.subtotal)}</Text>
                            </View>
                            <View style={styles.costRow}>
                                <Text style={styles.costLabel}>Delivery Fee</Text>
                                <Text style={styles.costValue}>{formatCurrency(order.deliveryFee)}</Text>
                            </View>
                            <View style={[styles.costRow, styles.totalRow]}>
                                <Text variant="titleLarge" style={styles.totalLabel}>Total</Text>
                                <Text variant="titleLarge" style={[styles.totalValue, { color: theme.colors.primary }]}>
                                    {formatCurrency(order.total)}
                                </Text>
                            </View>
                        </View>
                    </Surface>
                </View>

                {/* 3. Delivery info */}
                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Delivery Details</Text>
                    <Surface style={styles.contentCard} elevation={0}>
                        <View style={styles.detailItem}>
                            <MapPin size={18} color={theme.colors.primary} />
                            <View style={styles.detailTextContainer}>
                                <Text variant="titleSmall" style={styles.detailLabel}>Address</Text>
                                <Text variant="bodyMedium" style={styles.detailValue}>{order.deliveryAddress}</Text>
                            </View>
                        </View>

                        {order.notes && (
                            <View style={[styles.detailItem, { marginTop: 16 }]}>
                                <Info size={18} color="#757575" />
                                <View style={styles.detailTextContainer}>
                                    <Text variant="titleSmall" style={styles.detailLabel}>Delivery Notes</Text>
                                    <Text variant="bodyMedium" style={styles.detailValue}>{order.notes}</Text>
                                </View>
                            </View>
                        )}
                    </Surface>
                </View>

                {/* 4. Action */}
                <View style={styles.actionSection}>
                    {!isPending && (
                        <View style={styles.infoBox}>
                            <Info size={16} color="#757575" />
                            <Text variant="bodySmall" style={styles.infoText}>
                                Orders can only be cancelled while in 'Pending' status.
                            </Text>
                        </View>
                    )}
                    <Button
                        mode="contained"
                        onPress={handleCancel}
                        disabled={!isPending || isCancelling}
                        loading={isCancelling}
                        style={[styles.cancelBtn, isPending ? { backgroundColor: theme.colors.error } : { backgroundColor: '#F0F0F0' }]}
                        labelStyle={[styles.cancelBtnLabel, !isPending && { color: '#BDBDBD' }]}
                        icon="close-circle-outline"
                    >
                        Cancel Order
                    </Button>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    statusCard: {
        padding: 20,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLabel: {
        fontWeight: '900',
        color: '#BDBDBD',
        letterSpacing: 1,
    },
    statusValue: {
        fontWeight: '900',
        marginTop: 2,
    },
    brandIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusDivider: {
        marginVertical: 16,
        backgroundColor: '#F7F7F7',
    },
    metaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        marginLeft: 6,
        marginRight: 6,
        color: '#757575',
        fontWeight: '500',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontWeight: '800',
        marginBottom: 12,
        marginLeft: 4,
    },
    contentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        overflow: 'hidden',
    },
    itemRow: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#FAFAFA',
    },
    itemMain: {
        width: '100%',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    productName: {
        fontWeight: '700',
        flex: 1,
    },
    itemTotal: {
        fontWeight: '800',
        marginLeft: 12,
    },
    itemMeta: {
        color: '#757575',
    },
    costsContainer: {
        padding: 16,
        backgroundColor: '#FAFAFA',
    },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    costLabel: {
        color: '#757575',
    },
    costValue: {
        fontWeight: '600',
    },
    totalRow: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    totalLabel: {
        fontWeight: '900',
    },
    totalValue: {
        fontWeight: '900',
    },
    detailItem: {
        flexDirection: 'row',
        padding: 16,
    },
    detailTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    detailLabel: {
        fontWeight: '800',
        color: '#757575',
        marginBottom: 4,
    },
    detailValue: {
        lineHeight: 20,
    },
    actionSection: {
        marginTop: 8,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    infoText: {
        marginLeft: 8,
        color: '#757575',
        flex: 1,
    },
    cancelBtn: {
        borderRadius: 14,
        height: 50,
        justifyContent: 'center',
    },
    cancelBtnLabel: {
        fontWeight: '800',
        fontSize: 15,
    },
});
