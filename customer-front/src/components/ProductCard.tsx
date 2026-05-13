import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface, IconButton } from 'react-native-paper';
import { Product } from '../types';
import { useCartStore } from '../store/cart';
import { formatCurrency } from '../utils/format';
import { resolveImageUrl } from '../api/http';

interface Props {
    product: Product;
    brandId: number;
}

export default function ProductCard({ product, brandId }: Props) {
    const theme = useTheme();
    const addItem = useCartStore((state) => state.addItem);
    const removeItem = useCartStore((state) => state.removeItem);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const carts = useCartStore((state) => state.carts);

    const cartItem = carts[brandId]?.items.find(i => i.product.id === product.id);
    const quantity = cartItem?.quantity || 0;

    const imageUrl = resolveImageUrl(product.primaryImageUrl);

    const handleAdd = () => {
        if (quantity > 0) {
            updateQuantity(brandId, product.id, +(quantity + (product.quantityStep || 1)).toFixed(2));
        } else {
            addItem(brandId, product, product.quantityStep || 1);
        }
    };

    const handleRemove = () => {
        const nextQuantity = +(quantity - (product.quantityStep || 1)).toFixed(2);
        if (nextQuantity > 0) {
            updateQuantity(brandId, product.id, nextQuantity);
        } else {
            removeItem(brandId, product.id);
        }
    };

    return (
        <Surface style={styles.container} elevation={0}>
            <View style={styles.imageContainer}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.image} />
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <IconButton icon="food-variant" size={24} iconColor={theme.colors.outline} />
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
                <View style={styles.footer}>
                    <Text variant="titleMedium" style={styles.price}>{formatCurrency(product.price)}</Text>
                    <View style={styles.controls}>
                        {quantity > 0 ? (
                            <View style={styles.quantityContainer}>
                                <TouchableOpacity
                                    onPress={handleRemove}
                                    style={[styles.btn, { backgroundColor: theme.colors.primaryContainer }]}
                                >
                                    <IconButton icon="minus" size={16} iconColor={theme.colors.primary} style={styles.btnIcon} />
                                </TouchableOpacity>
                                <Text variant="bodyLarge" style={styles.quantityText}>{String(quantity)}</Text>
                                <TouchableOpacity
                                    onPress={handleAdd}
                                    style={[styles.btn, { backgroundColor: theme.colors.primary }]}
                                >
                                    <IconButton icon="plus" size={16} iconColor="white" style={styles.btnIcon} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={handleAdd}
                                style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
                            >
                                <IconButton icon="plus" size={18} iconColor="white" style={styles.btnIcon} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    imageContainer: {
        marginRight: 12,
    },
    image: {
        width: 84,
        height: 84,
        borderRadius: 12,
    },
    imagePlaceholder: {
        width: 84,
        height: 84,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    name: {
        fontWeight: '700',
        marginBottom: 2,
    },
    description: {
        color: '#757575',
        marginBottom: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontWeight: '700',
        color: '#000',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    btn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnIcon: {
        margin: 0,
        padding: 0,
    },
    quantityText: {
        marginHorizontal: 12,
        fontWeight: '700',
        minWidth: 16,
        textAlign: 'center',
    },
    addBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
