import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText, useTheme as usePaperTheme, SegmentedButtons } from 'react-native-paper';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/src/auth/context';
import apiClient from '@/src/api/client';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { t } from '@/src/i18n';

const schema = z.object({
    brandName: z.string().min(3, 'Brand name must be at least 3 characters'),
    brandAddress: z.string().min(5, 'Address is required'),
    brandPhone: z.string().min(8, 'Valid phone number is required'),
    masterCategoryIds: z.array(z.number()).min(1, 'Select at least one category'),
    fixedDeliveryFee: z.coerce.number().min(0).default(0),
    minVariableDeliveryFee: z.coerce.number().min(0).default(0),
    maxVariableDeliveryFee: z.coerce.number().min(0).default(0),
    deliveryFeeType: z.enum(['Fixed', 'Variable']),
}).superRefine((data, ctx) => {
    if (data.deliveryFeeType === 'Fixed') {
        if (data.fixedDeliveryFee === undefined || data.fixedDeliveryFee === null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Fixed fee is required",
                path: ["fixedDeliveryFee"]
            });
        }
    } else {
        if (data.minVariableDeliveryFee === undefined || data.minVariableDeliveryFee === null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Min fee is required",
                path: ["minVariableDeliveryFee"]
            });
        }
        if (data.maxVariableDeliveryFee === undefined || data.maxVariableDeliveryFee === null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Max fee is required",
                path: ["maxVariableDeliveryFee"]
            });
        }
        if (data.minVariableDeliveryFee !== undefined && data.maxVariableDeliveryFee !== undefined && data.minVariableDeliveryFee > data.maxVariableDeliveryFee) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Min fee cannot be greater than max fee",
                path: ["minVariableDeliveryFee"]
            });
        }
    }
});

type FormData = {
    brandName: string;
    brandAddress: string;
    brandPhone: string;
    masterCategoryIds: number[];
    fixedDeliveryFee: number;
    minVariableDeliveryFee: number;
    maxVariableDeliveryFee: number;
    deliveryFeeType: 'Fixed' | 'Variable';
};

export default function ApplyScreen() {
    const { signIn, signOut } = useAuth();
    const theme = usePaperTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            brandName: '',
            brandAddress: '',
            brandPhone: '',
            masterCategoryIds: [],
            fixedDeliveryFee: 0,
            minVariableDeliveryFee: 0,
            maxVariableDeliveryFee: 0,
            deliveryFeeType: 'Fixed',
        }
    });

    const [masterCategories, setMasterCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await apiClient.get('/Merchant/master-categories');
                setMasterCategories(response.data);
            } catch (err) {
                console.error('Failed to fetch master categories', err);
            }
        };
        fetchCategories();
    }, []);

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setLoading(true);
        setError(null);
        try {
            // Clean up fee fields based on type
            const finalData = { ...data };
            if (data.deliveryFeeType === 'Fixed') {
                finalData.minVariableDeliveryFee = 0;
                finalData.maxVariableDeliveryFee = 0;
            } else {
                finalData.fixedDeliveryFee = 0;
            }

            const response = await apiClient.post('/Merchant/apply', finalData);
            const { token, roles } = response.data;

            // Refresh auth state with new token (containing Merchant role)
            if (token && roles) {
                await signIn(token, roles);
            }

            queryClient.invalidateQueries({ queryKey: ['my-brand'] });
            router.replace('/(tabs)');
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data || 'Failed to submit application.');
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (id: number, currentIds: number[], onChange: (ids: number[]) => void) => {
        if (currentIds.includes(id)) {
            onChange(currentIds.filter(i => i !== id));
        } else {
            onChange([...currentIds, id]);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
                    {t('apply.title')}
                </Text>
                <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                    {t('apply.subtitle')}
                </Text>

                <View style={styles.form}>
                    <Controller
                        control={control}
                        name="brandName"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                label={t('apply.brand_name')}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                mode="outlined"
                                error={!!errors.brandName}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.brandName && <HelperText type="error">{errors.brandName.message}</HelperText>}

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
                                        compact
                                    >
                                        {cat.name}
                                    </Button>
                                ))}
                            </View>
                        )}
                    />

                    <Controller
                        control={control}
                        name="brandAddress"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                label={t('apply.address')}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                error={!!errors.brandAddress}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.brandAddress && <HelperText type="error">{errors.brandAddress.message}</HelperText>}

                    <Controller
                        control={control}
                        name="brandPhone"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                label={t('apply.contact_phone')}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                mode="outlined"
                                keyboardType="phone-pad"
                                error={!!errors.brandPhone}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.brandPhone && <HelperText type="error">{errors.brandPhone.message}</HelperText>}

                    <Text variant="titleMedium" style={{ marginVertical: 8 }}>{t('brand.delivery_fees')}</Text>
                    <Controller
                        control={control}
                        name="deliveryFeeType"
                        render={({ field: { onChange, value } }) => (
                            <SegmentedButtons
                                value={value}
                                onValueChange={onChange}
                                buttons={[
                                    { value: 'Fixed', label: t('brand.fixed_delivery_fee') },
                                    { value: 'Variable', label: t('brand.variable_fee_range') },
                                ]}
                                style={{ marginBottom: 16 }}
                            />
                        )}
                    />

                    {watch('deliveryFeeType') === 'Fixed' ? (
                        <View style={styles.row}>
                            <View style={styles.flex1}>
                                <Controller
                                    control={control}
                                    name="fixedDeliveryFee"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            label={t('brand.fixed_delivery_fee')}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value?.toString()}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            error={!!errors.fixedDeliveryFee}
                                            style={styles.input}
                                        />
                                    )}
                                />
                                {errors.fixedDeliveryFee && <HelperText type="error">{errors.fixedDeliveryFee.message}</HelperText>}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.row}>
                            <View style={styles.flex1}>
                                <Controller
                                    control={control}
                                    name="minVariableDeliveryFee"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            label={t('brand.min')}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value?.toString()}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            error={!!errors.minVariableDeliveryFee}
                                            style={styles.input}
                                        />
                                    )}
                                />
                                {errors.minVariableDeliveryFee && <HelperText type="error">{errors.minVariableDeliveryFee.message}</HelperText>}
                            </View>
                            <View style={{ width: 16 }} />
                            <View style={styles.flex1}>
                                <Controller
                                    control={control}
                                    name="maxVariableDeliveryFee"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            label={t('brand.max')}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value?.toString()}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            error={!!errors.maxVariableDeliveryFee}
                                            style={styles.input}
                                        />
                                    )}
                                />
                                {errors.maxVariableDeliveryFee && <HelperText type="error">{errors.maxVariableDeliveryFee.message}</HelperText>}
                            </View>
                        </View>
                    )}

                    {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}

                    <Button
                        mode="contained"
                        onPress={handleSubmit(onSubmit)}
                        loading={loading}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                    >
                        {t('apply.submit')}
                    </Button>

                    <Button
                        mode="text"
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                signOut();
                            }
                        }}
                        style={styles.secondaryButton}
                    >
                        {t('apply.go_back')}
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        marginBottom: 32,
    },
    form: {
        width: '100%',
    },
    input: {
        marginBottom: 8,
    },
    button: {
        marginTop: 16,
        borderRadius: 8,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    secondaryButton: {
        marginTop: 16,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 8,
    },
    label: {
        marginTop: 16,
        marginBottom: 8,
        fontWeight: 'bold',
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
