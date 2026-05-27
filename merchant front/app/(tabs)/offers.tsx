import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Platform } from 'react-native';
import { Text, Card, Button, Portal, FAB, Dialog, TextInput, List, Divider, ActivityIndicator, HelperText, IconButton, Menu } from 'react-native-paper';
import { useTheme } from '@/src/theme/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme';
import { t } from '@/src/i18n';
import { useMerchantOffers, useCreateOffer, useUpdateOffer, useDisableOffer, useOfferLimit } from '@/src/hooks/useOffers';
import { useMyProducts } from '@/src/hooks/useMerchantData';
import { ProductDto, MerchantOfferDto } from '@/src/types';
import { format, differenceInHours } from 'date-fns';
import { BadgePercent, Edit2, Trash2, Package, Clock, Timer } from 'lucide-react-native';

export default function OffersScreen() {
    const { isDark } = useTheme();
    const theme = isDark ? darkTheme : lightTheme;

    const { data: offers, isLoading, refetch, isRefetching } = useMerchantOffers();
    const { data: products } = useMyProducts();
    const { data: limitInfo } = useOfferLimit();

    const [dialogVisible, setDialogVisible] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<MerchantOfferDto | null>(null);
    const [formData, setFormData] = useState({
        productId: 0,
        offerPrice: '',
        durationHours: '24',
        isActive: true
    });

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const [productMenuVisible, setProductMenuVisible] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const createMutation = useCreateOffer();
    const updateMutation = useUpdateOffer();
    const disableMutation = useDisableOffer();

    const sortedOffers = (offers as MerchantOfferDto[])?.slice().sort((a, b) => {
        if (a.status === 'Active') return -1;
        if (b.status === 'Active') return 1;
        if (a.status === 'Scheduled') return -1;
        if (b.status === 'Scheduled') return 1;
        return 0;
    });

    const showCreateDialog = () => {
        setSelectedOffer(null);
        setErrorMsg(null);
        setFormData({
            productId: products?.[0]?.id || 0,
            offerPrice: '',
            durationHours: '24',
            isActive: true
        });
        setDialogVisible(true);
    };

    const showEditDialog = (offer: MerchantOfferDto) => {
        setSelectedOffer(offer);
        setErrorMsg(null);
        const hours = differenceInHours(new Date(offer.endAt), new Date());
        setFormData({
            productId: offer.productId,
            offerPrice: offer.offerPrice.toString(),
            durationHours: hours > 0 ? hours.toString() : '24',
            isActive: offer.isActive
        });
        setDialogVisible(true);
    };

    const getTimeRemaining = (endAt: string) => {
        const end = new Date(endAt);
        const diffMinutes = Math.floor((end.getTime() - currentTime.getTime()) / (1000 * 60));

        if (diffMinutes <= 0) return null;

        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;

        return `${hours}${t('offers.h')} ${mins}${t('offers.m')}`;
    };

    const handleSave = () => {
        if (!formData.productId) {
            Alert.alert(t('common.error'), t('offers.validation.product_required'));
            return;
        }
        if (!formData.offerPrice || parseFloat(formData.offerPrice) <= 0) {
            Alert.alert(t('common.error'), t('offers.validation.price_positive'));
            return;
        }
        const duration = parseInt(formData.durationHours);
        if (isNaN(duration) || duration <= 0) {
            Alert.alert(t('common.error'), t('offers.validation.duration_positive'));
            return;
        }

        const startAt = new Date();
        const endAt = new Date(startAt.getTime() + (duration * 60 * 60 * 1000));

        const payload = {
            productId: formData.productId,
            offerPrice: parseFloat(formData.offerPrice),
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
        };

        if (selectedOffer) {
            updateMutation.mutate({
                id: selectedOffer.id,
                data: { ...payload, isActive: formData.isActive }
            }, {
                onSuccess: () => {
                    setDialogVisible(false);
                },
                onError: (error: any) => {
                    console.error('Failed to update offer:', error);
                    if (error?.response?.status === 409) {
                        setErrorMsg(error?.response?.data?.message || t('offers.validation.overlap_error'));
                    } else {
                        setErrorMsg(t('offers.error_update') || 'Failed to update offer');
                    }
                }
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    setDialogVisible(false);
                },
                onError: (error: any) => {
                    console.error('Failed to create offer:', error);
                    if (error?.response?.status === 409) {
                        setErrorMsg(error?.response?.data?.message || t('offers.validation.overlap_error'));
                    } else {
                        setErrorMsg(t('offers.error_create') || 'Failed to create offer');
                    }
                }
            });
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const currentProduct = products?.find(p => p.id === formData.productId);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />
                }
            >
                {limitInfo && (
                    <Card style={[styles.limitCard, { backgroundColor: limitInfo.remaining > 0 ? theme.colors.primaryContainer : '#fee2e2' }]}>
                        <Card.Content style={styles.limitContent}>
                            <BadgePercent size={20} color={limitInfo.remaining > 0 ? theme.colors.primary : '#b91c1c'} />
                            <Text style={[styles.limitText, { color: limitInfo.remaining > 0 ? theme.colors.primary : '#b91c1c' }]}>
                                {t('offers.quota') || 'Offers'}: {limitInfo.usedConcurrentOffers} / {limitInfo.maxConcurrentOffers} {t('offers.active_or_scheduled') || 'active or scheduled'}
                            </Text>
                            {limitInfo.remaining === 0 && limitInfo.maxConcurrentOffers > 0 && (
                                <Text style={styles.limitWarning}>({t('offers.limit_reached') || 'Limit reached'})</Text>
                            )}
                            {limitInfo.maxConcurrentOffers === 0 && (
                                <Text style={styles.limitWarning}>({t('offers.no_active_plan') || 'No active plan'})</Text>
                            )}
                        </Card.Content>
                    </Card>
                )}

                {sortedOffers?.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <BadgePercent size={64} color={theme.colors.outline} />
                        <Text style={[styles.emptyText, { color: theme.colors.outline }]}>
                            {t('offers.no_offers')}
                        </Text>
                        <Button mode="contained" onPress={showCreateDialog} style={styles.addBtn}>
                            {t('offers.create_offer')}
                        </Button>
                    </View>
                ) : (
                    sortedOffers?.map((offer: MerchantOfferDto) => (
                        <Card key={offer.id} style={styles.card}>
                            <Card.Content>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{offer.productName}</Text>
                                        <View style={styles.headerRow}>
                                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(offer.status, theme) }]}>
                                                <Text style={styles.statusText}>{t(`offers.states.${offer.status}`)}</Text>
                                            </View>
                                            {offer.status === 'Active' && (
                                                <View style={[styles.statusBadge, { backgroundColor: theme.colors.primaryContainer, marginLeft: 8 }]}>
                                                    <Timer size={10} color={theme.colors.primary} />
                                                    <Text style={[styles.statusText, { color: theme.colors.primary, marginLeft: 4 }]}>
                                                        {t('offers.time_remaining')}: {getTimeRemaining(offer.endAt)}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.actions}>
                                        <IconButton
                                            icon={() => <Edit2 size={18} color={theme.colors.primary} />}
                                            onPress={() => showEditDialog(offer)}
                                        />
                                        <IconButton
                                            icon={() => <Trash2 size={18} color={theme.colors.error} />}
                                            onPress={() => {
                                                if (Platform.OS === 'web') {
                                                    if (window.confirm(t('offers.disable_confirm_msg'))) {
                                                        disableMutation.mutate(offer.id);
                                                    }
                                                } else {
                                                    Alert.alert(
                                                        t('offers.disable_offer'),
                                                        t('offers.disable_confirm_msg'),
                                                        [
                                                            { text: t('common.cancel'), style: 'cancel' },
                                                            { text: t('common.delete'), style: 'destructive', onPress: () => disableMutation.mutate(offer.id) }
                                                        ]
                                                    );
                                                }
                                            }}
                                        />
                                    </View>
                                </View>
                                <Divider style={styles.divider} />
                                <View style={styles.detailsRow}>
                                    <Text variant="bodyMedium">{t('offers.offer_price')}: </Text>
                                    <Text variant="bodyLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                        {offer.offerPrice} EGP
                                    </Text>
                                    <Text variant="bodySmall" style={styles.originalPrice}> ({offer.originalPrice})</Text>
                                </View>
                                <View style={styles.timeRow}>
                                    <Clock size={14} color={theme.colors.outline} />
                                    <Text variant="bodySmall" style={styles.timeText}>
                                        {format(new Date(offer.startAt), 'MMM dd, HH:mm')} - {format(new Date(offer.endAt), 'MMM dd, HH:mm')}
                                    </Text>
                                </View>
                            </Card.Content>
                        </Card>
                    ))
                )}
            </ScrollView>

            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color="white"
                onPress={showCreateDialog}
                disabled={limitInfo ? limitInfo.remaining <= 0 : false}
            />

            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
                    <Dialog.Title>{selectedOffer ? t('offers.edit_offer') : t('offers.create_offer')}</Dialog.Title>
                    <Dialog.ScrollArea style={styles.dialogScroll}>
                        <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
                            {errorMsg && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{errorMsg}</Text>
                                </View>
                            )}
                            <Text variant="labelMedium" style={styles.label}>{t('offers.select_product')}</Text>
                            <Menu
                                visible={productMenuVisible}
                                onDismiss={() => setProductMenuVisible(false)}
                                anchor={
                                    <Button
                                        mode="outlined"
                                        onPress={() => setProductMenuVisible(true)}
                                        style={styles.input}
                                        icon={() => <Package size={18} color={theme.colors.primary} />}
                                        contentStyle={{ justifyContent: 'space-between', flexDirection: 'row-reverse' }}
                                    >
                                        {products?.find((p: ProductDto) => p.id === formData.productId)?.name || t('offers.select_product')}
                                    </Button>
                                }
                                style={{ width: '80%' }}
                            >
                                {products?.map((p: ProductDto) => (
                                    <Menu.Item
                                        key={p.id}
                                        onPress={() => {
                                            setFormData(prev => ({ ...prev, productId: p.id }));
                                            setProductMenuVisible(false);
                                        }}
                                        title={p.name}
                                        leadingIcon={formData.productId === p.id ? "check" : undefined}
                                    />
                                ))}
                            </Menu>

                            <TextInput
                                label={t('offers.offer_price')}
                                value={formData.offerPrice}
                                onChangeText={v => setFormData(prev => ({ ...prev, offerPrice: v }))}
                                keyboardType="numeric"
                                style={styles.input}
                                left={<TextInput.Affix text="EGP " />}
                                mode="outlined"
                            />
                            {currentProduct && (
                                <HelperText type="info">
                                    {t('offers.original_price')}: {currentProduct.price} EGP
                                </HelperText>
                            )}

                            <TextInput
                                label={t('offers.offer_timer')}
                                placeholder="48"
                                value={formData.durationHours}
                                onChangeText={v => setFormData(prev => ({ ...prev, durationHours: v }))}
                                keyboardType="numeric"
                                style={styles.input}
                                left={<TextInput.Icon icon={() => <Timer size={18} color={theme.colors.primary} />} />}
                                right={<TextInput.Affix text="Hours" />}
                                mode="outlined"
                            />
                            <HelperText type="info">
                                {t('offers.timer_info')} ({t('offers.timer_help')})
                            </HelperText>

                            {selectedOffer && (
                                <List.Item
                                    title={t('common.active')}
                                    right={() => (
                                        <Button
                                            mode={formData.isActive ? "contained" : "outlined"}
                                            onPress={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
                                        >
                                            {formData.isActive ? t('common.yes') : t('common.no')}
                                        </Button>
                                    )}
                                />
                            )}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)}>{t('common.cancel')}</Button>
                        <Button
                            onPress={handleSave}
                            loading={createMutation.isPending || updateMutation.isPending}
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {t('common.save')}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const getStatusColor = (status: string, theme: any) => {
    switch (status) {
        case 'Active': return theme.colors.secondary;
        case 'Scheduled': return '#f59e0b'; // Amber
        case 'Expired': return theme.colors.error;
        case 'Disabled': return theme.colors.outline;
        default: return theme.colors.outline;
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 80,
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
    addBtn: {
        marginTop: 24,
    },
    card: {
        marginBottom: 12,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    statusText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
    },
    divider: {
        marginVertical: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    originalPrice: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    timeText: {
        marginLeft: 6,
        opacity: 0.7,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    dialog: {
        maxHeight: '80%',
    },
    dialogScroll: {
        paddingHorizontal: 0,
    },
    label: {
        marginTop: 12,
        marginBottom: 4,
    },
    input: {
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    halfBtn: {
        flex: 1,
    },
    errorContainer: {
        backgroundColor: '#fee2e2',
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f87171',
    },
    errorText: {
        color: '#b91c1c',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    limitCard: {
        marginBottom: 16,
        borderRadius: 8,
        elevation: 1,
    },
    limitContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 8,
    },
    limitText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    limitWarning: {
        fontSize: 12,
        color: '#b91c1c',
        fontStyle: 'italic',
    }
});
