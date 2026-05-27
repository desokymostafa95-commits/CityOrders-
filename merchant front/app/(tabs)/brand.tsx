import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, RefreshControl } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, Card, Divider, HelperText, useTheme as usePaperTheme } from 'react-native-paper';
import { useMarketSectors, useMyBrand, useSubscriptionStatus, useUpdateBrandLogo } from '@/src/hooks/useMerchantData';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { Avatar, IconButton } from 'react-native-paper';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MerchantSubscriptionStatusDto } from '@/src/types';
import apiClient from '@/src/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { t } from '@/src/i18n';
import { useTheme } from '@/src/theme/ThemeContext';

const optionalNumber = z.preprocess(
    (value) => value === '' || value === null || value === undefined ? undefined : Number(value),
    z.number().min(0).optional()
);

const schema = z.object({
    name: z.string().min(3, 'brand.validation.name_min'),
    address: z.string().min(5, 'brand.validation.address_required'),
    phone1: z.string().min(8, 'brand.validation.phone_required'),
    marketSectorId: z.coerce.number().int().positive('Select a market sector'),
    masterCategoryIds: z.array(z.number()).min(1, 'Select at least one category'),
    fixedDeliveryFee: z.coerce.number().min(0).default(0),
    minVariableDeliveryFee: z.coerce.number().min(0).default(0),
    maxVariableDeliveryFee: z.coerce.number().min(0).default(0),
    deliveryFeeType: z.enum(['Fixed', 'Variable']).default('Fixed'),
    baseDeliveryFee: z.coerce.number().min(0, 'brand.validation.delivery_base'),
    feePerKilometer: z.coerce.number().min(0, 'brand.validation.delivery_km'),
    minDeliveryFee: optionalNumber,
    maxDeliveryFee: optionalNumber,
    maxDeliveryDistanceKm: optionalNumber,
}).superRefine((data, ctx) => {
    if (data.minDeliveryFee !== undefined && data.maxDeliveryFee !== undefined && data.minDeliveryFee > data.maxDeliveryFee) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['maxDeliveryFee'],
            message: 'brand.validation.delivery_max_gte_min',
        });
    }
});

type BrandFormInput = z.input<typeof schema>;
type BrandFormData = z.output<typeof schema>;

export default function BrandScreen() {
    const { isDark } = useTheme();
    const theme = usePaperTheme();
    const { data: brand, isLoading } = useMyBrand();
    const { data: marketSectors = [] } = useMarketSectors();
    const sub = useSubscriptionStatus().data;
    const updateLogo = useUpdateBrandLogo();
    const [updating, setUpdating] = useState(false);
    const [previewDistanceKm, setPreviewDistanceKm] = useState('3');
    const isExpired = sub?.state === 'Expired' || sub?.state === 'None';
    const queryClient = useQueryClient();

    const getImageUrl = (path?: string) => {
        if (!path) return undefined;
        if (path.startsWith('http')) return path;
        const baseUrl = apiClient.defaults.baseURL || '';
        const serverRoot = baseUrl.replace('/api', '');
        return `${serverRoot}${path}`;
    };

    const handlePickImage = async () => {
        if (isExpired) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const formData = new FormData();

            // For web, we need to fetch the blob from the data URI
            if (asset.uri.startsWith('data:') || asset.uri.startsWith('blob:')) {
                try {
                    const response = await fetch(asset.uri);
                    const blob = await response.blob();
                    const file = new File([blob], 'logo.jpg', { type: blob.type || 'image/jpeg' });
                    formData.append('logo', file);
                } catch (e) {
                    console.error('Error converting image to blob:', e);
                    return;
                }
            } else {
                // For native platforms (iOS/Android)
                // @ts-ignore - React Native style file object
                formData.append('logo', {
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    name: 'logo.jpg',
                });
            }

            updateLogo.mutate(formData);
        }
    };

    // Auto-refresh brand data when profile changed (detected via status poll)
    React.useEffect(() => {
        if (sub?.updatedAt) {
            queryClient.invalidateQueries({ queryKey: ['my-brand'] });
        }
    }, [sub?.updatedAt]);

    const { control, handleSubmit, watch, setValue, formState: { isDirty } } = useForm<BrandFormInput, unknown, BrandFormData>({
        resolver: zodResolver(schema),
        values: brand ? {
            name: brand.name,
            address: brand.address || '',
            phone1: brand.phone1 || '',
            marketSectorId: brand.marketSectorId || 1,
            masterCategoryIds: brand.masterCategoryIds || [],
            fixedDeliveryFee: brand.fixedDeliveryFee || 0,
            minVariableDeliveryFee: brand.minVariableDeliveryFee || 0,
            maxVariableDeliveryFee: brand.maxVariableDeliveryFee || 0,
            deliveryFeeType: (brand.deliveryFeeType as 'Fixed' | 'Variable') || 'Fixed',
            baseDeliveryFee: brand.baseDeliveryFee || 0,
            feePerKilometer: brand.feePerKilometer || 0,
            minDeliveryFee: brand.minDeliveryFee ?? undefined,
            maxDeliveryFee: brand.maxDeliveryFee ?? undefined,
            maxDeliveryDistanceKm: brand.maxDeliveryDistanceKm ?? undefined,
        } : undefined
    });

    const baseDeliveryFeeValue = watch('baseDeliveryFee');
    const feePerKilometerValue = watch('feePerKilometer');
    const minDeliveryFeeValue = watch('minDeliveryFee');
    const maxDeliveryFeeValue = watch('maxDeliveryFee');
    const maxDeliveryDistanceKmValue = watch('maxDeliveryDistanceKm');
    const selectedSectorId = watch('marketSectorId');

    const deliveryPreview = React.useMemo(() => {
        const base = Number(baseDeliveryFeeValue || 0);
        const perKm = Number(feePerKilometerValue || 0);
        const min = minDeliveryFeeValue === undefined ? undefined : Number(minDeliveryFeeValue);
        const max = maxDeliveryFeeValue === undefined ? undefined : Number(maxDeliveryFeeValue);
        const maxDistance = maxDeliveryDistanceKmValue === undefined ? undefined : Number(maxDeliveryDistanceKmValue);
        const distance = Number(previewDistanceKm || 0);

        if (maxDistance !== undefined && distance > maxDistance) {
            return { fee: undefined, blocked: true };
        }

        let fee = base + (perKm * distance);
        if (min !== undefined && fee < min) fee = min;
        if (max !== undefined && fee > max) fee = max;
        return { fee: Number.isFinite(fee) ? fee : 0, blocked: false };
    }, [
        previewDistanceKm,
        baseDeliveryFeeValue,
        feePerKilometerValue,
        minDeliveryFeeValue,
        maxDeliveryFeeValue,
        maxDeliveryDistanceKmValue,
    ]);

    const [masterCategories, setMasterCategories] = useState<any[]>([]);

    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await apiClient.get('/Merchant/master-categories', {
                    params: { marketSectorId: selectedSectorId || undefined },
                });
                setMasterCategories(response.data);
            } catch (err) {
                console.error('Failed to fetch master categories', err);
            }
        };
        fetchCategories();
    }, [selectedSectorId]);

    const toggleCategory = (id: number, currentIds: number[], onChange: (ids: number[]) => void) => {
        if (currentIds.includes(id)) {
            onChange(currentIds.filter(i => i !== id));
        } else {
            onChange([...currentIds, id]);
        }
    };

    const onSubmit: SubmitHandler<BrandFormData> = async (data) => {
        if (isExpired) return;
        setUpdating(true);
        try {
            await apiClient.put('/Merchant/brand', data);
            queryClient.invalidateQueries({ queryKey: ['my-brand'] });
            Alert.alert(t('common.success'), t('brand.success_update'));
        } catch (err: any) {
            Alert.alert(t('common.error'), err.response?.data || t('brand.error_update'));
        } finally {
            setUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const onRefresh = async () => {
        setUpdating(true);
        await queryClient.invalidateQueries({ queryKey: ['my-brand'] });
        await queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
        setUpdating(false);
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl refreshing={updating} onRefresh={onRefresh} colors={[theme.colors.primary]} />
            }
        >
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Card.Title
                    title={t('brand.profile')}
                    subtitle={t('brand.profile_subtitle')}
                    titleStyle={{ color: theme.colors.onSurface }}
                    subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
                />
                <Card.Content>
                    {sub && !sub.isApproved && (
                        <View style={[styles.warningBanner, { backgroundColor: isDark ? '#3d2b00' : '#fff3e0', borderColor: '#ffb74d' }]}>
                            <Text style={{ color: isDark ? '#ffb74d' : '#e65100', fontWeight: 'bold', textAlign: 'center' }}>
                                ⚠️ {t('brand.awaiting_reapproval')}
                            </Text>
                        </View>
                    )}
                    {sub && !sub.isApproved && sub.rejectionReason && (
                        <View style={[styles.rejectionBanner, { backgroundColor: isDark ? '#3d0c0c' : '#ffebee', borderColor: '#ef5350' }]}>
                            <Text style={{ color: isDark ? '#ef5350' : '#c62828', fontWeight: 'bold', textAlign: 'center' }}>
                                ❌ {t('brand.rejection_reason', { reason: sub.rejectionReason })}
                            </Text>
                        </View>
                    )}

                    <View style={styles.logoSection}>
                        <View style={styles.avatarContainer}>
                            {brand?.logoUrl ? (
                                <Avatar.Image
                                    size={100}
                                    source={{ uri: getImageUrl(brand.logoUrl) }}
                                />
                            ) : (
                                <Avatar.Icon size={100} icon="store" />
                            )}
                            {!isExpired && (
                                <IconButton
                                    icon="camera"
                                    mode="contained"
                                    containerColor={theme.colors.primary}
                                    iconColor="white"
                                    size={20}
                                    style={styles.cameraButton}
                                    onPress={handlePickImage}
                                    loading={updateLogo.isPending}
                                />
                            )}
                        </View>
                        <Text variant="labelLarge" style={{ marginTop: 8 }}>
                            {brand?.logoUrl ? t('brand.change_logo') : t('brand.upload_logo')}
                        </Text>
                    </View>

                    <Divider style={{ marginVertical: 16 }} />

                    <Controller
                        control={control}
                        name="name"
                        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label={t('brand.name')}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    mode="outlined"
                                    error={!!error}
                                    disabled={isExpired}
                                />
                                {error && <Text style={{ color: theme.colors.error, fontSize: 12 }}>{error.message}</Text>}
                            </View>
                        )}
                    />

                    <Controller
                        control={control}
                        name="address"
                        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label={t('brand.address')}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    mode="outlined"
                                    multiline
                                    numberOfLines={3}
                                    error={!!error}
                                    disabled={isExpired}
                                />
                                {error && <Text style={{ color: theme.colors.error, fontSize: 12 }}>{error.message}</Text>}
                            </View>
                        )}
                    />

                    <Controller
                        control={control}
                        name="phone1"
                        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label={t('brand.phone')}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    mode="outlined"
                                    keyboardType="phone-pad"
                                    error={!!error}
                                    disabled={isExpired}
                                />
                                {error && <Text style={{ color: theme.colors.error, fontSize: 12 }}>{error.message}</Text>}
                            </View>
                        )}
                    />

                    <Text variant="labelLarge" style={styles.label}>Market sector</Text>
                    <Controller
                        control={control}
                        name="marketSectorId"
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                            <View>
                                <View style={styles.chipContainer}>
                                    {marketSectors.map((sector) => (
                                        <Button
                                            key={sector.id}
                                            mode={value === sector.id ? "contained" : "outlined"}
                                            onPress={() => {
                                                onChange(sector.id);
                                                setValue('masterCategoryIds', [], { shouldDirty: true, shouldValidate: true });
                                            }}
                                            style={styles.chip}
                                            labelStyle={{ fontSize: 12 }}
                                            disabled={isExpired}
                                            compact
                                        >
                                            {sector.name}
                                        </Button>
                                    ))}
                                </View>
                                {error && <Text style={{ color: theme.colors.error, fontSize: 12 }}>{error.message}</Text>}
                            </View>
                        )}
                    />

                    <Divider style={{ marginVertical: 16 }} />
                    <Text variant="titleMedium" style={{ marginBottom: 8 }}>{t('brand.delivery_fees')}</Text>
                    <HelperText type="info" visible style={styles.deliveryHint}>
                        {t('brand.delivery_pricing_hint')}
                    </HelperText>

                    <Controller
                        control={control}
                        name="baseDeliveryFee"
                        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label={t('brand.base_delivery_fee')}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value?.toString()}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    error={!!error}
                                    disabled={isExpired}
                                    right={<TextInput.Affix text={t('brand.egp')} />}
                                />
                                {error && <Text style={{ color: theme.colors.error, fontSize: 12 }}>{t(error.message || '')}</Text>}
                            </View>
                        )}
                    />

                    <Controller
                        control={control}
                        name="feePerKilometer"
                        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label={t('brand.delivery_fee_per_km')}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value?.toString()}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    error={!!error}
                                    disabled={isExpired}
                                    right={<TextInput.Affix text={t('brand.egp_per_km')} />}
                                />
                                {error && <Text style={{ color: theme.colors.error, fontSize: 12 }}>{t(error.message || '')}</Text>}
                            </View>
                        )}
                    />

                    <View style={styles.row}>
                        <View style={styles.flex1}>
                            <Controller
                                control={control}
                                name="minDeliveryFee"
                                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            label={t('brand.min_delivery_fee')}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value?.toString() ?? ''}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            error={!!error}
                                            disabled={isExpired}
                                            right={<TextInput.Affix text={t('brand.egp')} />}
                                        />
                                        {error && <Text style={{ color: theme.colors.error, fontSize: 12 }}>{t(error.message || '')}</Text>}
                                    </View>
                                )}
                            />
                        </View>
                        <View style={{ width: 16 }} />
                        <View style={styles.flex1}>
                            <Controller
                                control={control}
                                name="maxDeliveryFee"
                                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            label={t('brand.max_delivery_fee')}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value?.toString() ?? ''}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            error={!!error}
                                            disabled={isExpired}
                                            right={<TextInput.Affix text={t('brand.egp')} />}
                                        />
                                        {error && <Text style={{ color: theme.colors.error, fontSize: 12 }}>{t(error.message || '')}</Text>}
                                    </View>
                                )}
                            />
                        </View>
                    </View>

                    <Controller
                        control={control}
                        name="maxDeliveryDistanceKm"
                        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label={t('brand.max_delivery_distance_km')}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value?.toString() ?? ''}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    error={!!error}
                                    disabled={isExpired}
                                    right={<TextInput.Affix text={t('brand.km')} />}
                                />
                                {error && <Text style={{ color: theme.colors.error, fontSize: 12 }}>{t(error.message || '')}</Text>}
                            </View>
                        )}
                    />

                    <View style={[styles.deliveryPreview, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <View style={styles.row}>
                            <View style={styles.flex1}>
                                <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
                                    {t('brand.delivery_preview')}
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    {t('brand.delivery_preview_hint')}
                                </Text>
                            </View>
                            <TextInput
                                label={t('brand.preview_distance')}
                                value={previewDistanceKm}
                                onChangeText={setPreviewDistanceKm}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.previewInput}
                                right={<TextInput.Affix text={t('brand.km')} />}
                            />
                        </View>
                        <Text variant="headlineSmall" style={{ color: deliveryPreview.blocked ? theme.colors.error : theme.colors.primary, fontWeight: '900', marginTop: 12 }}>
                            {deliveryPreview.blocked ? t('brand.delivery_out_of_range') : `${deliveryPreview.fee?.toFixed(2)} ${t('brand.egp')}`}
                        </Text>
                    </View>

                    <Text variant="labelLarge" style={styles.label}>{t('apply.categories')}</Text>
                    <Controller
                        control={control}
                        name="masterCategoryIds"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.chipContainer}>
                                {masterCategories.map((cat) => (
                                    <Button
                                        key={cat.id}
                                        mode={value?.includes(cat.id) ? "contained" : "outlined"}
                                        onPress={() => toggleCategory(cat.id, value || [], onChange)}
                                        style={styles.chip}
                                        labelStyle={{ fontSize: 12 }}
                                        disabled={isExpired}
                                        compact
                                    >
                                        {cat.name}
                                    </Button>
                                ))}
                            </View>
                        )}
                    />

                    {isExpired && (
                        <Text style={[styles.expiredText, { color: theme.colors.error }]}>
                            ⚠️ {t('brand.expired_edit_note')}
                        </Text>
                    )}

                    <Button
                        mode="contained"
                        onPress={handleSubmit(onSubmit)}
                        loading={updating}
                        disabled={!isDirty || isExpired}
                        style={styles.button}
                    >
                        {t('brand.save_changes')}
                    </Button>
                </Card.Content>
            </Card>
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        elevation: 2,
    },
    inputContainer: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    expiredText: {
        color: '#f57c00',
        marginBottom: 16,
        textAlign: 'center',
    },
    warningBanner: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 16,
    },
    rejectionBanner: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 16,
    },
    label: {
        marginTop: 8,
        marginBottom: 8,
        fontWeight: 'bold',
        fontSize: 14,
    },
    deliveryHint: {
        paddingHorizontal: 0,
        marginBottom: 8,
    },
    deliveryPreview: {
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
    },
    previewInput: {
        width: 132,
        marginLeft: 12,
    },
    logoSection: {
        alignItems: 'center',
        marginVertical: 16,
    },
    avatarContainer: {
        position: 'relative',
    },
    cameraButton: {
        position: 'absolute',
        bottom: -10,
        right: -10,
        margin: 0,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    chip: {
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    flex1: {
        flex: 1,
    }
});
