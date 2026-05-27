import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { Minus, Package, Plus } from 'lucide-react-native';
import { Product } from '../types';
import { useCartStore } from '../store/cart';
import { formatCurrency } from '../utils/format';
import { resolveImageUrl } from '../api/http';
import { trackAnalyticsEvent } from '../api/analytics';

interface Props {
    product: Product;
    brandId: number;
    onPress?: () => void;
}

export default function ProductCard({ product, brandId, onPress }: Props) {
    const theme = useTheme();
    const addItem = useCartStore((state) => state.addItem);
    const removeItem = useCartStore((state) => state.removeItem);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const carts = useCartStore((state) => state.carts);

    const cartItem = carts[brandId]?.items.find(i => i.product.id === product.id);
    const quantity = cartItem?.quantity || 0;

    const imageUrl = resolveImageUrl(product.primaryImageUrl);

    const handleAdd = (event?: GestureResponderEvent) => {
        event?.stopPropagation();
        void trackAnalyticsEvent({ brandId, productId: product.id, eventType: 'add_to_cart' });
        if (quantity > 0) {
            updateQuantity(brandId, product.id, +(quantity + (product.quantityStep || 1)).toFixed(2));
        } else {
            addItem(brandId, product, product.quantityStep || 1);
        }
    };

    const handleRemove = (event?: GestureResponderEvent) => {
        event?.stopPropagation();
        const nextQuantity = +(quantity - (product.quantityStep || 1)).toFixed(2);
        if (nextQuantity > 0) {
            updateQuantity(brandId, product.id, nextQuantity);
        } else {
            removeItem(brandId, product.id);
        }
    };

    return (
        <Surface style={styles.container} elevation={0}>
            <TouchableOpacity
                activeOpacity={0.88}
                onPress={onPress}
                disabled={!onPress}
                accessibilityRole={onPress ? 'button' : undefined}
                accessibilityLabel={onPress ? `${product.name} details` : undefined}
                style={styles.detailsArea}
            >
                <View style={styles.imageContainer}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.image} />
                    ) : (
                        <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <Package size={24} color={theme.colors.outline} />
                        </View>
                    )}
                </View>
                <View style={styles.content}>
                    <View>
                        <Text variant="titleSmall" style={styles.name} numberOfLines={2}>{product.name}</Text>
                        {!!product.description && (
                            <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
                                {product.description}
                            </Text>
                        )}
                    </View>
                    <View style={styles.priceRow}>
                        <Text variant="titleMedium" style={styles.price}>{formatCurrency(product.price)}</Text>
                        <Text variant="labelSmall" style={styles.unitText}>{product.unitType}</Text>
                    </View>
                </View>
            </TouchableOpacity>
            <View style={styles.controls}>
                {quantity > 0 ? (
                    <View style={styles.quantityContainer}>
                        <TouchableOpacity
                            onPress={handleRemove}
                            style={[styles.btn, { backgroundColor: theme.colors.primaryContainer }]}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${product.name}`}
                        >
                            <Minus size={16} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <Text variant="bodyLarge" style={styles.quantityText}>{String(quantity)}</Text>
                        <TouchableOpacity
                            onPress={handleAdd}
                            style={[styles.btn, { backgroundColor: theme.colors.primary }]}
                            accessibilityRole="button"
                            accessibilityLabel={`Add ${product.name}`}
                        >
                            <Plus size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={handleAdd}
                        style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${product.name}`}
                    >
                        <Plus size={18} color="white" />
                    </TouchableOpacity>
                )}
            </View>
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'stretch',
        padding: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginHorizontal: 16,
        marginVertical: 7,
        shadowColor: '#0F172A',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
    },
    detailsArea: {
        flex: 1,
        flexDirection: 'row',
    },
    imageContainer: {
        marginRight: 12,
    },
    image: {
        width: 88,
        height: 88,
        borderRadius: 18,
    },
    imagePlaceholder: {
        width: 88,
        height: 88,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    name: {
        fontWeight: '900',
        marginBottom: 2,
        color: '#0F172A',
    },
    description: {
        color: '#757575',
        marginBottom: 4,
    },
    price: {
        fontWeight: '900',
        color: '#0F172A',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    unitText: {
        color: '#64748B',
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        overflow: 'hidden',
        paddingHorizontal: 7,
        paddingVertical: 3,
    },
    controls: {
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        paddingLeft: 10,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    btn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityText: {
        marginHorizontal: 12,
        fontWeight: '700',
        minWidth: 16,
        textAlign: 'center',
    },
    addBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
