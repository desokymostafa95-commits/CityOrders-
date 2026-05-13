import React from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { Text, useTheme, Divider, FAB } from 'react-native-paper';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useBrandDetails, useBrandProducts } from '../../../../src/hooks/catalog';
import ProductCard from '../../../../src/components/ProductCard';
import { ShoppingCart } from 'lucide-react-native';
import { useCartStore } from '../../../../src/store/cart';
import { Skeleton, EmptyState } from '../../../../src/components/ui/Skeleton';
import { resolveImageUrl } from '../../../../src/api/http';

export default function BrandScreen() {
    const { brandId } = useLocalSearchParams<{ brandId: string }>();
    const id = parseInt(brandId);
    const theme = useTheme();

    const { data: brand, isLoading: isBrandLoading, error: brandError } = useBrandDetails(id);
    const { data: products, isLoading: isProductsLoading, error: productsError } = useBrandProducts(id);
    const carts = useCartStore((state) => state.carts);

    const brandCartCount = carts[id]?.items.length || 0;
    const logoUrl = resolveImageUrl(brand?.logoUrl);

    const renderHeader = () => {
        if (!brand) return null;
        return (
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    {logoUrl ? (
                        <Image source={{ uri: logoUrl }} style={styles.brandLogo} />
                    ) : (
                        <View style={[styles.brandLogoPlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
                            <Text variant="headlineLarge" style={{ color: theme.colors.onPrimaryContainer }}>
                                {brand.name[0]}
                            </Text>
                        </View>
                    )}
                    <View style={styles.headerInfo}>
                        <Text variant="headlineSmall" style={styles.brandName}>{brand.name}</Text>
                        <Text variant="bodySmall" style={styles.brandAddress} numberOfLines={1}>{brand.address}</Text>
                    </View>
                </View>

                <View style={styles.pricingRow}>
                    <View style={styles.pricingItem}>
                        <Text variant="labelSmall" style={styles.pricingLabel}>Base Fee</Text>
                        <Text variant="titleSmall">${String(brand.deliveryPricing.baseFee)}</Text>
                    </View>
                    <View style={styles.verticalDivider} />
                    <View style={styles.pricingItem}>
                        <Text variant="labelSmall" style={styles.pricingLabel}>Rate</Text>
                        <Text variant="titleSmall">${String((brand.deliveryPricing.feePerMeter * 1000).toFixed(1))}/km</Text>
                    </View>
                    <View style={styles.verticalDivider} />
                    <View style={styles.pricingItem}>
                        <Text variant="labelSmall" style={styles.pricingLabel}>Range</Text>
                        <Text variant="titleSmall">{String(brand.deliveryPricing.maxDistanceMeters / 1000)}km</Text>
                    </View>
                </View>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.sectionTitle}>Available Products</Text>
            </View>
        );
    };

    const renderSkeletons = () => (
        <View style={{ padding: 16 }}>
            {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                    <Skeleton height={110} borderRadius={16} />
                </View>
            ))}
        </View>
    );

    if (brandError) {
        return (
            <View style={styles.centered}>
                <EmptyState icon="alert-circle-outline" title="Error" message="Failed to load brand details." />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: brand?.name || 'Store',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#FFFFFF' },
            }} />

            <FlatList
                data={isProductsLoading ? [] : products}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={isBrandLoading ? <View style={{ height: 150 }}><Skeleton height={150} /></View> : renderHeader()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <ProductCard product={item} brandId={id} />
                )}
                ListEmptyComponent={
                    isProductsLoading ? renderSkeletons() : (
                        <EmptyState
                            icon="food-off-outline"
                            title="No products"
                            message="This store has no active products right now."
                        />
                    )
                }
            />

            {brandCartCount > 0 && (
                <FAB
                    icon={() => <ShoppingCart size={20} color="#fff" />}
                    label={`View Cart (${String(brandCartCount)})`}
                    style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                    onPress={() => router.push(`/(tabs)/cart`)}
                    color="#fff"
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
    centered: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    brandLogo: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    brandLogoPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 16,
    },
    brandName: {
        fontWeight: '800',
    },
    brandAddress: {
        color: '#757575',
        marginTop: 2,
    },
    pricingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
    },
    pricingItem: {
        flex: 1,
        alignItems: 'center',
    },
    pricingLabel: {
        color: '#757575',
        marginBottom: 2,
    },
    verticalDivider: {
        width: 1,
        height: '60%',
        backgroundColor: '#E0E0E0',
    },
    divider: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontWeight: '700',
        marginBottom: 8,
    },
    listContent: {
        paddingBottom: 100,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 16,
        borderRadius: 28,
    },
});
