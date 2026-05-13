import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity, Alert, Platform, RefreshControl } from 'react-native';
import {
    Text,
    Card,
    Button,
    ActivityIndicator,
    List,
    Divider,
    Portal,
    Dialog,
    TextInput,
    useTheme as usePaperTheme,
    IconButton,
} from 'react-native-paper';
import { useSubscriptionStatus, useActivateTrial } from '@/src/hooks/useMerchantData';
import apiClient from '@/src/api/client';
import { Camera, Copy } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SubscriptionPlanPublicDto, PaymentMethod } from '@/src/types';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { t } from '@/src/i18n';
import { useTheme } from '@/src/theme/ThemeContext';
import { subscriptionApi } from '@/src/api/subscriptionApi';
import { useFocusEffect } from 'expo-router';

export default function SubscriptionScreen() {
    const { isDark } = useTheme();
    const theme = usePaperTheme();
    const { data: sub, isLoading: subLoading, refetch: refetchSub } = useSubscriptionStatus();
    const activateTrialMutation = useActivateTrial();
    const queryClient = useQueryClient();

    const { data: plans, isLoading: plansLoading, refetch: refetchPlans } = useQuery<SubscriptionPlanPublicDto[]>({
        queryKey: ['subscription-plans'],
        queryFn: subscriptionApi.getPlans,
        staleTime: 0,
    });

    const { data: paymentMethods, isLoading: methodsLoading, refetch: refetchMethods } = useQuery<PaymentMethod[]>({
        queryKey: ['payment-methods'],
        queryFn: subscriptionApi.getPaymentMethods,
        staleTime: 0,
    });

    useFocusEffect(
        React.useCallback(() => {
            refetchSub();
            refetchPlans();
            refetchMethods();
        }, [])
    );

    const [renewVisible, setRenewVisible] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanPublicDto | null>(null);
    const [proofImage, setProofImage] = useState<string | null>(null);
    const [payerNumber, setPayerNumber] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchSub(), refetchPlans(), refetchMethods()]);
        setRefreshing(false);
    };

    const startRenew = (plan: SubscriptionPlanPublicDto) => {
        setSelectedPlan(plan);
        setRenewVisible(true);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setProofImage(result.assets[0].uri);
        }
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        if (Platform.OS === 'web') {
            window.alert(t('common.copied')); // Simple alert for web
        }
    };

    const submitRenewal = async () => {
        if (!proofImage || !selectedPlan || !payerNumber.trim()) {
            Alert.alert(t('common.error'), t('subscription.payer_number_required'));
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('planId', selectedPlan.id.toString());
            formData.append('payerNumber', payerNumber.trim());

            if (Platform.OS === 'web') {
                const response = await fetch(proofImage);
                const blob = await response.blob();
                formData.append('proofFile', blob, 'proof.jpg');
            } else {
                const uriParts = proofImage.split('.');
                const fileType = uriParts[uriParts.length - 1];

                // @ts-ignore
                formData.append('proofFile', {
                    uri: proofImage,
                    name: `proof.${fileType || 'jpg'}`,
                    type: `image/${fileType || 'jpeg'}`,
                });
            }

            await apiClient.post('/merchant/subscription/payment-request', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert(t('common.success'), t('subscription.success_msg'));
            setRenewVisible(false);
            setProofImage(null);
            setPayerNumber('');
            queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
        } catch (err: any) {
            Alert.alert(t('common.error'), err.response?.data || t('subscription.error_msg'));
        } finally {
            setSubmitting(false);
        }
    };

    if (subLoading || (plansLoading && !refreshing)) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const getStatusText = (state?: string) => {
        switch (state) {
            case 'Active': return t('subscription.active');
            case 'Expired': return t('subscription.expired');
            case 'Grace': return t('subscription.grace');
            default: return t('subscription.none');
        }
    };

    const getStatusColor = (state?: string) => {
        switch (state) {
            case 'Active': return theme.colors.primary;
            case 'Expired': return theme.colors.error;
            case 'Grace': return '#f59e0b';
            default: return theme.colors.outline;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <Card style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                            {t('subscription.current_status')}
                        </Text>
                        <View style={styles.statusRow}>
                            <Text variant="displaySmall" style={[styles.statusValue, { color: getStatusColor(sub?.state) }]}>
                                {getStatusText(sub?.state)}
                            </Text>
                        </View>
                        <Divider style={styles.divider} />
                        <List.Item
                            title={<Text style={[styles.label, { color: theme.colors.onSurface }]}>{t('subscription.plan')}</Text>}
                            description={<Text style={{ color: theme.colors.onSurfaceVariant }}>{sub?.planName || t('subscription.no_active_plan')}</Text>}
                            left={props => <List.Icon {...props} icon="star" color={theme.colors.primary} />}
                        />
                        <List.Item
                            title={<Text style={[styles.label, { color: theme.colors.onSurface }]}>{t('subscription.ends_on')}</Text>}
                            description={<Text style={{ color: theme.colors.onSurfaceVariant }}>{sub?.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A'}</Text>}
                            left={props => <List.Icon {...props} icon="calendar" color={theme.colors.primary} />}
                        />
                        {sub?.graceEndDate && (
                            <List.Item
                                title={<Text style={[styles.label, { color: theme.colors.error }]}>{t('subscription.grace_ends')}</Text>}
                                description={<Text style={{ color: theme.colors.error }}>{new Date(sub.graceEndDate).toLocaleDateString()}</Text>}
                                left={props => <List.Icon {...props} icon="alert" color={theme.colors.error} />}
                            />
                        )}
                        <List.Item
                            title={<Text style={[styles.label, { color: theme.colors.onSurface }]}>{t('subscription.offer_limit')}</Text>}
                            description={<Text style={{ color: theme.colors.onSurfaceVariant }}>{sub?.maxConcurrentOffers}</Text>}
                            left={props => <List.Icon {...props} icon="format-list-numbered" color={theme.colors.primary} />}
                        />
                        <List.Item
                            title={<Text style={[styles.label, { color: theme.colors.onSurface }]}>{t('subscription.grace_days')}</Text>}
                            description={<Text style={{ color: theme.colors.onSurfaceVariant }}>{t('subscription.grace_period_days', { count: sub?.graceDays })}</Text>}
                            left={props => <List.Icon {...props} icon="timer-sand" color={theme.colors.primary} />}
                        />
                    </Card.Content>
                </Card>

                {sub?.trialAvailable && (
                    <Card style={[styles.planCard, { backgroundColor: theme.colors.tertiaryContainer, marginBottom: 24 }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={{ color: theme.colors.onTertiaryContainer, fontWeight: 'bold' }}>
                                {t('subscription.free_trial')}
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onTertiaryContainer, marginTop: 4, marginBottom: 12 }}>
                                {sub.isFreeTrialEnabled
                                    ? t('subscription.trial_offer_msg', { days: sub.freeTrialDays || 14 })
                                    : t('subscription.trial_disabled_msg')
                                }
                            </Text>

                            <Button
                                mode="contained"
                                buttonColor={theme.colors.tertiary}
                                textColor={theme.colors.onTertiary}
                                disabled={!sub.isFreeTrialEnabled || activateTrialMutation.isPending}
                                loading={activateTrialMutation.isPending}
                                onPress={() => {
                                    Alert.alert(
                                        t('subscription.activate_trial_title'),
                                        t('subscription.activate_trial_confirm', { days: sub.freeTrialDays || 14 }),
                                        [
                                            { text: t('common.cancel'), style: 'cancel' },
                                            { text: t('common.yes'), onPress: () => activateTrialMutation.mutate() }
                                        ]
                                    );
                                }}
                            >
                                {sub.isFreeTrialEnabled ? t('subscription.start_free_trial') : t('subscription.trial_disabled')}
                            </Button>
                        </Card.Content>
                    </Card>
                )}

                <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface, marginTop: 8 }]}>
                    {t('subscription.available_plans')}
                </Text>
                {plans?.map(plan => (
                    <Card key={plan.id} style={[styles.planCard, { backgroundColor: theme.colors.surface }]}>
                        <Card.Content>
                            <View style={styles.planHeader}>
                                <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>{plan.name}</Text>
                                <Text variant="headlineMedium" style={[styles.price, { color: theme.colors.primary }]}>
                                    {plan.priceEgp} {t('subscription.egp')}
                                </Text>
                            </View>
                            <Text variant="bodyMedium" style={[styles.duration, { color: theme.colors.onSurfaceVariant }]}>
                                {t('subscription.duration_days', { count: plan.durationDays })}
                            </Text>

                            <View style={{ marginBottom: 16 }}>
                                <View style={styles.featureRow}>
                                    <List.Icon icon="timer-sand" color={theme.colors.onSurfaceVariant} style={{ margin: 0 }} />
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                        {t('subscription.grace_days')}: {t('subscription.grace_period_days', { count: plan.graceDays })}
                                    </Text>
                                </View>
                                <View style={styles.featureRow}>
                                    <List.Icon icon="format-list-numbered" color={theme.colors.onSurfaceVariant} style={{ margin: 0 }} />
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                        {t('subscription.offer_limit')}: {plan.maxConcurrentOffers}
                                    </Text>
                                </View>
                            </View>
                            <Button
                                mode="contained"
                                style={styles.renewBtn}
                                onPress={() => startRenew(plan)}
                                disabled={sub?.hasPendingPayment}
                            >
                                {sub?.hasPendingPayment ? t('subscription.payment_pending') : t('subscription.choose_plan')}
                            </Button>
                        </Card.Content>
                    </Card>
                ))}
            </ScrollView>

            <Portal>
                <Dialog visible={renewVisible} onDismiss={() => setRenewVisible(false)} style={{ backgroundColor: theme.colors.surface, maxHeight: '80%' }}>
                    <Dialog.Title style={{ color: theme.colors.onSurface }}>{t('subscription.renew_subscription')}</Dialog.Title>
                    <Dialog.ScrollArea>
                        <ScrollView contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 16 }}>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
                                {t('subscription.selected_plan_msg', { name: selectedPlan?.name })}
                            </Text>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                                    {t('subscription.payment_methods')}
                                </Text>
                                <IconButton
                                    icon="refresh"
                                    size={20}
                                    onPress={() => refetchMethods()}
                                    loading={methodsLoading}
                                />
                            </View>

                            {(methodsLoading && !refreshing) && <ActivityIndicator />}

                            {paymentMethods?.map(method => (
                                <View key={method.id} style={[styles.methodCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                                    <Text style={[styles.methodTitle, { color: theme.colors.onSurfaceVariant }]}>{method.displayName}</Text>

                                    {method.receiverName && (
                                        <Text style={{ color: theme.colors.onSurfaceVariant }}>{method.receiverName}</Text>
                                    )}

                                    <View style={styles.numberRow}>
                                        <Text style={[styles.numberText, { color: theme.colors.onSurfaceVariant }]}>{method.receiverNumber}</Text>
                                        <IconButton
                                            icon={() => <Copy size={20} color={theme.colors.primary} />}
                                            onPress={() => copyToClipboard(method.receiverNumber)}
                                            size={20}
                                        />
                                    </View>

                                    {method.instructions && (
                                        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, marginTop: 4 }}>{method.instructions}</Text>
                                    )}
                                </View>
                            ))}

                            <Text variant="bodySmall" style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
                                {t('subscription.upload_proof_msg')}
                            </Text>

                            <TouchableOpacity
                                style={[styles.uploadBox, { borderColor: theme.colors.outline }]}
                                onPress={pickImage}
                            >
                                {proofImage ? (
                                    <Image source={{ uri: proofImage }} style={styles.proofPreview} />
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <Camera size={32} color={theme.colors.outline} />
                                        <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                                            {t('subscription.select_proof_img')}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TextInput
                                label={t('subscription.payer_number')}
                                value={payerNumber}
                                onChangeText={setPayerNumber}
                                placeholder="e.g. 01012345678"
                                keyboardType="phone-pad"
                                style={{ marginTop: 16 }}
                                mode="outlined"
                            />
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setRenewVisible(false)}>{t('common.cancel')}</Button>
                        <Button
                            onPress={submitRenewal}
                            loading={submitting}
                            disabled={!proofImage || !payerNumber.trim()}
                            mode="contained"
                        >
                            {t('subscription.submit_proof')}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    statusCard: {
        marginBottom: 24,
        elevation: 2,
    },
    statusValue: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 16,
    },
    statusRow: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 16,
    },
    divider: {
        marginVertical: 8,
    },
    planCard: {
        marginBottom: 16,
        elevation: 2,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontWeight: 'bold',
    },
    duration: {
        marginTop: 8,
        marginBottom: 16,
    },
    renewBtn: {
        borderRadius: 8,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadBox: {
        width: '100%',
        height: 150,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 8,
        marginTop: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    proofPreview: {
        width: '100%',
        height: '100%',
    },
    methodCard: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    methodTitle: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    numberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    numberText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: -8,
    },
});
