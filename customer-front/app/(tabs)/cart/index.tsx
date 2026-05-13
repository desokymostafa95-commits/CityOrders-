import React from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Text, Button, IconButton, useTheme, Divider, Surface } from 'react-native-paper';
import { useCartStore } from '../../../src/store/cart';
import { formatCurrency } from '../../../src/utils/format';
import { ShoppingBag, ChevronRight, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { EmptyState } from '../../../src/components/ui/Skeleton';

export default function CartScreen() {
    const { carts, removeItem, updateQuantity, clearBrandCart } = useCartStore();
    const theme = useTheme();

    const brandIds = Object.keys(carts).map(Number);

    if (brandIds.length === 0) {
        return (
            <View style={styles.centered}>
                <EmptyState
                    icon="shopping-outline"
                    title="Your cart is empty"
                    message="Looks like you haven't added anything to your cart yet."
                    actionLabel="Go Shopping"
                    onAction={() => router.push('/(tabs)/home')}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={brandIds}
                keyExtractor={(id) => id.toString()}
                contentContainerStyle={styles.listContent}
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
                                        <Text variant="bodySmall" style={styles.itemCount}>{brandCart.items.length} items</Text>
                                    </View>
                                </View>
                                <IconButton
                                    icon="trash-can-outline"
                                    iconColor={theme.colors.error}
                                    size={20}
                                    onPress={() => clearBrandCart(brandId)}
                                />
                            </View>

                            <Divider style={styles.divider} />

                            {brandCart.items.map((item) => (
                                <View key={item.product.id} style={styles.itemRow}>
                                    <View style={styles.productDetails}>
                                        <Text variant="bodyLarge" style={styles.productName}>{item.product.name}</Text>
                                        <Text variant="bodyMedium" style={styles.productPrice}>
                                            {formatCurrency(item.product.price)}
                                        </Text>
                                    </View>

                                    <View style={styles.controlsRow}>
                                        <View style={styles.quantityControls}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (item.quantity > (item.product.quantityStep || 1)) {
                                                        updateQuantity(brandId, item.product.id, +(item.quantity - (item.product.quantityStep || 1)).toFixed(2));
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
                                                onPress={() => updateQuantity(brandId, item.product.id, +(item.quantity + (item.product.quantityStep || 1)).toFixed(2))}
                                                style={[styles.qtyBtn, { backgroundColor: theme.colors.primary }]}
                                            >
                                                <IconButton icon="plus" size={14} iconColor="white" style={styles.qtyIcon} />
                                            </TouchableOpacity>
                                        </View>
                                        <Text variant="titleMedium" style={styles.itemTotal}>
                                            {formatCurrency(item.product.price * item.quantity)}
                                        </Text>
                                    </View>
                                </View>
                            ))}

                            <View style={styles.brandFooter}>
                                <View style={styles.summaryRow}>
                                    <Text variant="bodyLarge" style={styles.summaryLabel}>Subtotal</Text>
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
                                    Checkout Store
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
        backgroundColor: '#F8F8F8',
    },
    centered: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    brandSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        overflow: 'hidden',
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
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    brandTitle: {
        fontWeight: '800',
    },
    itemCount: {
        color: '#757575',
    },
    divider: {
        backgroundColor: '#F7F7F7',
    },
    itemRow: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#FAFAFA',
    },
    productDetails: {
        marginBottom: 12,
    },
    productName: {
        fontWeight: '700',
        marginBottom: 2,
    },
    productPrice: {
        color: '#757575',
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 4,
    },
    qtyBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyIcon: {
        margin: 0,
    },
    quantityText: {
        marginHorizontal: 16,
        fontWeight: '700',
        minWidth: 20,
        textAlign: 'center',
    },
    itemTotal: {
        fontWeight: '800',
    },
    brandFooter: {
        padding: 16,
        backgroundColor: '#FAFAFA',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    summaryLabel: {
        fontWeight: '600',
        color: '#757575',
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
        height: 48,
    },
});
