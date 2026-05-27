import React from 'react';
import { View, StyleSheet, FlatList, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Divider, FAB, Searchbar, Chip, IconButton, Portal, Dialog, Button } from 'react-native-paper';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useBrandDetails, useBrandProducts, useBrandReviews } from '../../../../src/hooks/catalog';
import ProductCard from '../../../../src/components/ProductCard';
import { Heart, ShoppingCart, Star, X, Package, Plus, Minus } from 'lucide-react-native';
import { useCartStore } from '../../../../src/store/cart';
import { useFavoritesStore } from '../../../../src/store/favorites';
import { Skeleton, EmptyState } from '../../../../src/components/ui/Skeleton';
import { resolveImageUrl } from '../../../../src/api/http';
import { trackAnalyticsEvent } from '../../../../src/api/analytics';
import { Product } from '../../../../src/types';
import { formatCurrency } from '../../../../src/utils/format';

export default function BrandScreen() {
    const { brandId } = useLocalSearchParams<{ brandId: string }>();
    const id = parseInt(brandId);
    const theme = useTheme();
    const [productSearch, setProductSearch] = React.useState('');
    const [productSort, setProductSort] = React.useState('name');
    const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);

    const { data: brand, isLoading: isBrandLoading, error: brandError } = useBrandDetails(id);
    const { data: products, isLoading: isProductsLoading } = useBrandProducts(id, {
        search: productSearch,
        sort: productSort,
    });
    const { data: reviews } = useBrandReviews(id);
    const carts = useCartStore((state) => state.carts);
    const addItem = useCartStore((state) => state.addItem);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const removeItem = useCartStore((state) => state.removeItem);
    const isFavorite = useFavoritesStore((state) => state.isFavorite(id));
    const toggleFavorite = useFavoritesStore((state) => state.toggleBrand);
    const [dialogQuantity, setDialogQuantity] = React.useState<number>(1);

    React.useEffect(() => {
        if (id) {
            void trackAnalyticsEvent({ brandId: id, eventType: 'brand_view' });
        }
    }, [id]);

    React.useEffect(() => {
        const term = productSearch.trim();
        if (!id || term.length < 2) return;

        const timer = setTimeout(() => {
            void trackAnalyticsEvent({ brandId: id, eventType: 'search', searchTerm: term });
        }, 700);

        return () => clearTimeout(timer);
    }, [id, productSearch]);

    const brandCartCount = carts[id]?.items.length || 0;
    const logoUrl = resolveImageUrl(brand?.logoUrl);
    const selectedImageUrl = resolveImageUrl(selectedProduct?.primaryImageUrl);

    const handleOpenProduct = React.useCallback((product: Product) => {
        setSelectedProduct(product);
        void trackAnalyticsEvent({ brandId: id, productId: product.id, eventType: 'product_view' });
    }, [id]);

    React.useEffect(() => {
        if (selectedProduct) {
            const cartQty = carts[id]?.items.find((item) => item.product.id === selectedProduct.id)?.quantity || 0;
            setDialogQuantity(cartQty > 0 ? cartQty : (selectedProduct.quantityStep || 1));
        }
    }, [selectedProduct, id, carts]);

    const handleIncreaseQuantity = React.useCallback(() => {
        if (!selectedProduct) return;
        const step = selectedProduct.quantityStep || 1;
        setDialogQuantity((q) => +(q + step).toFixed(2));
    }, [selectedProduct]);

    const handleDecreaseQuantity = React.useCallback(() => {
        if (!selectedProduct) return;
        const step = selectedProduct.quantityStep || 1;
        setDialogQuantity((q) => {
            const next = +(q - step).toFixed(2);
            return next > 0 ? next : 0;
        });
    }, [selectedProduct]);

    const handleAddOrUpdateCart = React.useCallback(() => {
        if (!selectedProduct) return;
        void trackAnalyticsEvent({ brandId: id, productId: selectedProduct.id, eventType: 'add_to_cart' });
        
        const existingItem = carts[id]?.items.find((item) => item.product.id === selectedProduct.id);
        if (dialogQuantity > 0) {
            if (existingItem) {
                updateQuantity(id, selectedProduct.id, dialogQuantity);
            } else {
                addItem(id, selectedProduct, dialogQuantity);
            }
        } else {
            if (existingItem) {
                removeItem(id, selectedProduct.id);
            }
        }
        setSelectedProduct(null);
    }, [addItem, updateQuantity, removeItem, carts, id, selectedProduct, dialogQuantity]);

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
                    <IconButton
                        icon={() => (
                            <Heart
                                size={22}
                                color={isFavorite ? theme.colors.primary : '#757575'}
                                fill={isFavorite ? theme.colors.primary : 'transparent'}
                            />
                        )}
                        onPress={() => toggleFavorite(id)}
                    />
                </View>

                <View style={styles.pricingRow}>
                    <View style={styles.pricingItem}>
                        <Text variant="labelSmall" style={styles.pricingLabel}>بداية التوصيل</Text>
                        <Text variant="titleSmall">{String(brand.deliveryPricing?.baseFee ?? 0)} جنيه</Text>
                    </View>
                    <View style={styles.verticalDivider} />
                    <View style={styles.pricingItem}>
                        <Text variant="labelSmall" style={styles.pricingLabel}>لكل كم</Text>
                        <Text variant="titleSmall">{String(((brand.deliveryPricing?.feePerMeter ?? 0) * 1000).toFixed(1))} جنيه</Text>
                    </View>
                    <View style={styles.verticalDivider} />
                    <View style={styles.pricingItem}>
                        <Text variant="labelSmall" style={styles.pricingLabel}>النطاق</Text>
                        <Text variant="titleSmall">
                            {brand.deliveryPricing?.maxDistanceMeters ? `${String(brand.deliveryPricing.maxDistanceMeters / 1000)} كم` : 'مفتوح'}
                        </Text>
                    </View>
                </View>
                <View style={styles.reviewPanel}>
                    <View style={styles.reviewScoreRow}>
                        <Star size={18} color="#F59E0B" fill="#F59E0B" />
                        <Text variant="titleSmall" style={styles.reviewScoreText}>
                            {(brand.reviewsCount || 0) > 0 ? `متوسط ${brand.averageRating?.toFixed(1)} من 5` : 'لا توجد تقييمات بعد'}
                        </Text>
                    </View>
                    <Text variant="bodySmall" style={styles.reviewSummary}>
                        {(brand.reviewsCount || 0) > 0 ? `${brand.reviewsCount} تقييم من العملاء` : 'أول تقييم يظهر هنا بعد أول طلب مكتمل.'}
                    </Text>
                    {(reviews || []).slice(0, 2).map((review) => (
                        <View key={review.id} style={styles.reviewItem}>
                            <View style={styles.reviewItemTop}>
                                <Text variant="labelMedium" style={styles.reviewCustomer}>{review.customerName}</Text>
                                <View style={styles.reviewStars}>
                                    {Array.from({ length: review.rating }).map((_, index) => (
                                        <Star key={index} size={12} color="#F59E0B" fill="#F59E0B" />
                                    ))}
                                </View>
                            </View>
                            {!!review.comment && (
                                <Text variant="bodySmall" style={styles.reviewComment} numberOfLines={2}>
                                    {review.comment}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.sectionTitle}>المنتجات المتاحة</Text>
                <Searchbar
                    placeholder="ابحث داخل المتجر"
                    value={productSearch}
                    onChangeText={setProductSearch}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    mode="bar"
                    elevation={0}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                    <Chip selected={productSort === 'name'} onPress={() => setProductSort('name')} style={styles.filterChip}>
                        الاسم
                    </Chip>
                    <Chip selected={productSort === 'price-asc'} onPress={() => setProductSort('price-asc')} style={styles.filterChip}>
                        الأرخص
                    </Chip>
                    <Chip selected={productSort === 'price-desc'} onPress={() => setProductSort('price-desc')} style={styles.filterChip}>
                        الأعلى سعرا
                    </Chip>
                </ScrollView>
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
                <EmptyState icon="alert-circle-outline" title="حدث خطأ" message="لم نتمكن من تحميل بيانات المتجر." />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: brand?.name || 'متجر',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#FFFFFF' },
            }} />

            <FlatList
                data={isProductsLoading ? [] : products}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={isBrandLoading ? <View style={{ height: 150 }}><Skeleton height={150} /></View> : renderHeader()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <ProductCard product={item} brandId={id} onPress={() => handleOpenProduct(item)} />
                )}
                ListEmptyComponent={
                    isProductsLoading ? renderSkeletons() : (
                        <EmptyState
                            icon="food-off-outline"
                            title="لا توجد منتجات"
                            message="هذا المتجر لا يملك منتجات متاحة حاليا."
                        />
                    )
                }
            />

            {brandCartCount > 0 && (
                <FAB
                    icon={() => <ShoppingCart size={20} color="#fff" />}
                    label={`عرض السلة (${String(brandCartCount)})`}
                    style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                    onPress={() => router.push(`/(tabs)/cart`)}
                    color="#fff"
                />
            )}

            <Portal>
                <Dialog visible={!!selectedProduct} onDismiss={() => setSelectedProduct(null)} style={styles.dialog}>
                    {selectedProduct && (
                        <View style={styles.dialogContainer}>
                            {/* Close Button */}
                            <TouchableOpacity onPress={() => setSelectedProduct(null)} style={styles.dialogCloseButton} activeOpacity={0.7}>
                                <X size={18} color="#0F172A" />
                            </TouchableOpacity>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.productDialogScrollContent}>
                                {/* Product Image or Premium Placeholder */}
                                <View style={styles.dialogHeaderImageContainer}>
                                    {selectedImageUrl ? (
                                        <Image source={{ uri: selectedImageUrl }} style={styles.productDialogImage} />
                                    ) : (
                                        <View style={[styles.productDialogPlaceholder, { backgroundColor: '#F8FAFC' }]}>
                                            <Package size={48} color={theme.colors.primary} style={{ opacity: 0.8 }} />
                                        </View>
                                    )}
                                </View>

                                {/* Product details */}
                                <View style={styles.productDialogDetails}>
                                    <Text variant="headlineSmall" style={styles.productDialogTitle}>
                                        {selectedProduct.name}
                                    </Text>
                                    
                                    {!!selectedProduct.description && (
                                        <Text variant="bodyMedium" style={styles.productDialogDescription}>
                                            {selectedProduct.description}
                                        </Text>
                                    )}

                                    <View style={styles.dialogDivider} />

                                    {/* Price and quantity selector row */}
                                    <View style={styles.dialogQuantityRow}>
                                        <View style={styles.dialogPriceContainer}>
                                            <Text variant="headlineSmall" style={styles.productDialogPrice}>
                                                {formatCurrency(selectedProduct.price)}
                                            </Text>
                                            <Text variant="bodySmall" style={styles.productDialogUnit}>
                                                {`لكل ${selectedProduct.unitType}`}
                                            </Text>
                                        </View>

                                        <View style={styles.dialogQuantitySelector}>
                                            <TouchableOpacity
                                                onPress={handleDecreaseQuantity}
                                                style={[styles.dialogQtyBtn, { backgroundColor: '#F1F5F9' }]}
                                                activeOpacity={0.7}
                                            >
                                                <Minus size={16} color="#0F172A" />
                                            </TouchableOpacity>
                                            <Text variant="titleMedium" style={styles.dialogQtyText}>
                                                {String(dialogQuantity)}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={handleIncreaseQuantity}
                                                style={[styles.dialogQtyBtn, { backgroundColor: theme.colors.primary }]}
                                                activeOpacity={0.7}
                                            >
                                                <Plus size={16} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>

                            {/* Submit Button */}
                            <View style={styles.dialogFooter}>
                                <Button
                                    mode="contained"
                                    onPress={handleAddOrUpdateCart}
                                    style={[
                                        styles.dialogSubmitBtn,
                                        (dialogQuantity === 0 && carts[id]?.items.some((item) => item.product.id === selectedProduct.id)) && { backgroundColor: '#EF4444' }
                                    ]}
                                    contentStyle={styles.dialogSubmitBtnContent}
                                    labelStyle={styles.dialogSubmitBtnLabel}
                                >
                                    {dialogQuantity > 0 
                                        ? `أضف للسلة • ${formatCurrency(+(selectedProduct.price * dialogQuantity).toFixed(2))}` 
                                        : (carts[id]?.items.some((item) => item.product.id === selectedProduct.id) ? 'إزالة من السلة' : 'إغلاق')}
                                </Button>
                            </View>
                        </View>
                    )}
                </Dialog>
            </Portal>
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
    header: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 8,
        paddingHorizontal: 16,
        paddingTop: 16,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOpacity: 0.05,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    brandLogo: {
        width: 68,
        height: 68,
        borderRadius: 20,
    },
    brandLogoPlaceholder: {
        width: 68,
        height: 68,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 16,
    },
    brandName: {
        fontWeight: '900',
        color: '#0F172A',
    },
    brandAddress: {
        color: '#64748B',
        marginTop: 2,
    },
    pricingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 24,
    },
    pricingItem: {
        flex: 1,
        alignItems: 'center',
    },
    pricingLabel: {
        color: '#64748B',
        marginBottom: 2,
    },
    verticalDivider: {
        width: 1,
        height: '60%',
        backgroundColor: '#E2E8F0',
    },
    reviewPanel: {
        backgroundColor: '#FFF7ED',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FED7AA',
        padding: 12,
        marginBottom: 18,
    },
    reviewScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reviewScoreText: {
        fontWeight: '800',
        color: '#9A3412',
    },
    reviewSummary: {
        color: '#9A3412',
        marginTop: 4,
    },
    reviewItem: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#FED7AA',
    },
    reviewItemTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    reviewCustomer: {
        fontWeight: '800',
        color: '#431407',
        flex: 1,
    },
    reviewStars: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewComment: {
        color: '#7C2D12',
        marginTop: 4,
        lineHeight: 18,
    },
    divider: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontWeight: '700',
        marginBottom: 8,
    },
    searchBar: {
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 10,
    },
    searchInput: {
        fontSize: 14,
    },
    filters: {
        paddingBottom: 12,
    },
    filterChip: {
        marginRight: 8,
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
    },
    listContent: {
        width: '100%',
        maxWidth: 960,
        alignSelf: 'center',
        paddingBottom: 100,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 16,
        borderRadius: 28,
    },
    dialogContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
    dialogCloseButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    productDialogScrollContent: {
        paddingBottom: 8,
    },
    dialogHeaderImageContainer: {
        width: '100%',
        maxHeight: 240,
        overflow: 'hidden',
    },
    productDialogDetails: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    productDialogTitle: {
        fontWeight: '900',
        color: '#0F172A',
        fontSize: 22,
        lineHeight: 28,
        textAlign: 'right',
    },
    productDialogDescription: {
        color: '#64748B',
        fontSize: 14,
        lineHeight: 22,
        marginTop: 8,
        textAlign: 'right',
    },
    dialogDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 16,
    },
    dialogQuantityRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dialogPriceContainer: {
        alignItems: 'flex-end',
    },
    productDialogPrice: {
        fontWeight: '900',
        color: '#0F172A',
        fontSize: 22,
    },
    productDialogUnit: {
        color: '#64748B',
        fontSize: 12,
        marginTop: 2,
    },
    dialogQuantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    dialogQtyBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dialogQtyText: {
        marginHorizontal: 16,
        fontWeight: '700',
        minWidth: 24,
        textAlign: 'center',
        color: '#0F172A',
    },
    dialogFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    dialogSubmitBtn: {
        borderRadius: 16,
    },
    dialogSubmitBtnContent: {
        height: 52,
        flexDirection: 'row-reverse',
    },
    dialogSubmitBtnLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    dialog: {
        width: '90%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    productDialogImage: {
        width: '100%',
        maxHeight: 240,
        aspectRatio: 1.6,
        borderRadius: 16,
    },
    productDialogPlaceholder: {
        width: '100%',
        maxHeight: 240,
        aspectRatio: 1.6,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
