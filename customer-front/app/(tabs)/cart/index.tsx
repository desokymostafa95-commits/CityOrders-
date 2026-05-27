import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Divider, IconButton, Surface, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { EmptyState } from '../../../src/components/ui/Skeleton';
import { useCartStore } from '../../../src/store/cart';
import { formatCurrency } from '../../../src/utils/format';

export default function CartScreen() {
    const { carts, removeItem, updateQuantity, clearBrandCart } = useCartStore();
    const theme = useTheme();

    const brandIds = React.useMemo(() => Object.keys(carts).map(Number), [carts]);
    const totals = React.useMemo(() => {
        return brandIds.reduce(
            (acc, brandId) => {
                const brandCart = carts[brandId];
                brandCart.items.forEach((item) => {
                    acc.items += item.quantity;
                    acc.total += item.product.price * item.quantity;
                });
                return acc;
            },
            { items: 0, total: 0 }
        );
    }, [brandIds, carts]);

    if (brandIds.length === 0) {
        return (
            <View style={styles.centered}>
                <EmptyState
                    icon="shopping-outline"
                    title="Your cart is empty"
                    message="Add products from any store and they will appear here."
                    actionLabel="Start shopping"
                    onAction={() => router.push('/(tabs)/home')}
                />
            </View>
        );
    }

    const renderHeader = () => (
        <Surface style={styles.headerCard} elevation={0}>
            <View style={[styles.headerIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                <ShoppingBag size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.headerCopy}>
                <Text variant="headlineSmall" style={styles.headerTitle}>Your cart</Text>
                <Text variant="bodyMedium" style={styles.headerSubtitle}>
                    Review each store separately before checkout.
                </Text>
            </View>
            <View style={styles.headerTotals}>
                <Text variant="labelSmall" style={styles.headerTotalLabel}>{brandIds.length} stores</Text>
                <Text variant="titleMedium" style={[styles.headerTotalValue, { color: theme.colors.primary }]}>
                    {formatCurrency(totals.total)}
                </Text>
            </View>
        </Surface>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={brandIds}
                keyExtractor={(id) => id.toString()}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
                renderItem={({ item: brandId }) => {
                    const brandCart = carts[brandId];
                    const subtotal = brandCart.items.reduce(
                        (sum, item) => sum + item.product.price * item.quantity,
                        0
                    );

                    return (
                        <Surface style={styles.brandSection} elevation={0}>
                            <View style={styles.brandHeader}>
                                <View style={styles.brandInfo}>
                                    <View style={[styles.brandIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                                        <ShoppingBag size={18} color={theme.colors.primary} />
                                    </View>
                                    <View>
                                        <Text variant="titleMedium" style={styles.brandTitle}>Store #{brandId}</Text>
                                        <Text variant="bodySmall" style={styles.itemCount}>
                                            {brandCart.items.length} items
                                        </Text>
                                    </View>
                                </View>
                                <IconButton
                                    icon="trash-can-outline"
                                    iconColor={theme.colors.error}
                                    size={20}
                                    accessibilityLabel="Clear store cart"
                                    onPress={() => clearBrandCart(brandId)}
                                />
                            </View>

                            <Divider style={styles.divider} />

                            {brandCart.items.map((item) => {
                                const step = item.product.quantityStep || 1;
                                return (
                                    <View key={item.product.id} style={styles.itemRow}>
                                        <View style={styles.productDetails}>
                                            <Text variant="bodyLarge" style={styles.productName} numberOfLines={2}>
                                                {item.product.name}
                                            </Text>
                                            <Text variant="bodyMedium" style={styles.productPrice}>
                                                {formatCurrency(item.product.price)}
                                            </Text>
                                        </View>

                                        <View style={styles.controlsRow}>
                                            <View style={styles.quantityControls}>
                                                <TouchableOpacity
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`Decrease ${item.product.name}`}
                                                    onPress={() => {
                                                        if (item.quantity > step) {
                                                            updateQuantity(brandId, item.product.id, +(item.quantity - step).toFixed(2));
                                                        } else {
                                                            removeItem(brandId, item.product.id);
                                                        }
                                                    }}
                                                    style={[styles.qtyBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                                                >
                                                    <IconButton icon="minus" size={14} style={styles.qtyIcon} />
                                                </TouchableOpacity>
                                                <Text variant="titleMedium" style={styles.quantityText}>{item.quantity}</Text>
                                                <TouchableOpacity
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`Increase ${item.product.name}`}
                                                    onPress={() => updateQuantity(brandId, item.product.id, +(item.quantity + step).toFixed(2))}
                                                    style={[styles.qtyBtn, { backgroundColor: theme.colors.primary }]}
                                                >
                                                    <IconButton icon="plus" size={14} iconColor="#FFFFFF" style={styles.qtyIcon} />
                                                </TouchableOpacity>
                                            </View>
                                            <Text variant="titleMedium" style={styles.itemTotal}>
                                                {formatCurrency(item.product.price * item.quantity)}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}

                            <View style={styles.brandFooter}>
                                <View style={styles.summaryRow}>
                                    <Text variant="bodyLarge" style={styles.summaryLabel}>Products total</Text>
                                    <Text variant="headlineSmall" style={[styles.subtotalValue, { color: theme.colors.primary }]}>
                                        {formatCurrency(subtotal)}
                                    </Text>
                                </View>
                                <Button
                                    mode="contained"
                                    onPress={() => router.push(`/(tabs)/cart/checkout/${brandId}`)}
                                    style={styles.checkoutButton}
                                    labelStyle={styles.checkoutLabel}
                                    contentStyle={styles.checkoutContent}
                                >
                                    Checkout this store
                                </Button>
                            </View>
                        </Surface>
                    );
                }}
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
        padding: 16,
        paddingBottom: 32,
    },
    headerCard: {
        minHeight: 116,
        marginBottom: 18,
        padding: 16,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#0F172A',
        shadowOpacity: 0.05,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
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
    headerTitle: {
        color: '#0F172A',
        fontWeight: '900',
    },
    headerSubtitle: {
        color: '#64748B',
        marginTop: 3,
    },
    headerTotals: {
        minWidth: 96,
        minHeight: 62,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    headerTotalLabel: {
        color: '#64748B',
        fontWeight: '800',
    },
    headerTotalValue: {
        fontWeight: '900',
        marginTop: 2,
    },
    brandSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    brandHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    brandInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    brandTitle: {
        color: '#0F172A',
        fontWeight: '900',
    },
    itemCount: {
        color: '#64748B',
    },
    divider: {
        backgroundColor: '#F1F5F9',
    },
    itemRow: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    productDetails: {
        marginBottom: 12,
    },
    productName: {
        color: '#0F172A',
        fontWeight: '800',
        marginBottom: 2,
    },
    productPrice: {
        color: '#64748B',
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 4,
    },
    qtyBtn: {
        width: 32,
        height: 32,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyIcon: {
        margin: 0,
    },
    quantityText: {
        marginHorizontal: 16,
        color: '#0F172A',
        fontWeight: '800',
        minWidth: 20,
        textAlign: 'center',
    },
    itemTotal: {
        color: '#0F172A',
        fontWeight: '900',
    },
    brandFooter: {
        padding: 16,
        backgroundColor: '#F8FAFC',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    summaryLabel: {
        color: '#64748B',
        fontWeight: '700',
    },
    subtotalValue: {
        fontWeight: '900',
    },
    checkoutButton: {
        borderRadius: 14,
    },
    checkoutLabel: {
        fontSize: 16,
        fontWeight: '800',
        paddingVertical: 4,
    },
    checkoutContent: {
        height: 50,
    },
});
