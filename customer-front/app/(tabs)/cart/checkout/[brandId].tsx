import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, ActivityIndicator, useTheme, Divider, RadioButton, TextInput, HelperText, Surface } from 'react-native-paper';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useCartStore } from '../../../../src/store/cart';
import { useAddresses } from '../../../../src/hooks/addresses';
import { useDeliveryQuote } from '../../../../src/hooks/catalog';
import { useCreateOrder } from '../../../../src/hooks/orders';
import { formatCurrency, formatDistance } from '../../../../src/utils/format';
import { MapPin, CheckCircle2, Navigation, MessageSquare, Tag, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import apiClient from '../../../../src/api/http';

interface PromoResult {
    valid: boolean;
    discountType?: string;
    discountValue?: number;
    discountAmount?: number;
    message?: string;
}

export default function CheckoutScreen() {
    const { brandId } = useLocalSearchParams<{ brandId: string }>();
    const id = parseInt(brandId);
    const theme = useTheme();
    const { carts, clearBrandCart } = useCartStore();
    const brandCart = carts[id];

    const { data: addresses, isLoading: isAddressesLoading } = useAddresses();
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [notes, setNotes] = useState('');

    // Promo code state
    const [promoOpen, setPromoOpen] = useState(false);
    const [promoInput, setPromoInput] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
    const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState('');

    const selectedAddress = addresses?.find(a => a.id === selectedAddressId);
    const isLocationMissing = selectedAddress && (!selectedAddress.lat || !selectedAddress.lng);

    const { data: quote, isLoading: isQuoteLoading } = useDeliveryQuote(id, selectedAddressId || undefined);
    const { mutate: createOrder, isPending: isPlacing } = useCreateOrder();

    useEffect(() => {
        if (addresses && addresses.length > 0 && !selectedAddressId) {
            const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
            setSelectedAddressId(defaultAddr.id);
        }
    }, [addresses]);

    if (!brandCart) {
        return (
            <View style={styles.centered}>
                <Text variant="titleLarge">Cart not found</Text>
                <Button mode="contained" onPress={() => router.replace('/(tabs)/cart')} style={{ marginTop: 16 }}>
                    Back to Cart
                </Button>
            </View>
        );
    }

    const subtotal = brandCart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const deliveryFee = quote?.deliveryFee || 0;
    const discount = (appliedPromo && promoResult?.valid) ? (promoResult.discountAmount ?? 0) : 0;
    const total = subtotal + deliveryFee - discount;

    const handleApplyPromo = async () => {
        const code = promoInput.trim().toUpperCase();
        if (!code) { setPromoError('Enter a promo code'); return; }
        setPromoLoading(true);
        setPromoError('');
        try {
            const res = await apiClient.post('/catalog/validate-promo', { brandId: id, code, subtotal });
            const data: PromoResult = res.data;
            setPromoResult(data);
            if (data.valid) {
                setAppliedPromo(code);
            } else {
                setAppliedPromo(null);
                setPromoError(data.message ?? 'Invalid promo code');
            }
        } catch {
            setPromoError('Could not validate code. Try again.');
            setAppliedPromo(null);
        } finally {
            setPromoLoading(false);
        }
    };

    const handleRemovePromo = () => {
        setAppliedPromo(null);
        setPromoInput('');
        setPromoResult(null);
        setPromoError('');
    };

    const handlePlaceOrder = () => {
        if (!selectedAddressId || !quote?.isDeliverable) return;
        createOrder({
            brandId: id,
            deliveryAddressId: selectedAddressId,
            items: brandCart.items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
            notes,
            promoCode: appliedPromo ?? undefined,
        }, {
            onSuccess: (data: any) => {
                clearBrandCart(id);
                router.replace(`/(tabs)/orders/${data.orderId}`);
            },
        });
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: 'Checkout',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#FFFFFF' },
            }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* 1. Delivery Address */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MapPin size={20} color={theme.colors.primary} />
                        <Text variant="titleMedium" style={styles.sectionTitle}>Delivery Address</Text>
                    </View>
                    <Surface style={styles.addressCard} elevation={0}>
                        {isAddressesLoading ? (
                            <ActivityIndicator style={{ padding: 20 }} />
                        ) : !addresses || addresses.length === 0 ? (
                            <Button mode="outlined" onPress={() => router.push('/profile/addresses/new')} style={styles.addAddressBtn}>
                                Add New Address
                            </Button>
                        ) : (
                            <RadioButton.Group onValueChange={v => setSelectedAddressId(parseInt(v))} value={selectedAddressId?.toString() || ''}>
                                {addresses.map(addr => (
                                    <View key={addr.id} style={styles.addressItem}>
                                        <RadioButton.Item
                                            label={addr.addressLine}
                                            value={addr.id.toString()}
                                            style={styles.radioButton}
                                            labelStyle={styles.radioLabel}
                                            color={theme.colors.primary}
                                        />
                                        {addr.notes ? <Text variant="bodySmall" style={styles.addressNotes}>{addr.notes}</Text> : null}
                                    </View>
                                ))}
                            </RadioButton.Group>
                        )}
                        {isLocationMissing && (
                            <HelperText type="error" visible={true} style={{ paddingHorizontal: 16 }}>
                                This address is missing GPS coordinates. Please update it in Profile to proceed.
                            </HelperText>
                        )}
                    </Surface>
                </View>

                {/* 2. Delivery Coverage Info */}
                {quote && (
                    <View style={styles.section}>
                        <Surface style={[styles.quoteCard, !quote.isDeliverable && { backgroundColor: '#FFF5F5', borderColor: '#FFCDD2' }]} elevation={0}>
                            <View style={styles.quoteRow}>
                                <Navigation size={18} color={quote.isDeliverable ? theme.colors.primary : theme.colors.error} />
                                <Text variant="bodyMedium" style={[styles.quoteText, !quote.isDeliverable && { color: theme.colors.error }]}>
                                    {quote.isDeliverable
                                        ? `Distance: ${formatDistance(quote.distanceMeters)}. Delivering to your location.`
                                        : `${quote.reason || 'Store does not deliver to this location'}`}
                                </Text>
                            </View>
                        </Surface>
                    </View>
                )}

                {/* 3. Promo Code */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.promoToggle} onPress={() => setPromoOpen(o => !o)}>
                        <View style={styles.promoToggleLeft}>
                            <Tag size={18} color="#1565C0" />
                            <Text style={styles.promoToggleText}>Have a promo code?</Text>
                        </View>
                        {promoOpen ? <ChevronUp size={18} color="#757575" /> : <ChevronDown size={18} color="#757575" />}
                    </TouchableOpacity>

                    {promoOpen && (
                        <Surface style={styles.promoCard} elevation={0}>
                            {appliedPromo ? (
                                <View style={styles.promoApplied}>
                                    <CheckCircle2 size={20} color="#2e7d32" />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.promoAppliedCode}>{appliedPromo}</Text>
                                        <Text style={styles.promoAppliedMsg}>{promoResult?.message}</Text>
                                    </View>
                                    <TouchableOpacity onPress={handleRemovePromo}>
                                        <X size={20} color="#c62828" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.promoInputRow}>
                                    <TextInput
                                        placeholder="Enter code"
                                        value={promoInput}
                                        onChangeText={t => setPromoInput(t.toUpperCase())}
                                        mode="outlined"
                                        autoCapitalize="characters"
                                        style={styles.promoInput}
                                        outlineStyle={{ borderRadius: 10, borderColor: '#E0E0E0' }}
                                        dense
                                    />
                                    <Button
                                        mode="contained"
                                        onPress={handleApplyPromo}
                                        loading={promoLoading}
                                        disabled={promoLoading}
                                        style={styles.promoApplyBtn}
                                        labelStyle={{ fontSize: 13 }}
                                    >
                                        Apply
                                    </Button>
                                </View>
                            )}
                            {promoError ? <HelperText type="error" visible>{promoError}</HelperText> : null}
                        </Surface>
                    )}
                </View>

                {/* 4. Order Summary */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Order Summary</Text>
                    </View>
                    <Surface style={styles.summaryCard} elevation={0}>
                        {brandCart.items.map(item => (
                            <View key={item.product.id} style={styles.summaryItem}>
                                <View style={styles.summaryItemInfo}>
                                    <View style={styles.qtyBadge}>
                                        <Text variant="bodySmall" style={styles.qtyText}>{item.quantity}x</Text>
                                    </View>
                                    <Text variant="bodyMedium" style={styles.productName}>{item.product.name}</Text>
                                </View>
                                <Text variant="bodyMedium" style={styles.productPrice}>{formatCurrency(item.product.price * item.quantity)}</Text>
                            </View>
                        ))}

                        <Divider style={styles.summaryDivider} />

                        <View style={styles.costRow}>
                            <Text variant="bodyMedium" style={styles.costLabel}>Subtotal</Text>
                            <Text variant="bodyMedium" style={styles.costValue}>{formatCurrency(subtotal)}</Text>
                        </View>
                        <View style={styles.costRow}>
                            <Text variant="bodyMedium" style={styles.costLabel}>Delivery Fee</Text>
                            <Text variant="bodyMedium" style={styles.costValue}>
                                {isQuoteLoading ? '...' : formatCurrency(deliveryFee)}
                            </Text>
                        </View>

                        {discount > 0 && (
                            <View style={[styles.costRow, styles.discountRow]}>
                                <Text variant="bodyMedium" style={styles.discountLabel}>
                                    🎉 Promo ({appliedPromo})
                                </Text>
                                <Text variant="bodyMedium" style={styles.discountValueText}>
                                    -{formatCurrency(discount)}
                                </Text>
                            </View>
                        )}

                        <View style={[styles.costRow, styles.totalRow]}>
                            <Text variant="titleLarge" style={styles.totalLabel}>Total</Text>
                            <Text variant="headlineSmall" style={[styles.totalValue, { color: theme.colors.primary }]}>
                                {formatCurrency(total)}
                            </Text>
                        </View>
                    </Surface>
                </View>

                {/* 5. Notes & Payment */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MessageSquare size={18} color="#757575" />
                        <Text variant="titleMedium" style={styles.sectionTitle}>Additional Info</Text>
                    </View>
                    <TextInput
                        placeholder="Notes for driver (e.g. gate code, floor...)"
                        value={notes}
                        onChangeText={setNotes}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={styles.notesInput}
                        outlineStyle={{ borderRadius: 12, borderColor: '#E0E0E0' }}
                    />
                    <Surface style={styles.paymentCard} elevation={0}>
                        <CheckCircle2 color={theme.colors.primary} size={20} />
                        <View style={styles.paymentInfo}>
                            <Text variant="titleMedium" style={styles.paymentTitle}>Cash on Delivery</Text>
                            <Text variant="bodySmall" style={{ color: '#757575' }}>Pay when you receive your order</Text>
                        </View>
                    </Surface>
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.footer}>
                <Button
                    mode="contained"
                    style={styles.placeOrderBtn}
                    labelStyle={styles.placeOrderLabel}
                    contentStyle={styles.placeOrderContent}
                    onPress={handlePlaceOrder}
                    loading={isPlacing}
                    disabled={isPlacing || !selectedAddressId || !quote?.isDeliverable || !!isLocationMissing}
                >
                    Confirm Order • {formatCurrency(total)}
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
    scrollContent: { padding: 16, paddingBottom: 120 },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontWeight: '800', marginLeft: 8 },
    addressCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },
    addressItem: { borderBottomWidth: 1, borderBottomColor: '#FAFAFA' },
    radioButton: { paddingHorizontal: 8 },
    radioLabel: { fontSize: 15, fontWeight: '500' },
    addressNotes: { marginLeft: 52, color: '#757575', marginTop: -10, marginBottom: 12 },
    addAddressBtn: { margin: 16, borderRadius: 12 },
    quoteCard: { padding: 16, backgroundColor: '#F7F7F7', borderRadius: 12, borderWidth: 1, borderColor: '#EEEEEE' },
    quoteRow: { flexDirection: 'row', alignItems: 'center' },
    quoteText: { marginLeft: 12, flex: 1, fontWeight: '500' },
    promoToggle: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: '#DBEAFE',
    },
    promoToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    promoToggleText: { fontWeight: '600', color: '#1565C0' },
    promoCard: { marginTop: 10, backgroundColor: '#FAFAFA', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F0F0F0' },
    promoInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    promoInput: { flex: 1, backgroundColor: '#fff', fontSize: 14 },
    promoApplyBtn: { borderRadius: 10 },
    promoApplied: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#F0FDF4', padding: 12, borderRadius: 10,
        borderWidth: 1, borderColor: '#BBF7D0',
    },
    promoAppliedCode: { fontWeight: '800', color: '#166534' },
    promoAppliedMsg: { fontSize: 12, color: '#166534' },
    summaryCard: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
    summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    summaryItemInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    qtyBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 10 },
    qtyText: { fontWeight: '800', color: '#444' },
    productName: { fontWeight: '500', flex: 1 },
    productPrice: { fontWeight: '600', marginLeft: 12 },
    summaryDivider: { marginVertical: 16, backgroundColor: '#F7F7F7' },
    costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    costLabel: { color: '#757575' },
    costValue: { fontWeight: '600' },
    discountRow: { backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 },
    discountLabel: { color: '#166534', fontWeight: '600' },
    discountValueText: { color: '#166534', fontWeight: '700' },
    totalRow: { marginTop: 12, alignItems: 'baseline' },
    totalLabel: { fontWeight: '900' },
    totalValue: { fontWeight: '900' },
    notesInput: { backgroundColor: '#FFFFFF', marginBottom: 16 },
    paymentCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F0F7FF', borderRadius: 16, borderWidth: 1, borderColor: '#D0E1F9' },
    paymentInfo: { marginLeft: 16 },
    paymentTitle: { fontWeight: '800', color: '#0D47A1' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingBottom: 32 },
    placeOrderBtn: { borderRadius: 16 },
    placeOrderLabel: { fontSize: 16, fontWeight: '800', paddingVertical: 6 },
    placeOrderContent: { height: 56 },
});
