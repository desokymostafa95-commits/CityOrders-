import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';



import {
    Text,
    Card,
    Button,
    ActivityIndicator,
    Chip,
    FAB,
    Portal,
    Dialog,
    Divider,
    IconButton,
    useTheme as usePaperTheme,
} from 'react-native-paper';
import { router } from 'expo-router';
import { FileText, Clock, Play, Square, Calendar, ChevronRight } from 'lucide-react-native';
import {
    useCurrentShift,
    useInvoices,
    useShiftMutations,
    formatInvoiceDate,
    formatCurrency,
} from '@/src/hooks/useInvoices';
import { useSubscriptionStatus, useMerchantProfile } from '@/src/hooks/useMerchantData';
import { InvoicePreset, InvoiceSummaryDto } from '@/src/types';

import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { t } from '@/src/i18n';
import { useTheme } from '@/src/theme/ThemeContext';

const PRESETS: InvoicePreset[] = ['last24h', 'last7d', 'last30d', 'last90d', 'custom'];

function TimeAgo({ date, language }: { date: string | Date, language: string }) {
    const [timeAgo, setTimeAgo] = useState('');
    const theme = usePaperTheme();

    const updateTime = useCallback(() => {
        try {
            // Ensure date string is treated as UTC if no timezone indicator
            let dateString = typeof date === 'string' ? date : date.toISOString();
            if (typeof date === 'string' && !date.endsWith('Z') && !date.includes('+') && !date.includes('-', 10)) {
                dateString = date + 'Z';
            }
            const dateObj = new Date(dateString);
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

            // Handle future dates or very recent (< 60 seconds)
            if (diffInSeconds < 60 || diffInSeconds < 0) {
                setTimeAgo(language === 'ar' ? 'الآن' : 'just now');
            } else {
                setTimeAgo(formatDistanceToNow(dateObj, {
                    addSuffix: true,
                    locale: language === 'ar' ? ar : enUS
                }));
            }
        } catch (e) {
            setTimeAgo(language === 'ar' ? 'الآن' : 'just now');
        }
    }, [date, language]);


    useEffect(() => {
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, [updateTime]);

    return (
        <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
            {t('invoices.created_at', { timeAgo })}
        </Text>
    );
}


export default function InvoicesScreen() {
    const { isDark, language } = useTheme();

    const theme = usePaperTheme();
    const [selectedPreset, setSelectedPreset] = useState<InvoicePreset>('last7d');
    const [customFrom, setCustomFrom] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const [customTo, setCustomTo] = useState<Date>(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [confirmCloseVisible, setConfirmCloseVisible] = useState(false);

    // Get subscription status and profile for permission checks
    const { data: subscription } = useSubscriptionStatus();
    const { data: profile } = useMerchantProfile();

    const isExpired = subscription?.state === 'Expired';
    const isApproved = profile?.isApproved ?? false;
    const canManageShift = (subscription?.state === 'Active' || subscription?.state === 'Grace') && isApproved;


    // Shift data
    const { data: currentShift, isLoading: shiftLoading, refetch: refetchShift } = useCurrentShift();
    const { startShift, closeShift, isStarting, isClosing } = useShiftMutations();

    // Build query params based on filter
    const queryParams = selectedPreset === 'custom'
        ? { from: customFrom.toISOString(), to: customTo.toISOString() }
        : { preset: selectedPreset };

    // Invoices list
    const { data: invoicesData, isLoading: invoicesLoading, refetch: refetchInvoices } = useInvoices(queryParams);

    const onRefresh = useCallback(() => {
        refetchShift();
        refetchInvoices();
    }, [refetchShift, refetchInvoices]);

    const handleStartShift = async () => {
        try {
            await startShift();
        } catch (e) {
            // Error handled in hook
        }
    };

    const handleCloseShift = async () => {
        setConfirmCloseVisible(false);
        try {
            await closeShift();
        } catch (e) {
            // Error handled in hook
        }
    };

    const handleInvoicePress = (invoice: InvoiceSummaryDto) => {
        router.push(`/invoices/${invoice.invoiceId}` as any);
    };

    const handleFromChange = (event: any, selectedDate?: Date) => {
        setShowFromPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setCustomFrom(selectedDate);
        }
    };

    const handleToChange = (event: any, selectedDate?: Date) => {
        setShowToPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setCustomTo(selectedDate);
        }
    };

    const isValidRange = customFrom <= customTo;

    if (shiftLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const hasOpenShift = currentShift?.status === 'Open' && currentShift?.shiftId;

    const getPresetLabelText = (p: InvoicePreset) => {
        switch (p) {
            case 'last24h': return t('invoices.last_24h');
            case 'last7d': return t('invoices.last_7d');
            case 'last30d': return t('invoices.last_30d');
            case 'last90d': return t('invoices.last_90d');
            case 'custom': return t('invoices.custom');
            default: return p;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
            >
                {/* Current Shift Card */}
                <Card style={[styles.shiftCard, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                        <View style={styles.shiftHeader}>
                            <View style={styles.shiftTitle}>
                                <Clock size={20} color={theme.colors.primary} />
                                <Text variant="titleMedium" style={[styles.shiftTitleText, { color: theme.colors.onSurface }]}>
                                    {t('invoices.current_shift')}
                                </Text>
                            </View>
                            <Chip
                                mode="flat"
                                style={[
                                    styles.statusChip,
                                    hasOpenShift ? { backgroundColor: isDark ? '#1b5e20' : '#e8f5e9' } : { backgroundColor: theme.colors.surfaceVariant },
                                ]}
                                textStyle={{ color: hasOpenShift ? (isDark ? '#81c784' : '#1b5e20') : theme.colors.onSurfaceVariant, fontSize: 12 }}
                            >
                                {hasOpenShift ? t('invoices.open') : t('invoices.no_active_shift')}
                            </Chip>
                        </View>

                        {subscription?.isTrial && (
                            <View style={{ backgroundColor: theme.colors.primaryContainer, padding: 8, borderRadius: 8, marginBottom: 12 }}>
                                <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }}>
                                    {t('invoices.free_trial_active', { days: subscription.daysRemaining })}
                                </Text>
                            </View>
                        )}



                        {hasOpenShift && currentShift?.startAt && (
                            <View style={styles.shiftInfo}>
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                    {t('invoices.started')}: {formatInvoiceDate(currentShift.startAt)}
                                </Text>
                                {currentShift.liveStats && (
                                    <View style={[styles.liveStats, { backgroundColor: theme.colors.background }]}>
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                                            📦 {t('invoices.delivered_orders_count', { count: currentShift.liveStats.deliveredOrdersCount })}
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                                            💰 {t('invoices.est_total', { amount: formatCurrency(currentShift.liveStats.estimatedGrossSales) })}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <Divider style={styles.divider} />

                        <View style={styles.shiftActions}>
                            {!hasOpenShift ? (
                                <Button
                                    mode="contained"
                                    icon={() => <Play size={18} color={theme.colors.onPrimary} />}
                                    onPress={handleStartShift}
                                    loading={isStarting}
                                    disabled={!canManageShift || isStarting}
                                    style={styles.shiftButton}
                                >
                                    {t('invoices.start_day')}
                                </Button>
                            ) : (
                                <Button
                                    mode="contained"
                                    icon={() => <Square size={18} color={theme.colors.onPrimary} />}
                                    onPress={() => setConfirmCloseVisible(true)}
                                    loading={isClosing}
                                    disabled={!canManageShift || isClosing}
                                    style={[styles.shiftButton, styles.closeButton]}
                                    buttonColor={theme.colors.error}
                                >
                                    {t('invoices.close_day')}
                                </Button>
                            )}
                        </View>

                        {isExpired && (
                            <Text variant="bodySmall" style={[styles.expiredNote, { color: theme.colors.error }]}>
                                ⚠️ {t('invoices.subscription_expired_note')}
                            </Text>
                        )}
                        {!isApproved && !isExpired && (
                            <Text variant="bodySmall" style={[styles.expiredNote, { color: theme.colors.error }]}>
                                ⏳ {t('invoices.account_pending_approval')}
                            </Text>
                        )}
                    </Card.Content>

                </Card>

                {/* Filter Section */}
                <View style={styles.filterSection}>
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                        {t('invoices.invoice_history')}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                        {PRESETS.map((preset) => (
                            <Chip
                                key={preset}
                                selected={selectedPreset === preset}
                                onPress={() => setSelectedPreset(preset)}
                                style={[styles.filterChip, { backgroundColor: selectedPreset === preset ? theme.colors.primaryContainer : theme.colors.surface, marginRight: 8 }]}
                                mode={selectedPreset === preset ? 'flat' : 'outlined'}
                                selectedColor={theme.colors.primary}
                            >
                                {getPresetLabelText(preset)}
                            </Chip>
                        ))}
                    </ScrollView>

                    {/* Custom Date Range */}
                    {selectedPreset === 'custom' && (
                        <View style={[styles.customRange, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.dateRow}>
                                <Text style={[styles.dateLabel, { color: theme.colors.onSurfaceVariant }]}>{t('invoices.from')}:</Text>
                                <TouchableOpacity
                                    style={[styles.datePicker, { backgroundColor: theme.colors.background }]}
                                    onPress={() => setShowFromPicker(true)}
                                >
                                    <Calendar size={16} color={theme.colors.onSurfaceVariant} />
                                    <Text style={{ color: theme.colors.onSurface }}>
                                        {customFrom.toLocaleDateString()}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.dateRow}>
                                <Text style={[styles.dateLabel, { color: theme.colors.onSurfaceVariant }]}>{t('invoices.to')}:</Text>
                                <TouchableOpacity
                                    style={[styles.datePicker, { backgroundColor: theme.colors.background }]}
                                    onPress={() => setShowToPicker(true)}
                                >
                                    <Calendar size={16} color={theme.colors.onSurfaceVariant} />
                                    <Text style={{ color: theme.colors.onSurface }}>
                                        {customTo.toLocaleDateString()}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {!isValidRange && (
                                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                                    {t('invoices.invalid_date_range')}
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Invoices List */}
                {invoicesLoading ? (
                    <ActivityIndicator style={styles.listLoading} />
                ) : invoicesData?.items?.length === 0 ? (
                    <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
                        <Card.Content style={styles.emptyContent}>
                            <FileText size={48} color={theme.colors.outline} />
                            <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                                {t('invoices.no_invoices_found')}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.outline, textAlign: 'center', marginTop: 8 }}>
                                {t('invoices.close_shift_generate_first')}
                            </Text>
                        </Card.Content>
                    </Card>
                ) : (
                    invoicesData?.items?.map((invoice) => (
                        <TouchableOpacity
                            key={invoice.invoiceId}
                            onPress={() => handleInvoicePress(invoice)}
                        >
                            <Card style={[styles.invoiceCard, { backgroundColor: theme.colors.surface }]}>
                                <Card.Content style={styles.invoiceContent}>
                                    <View style={styles.invoiceMain}>
                                        <View style={styles.invoiceInfo}>
                                            <Text variant="titleMedium" style={[styles.invoiceNumber, { color: theme.colors.onSurface }]}>
                                                {invoice.invoiceNumber}
                                            </Text>
                                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                                                {formatInvoiceDate(invoice.startAt)} → {formatInvoiceDate(invoice.endAt)}
                                            </Text>
                                            <TimeAgo
                                                date={invoice.closedAt || invoice.endAt}
                                                language={language}
                                            />
                                        </View>

                                        <View style={styles.invoiceStats}>
                                            <Text variant="titleMedium" style={{ color: isDark ? '#81c784' : '#4caf50', fontWeight: 'bold' }}>
                                                {formatCurrency(invoice.grossSales, invoice.currency)}
                                            </Text>
                                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                {t('invoices.orders_count', { count: invoice.deliveredOrdersCount })}
                                            </Text>
                                        </View>
                                    </View>
                                    <ChevronRight size={20} color={theme.colors.outline} />
                                </Card.Content>
                            </Card>
                        </TouchableOpacity>
                    ))
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Date Pickers */}
            {showFromPicker && (
                <DateTimePicker
                    value={customFrom}
                    mode="date"
                    display="default"
                    onChange={handleFromChange}
                    maximumDate={customTo}
                />
            )}
            {showToPicker && (
                <DateTimePicker
                    value={customTo}
                    mode="date"
                    display="default"
                    onChange={handleToChange}
                    minimumDate={customFrom}
                    maximumDate={new Date()}
                />
            )}

            {/* Confirm Close Dialog */}
            <Portal>
                <Dialog visible={confirmCloseVisible} onDismiss={() => setConfirmCloseVisible(false)} style={{ backgroundColor: theme.colors.surface }}>
                    <Dialog.Title style={{ color: theme.colors.onSurface }}>{t('invoices.close_shift_confirm')}</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            {t('invoices.close_shift_message')}
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setConfirmCloseVisible(false)}>{t('common.cancel')}</Button>
                        <Button onPress={handleCloseShift} mode="contained" buttonColor={theme.colors.error}>
                            {t('invoices.close_generate')}
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
    scrollView: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shiftCard: {
        margin: 16,
        elevation: 2,
    },
    shiftHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    shiftTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    shiftTitleText: {
        fontWeight: 'bold',
    },
    statusChip: {
        height: 28,
    },
    statusOpen: {
        backgroundColor: '#e8f5e9',
    },
    shiftInfo: {
        marginBottom: 8,
    },
    liveStats: {
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        gap: 4,
    },
    divider: {
        marginVertical: 12,
    },
    shiftActions: {
        alignItems: 'center',
    },
    shiftButton: {
        width: '100%',
        borderRadius: 8,
    },
    closeButton: {
        marginTop: 0,
    },
    expiredNote: {
        color: '#f57c00',
        textAlign: 'center',
        marginTop: 12,
    },
    filterSection: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 12,
    },
    chipRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    filterChip: {
        marginRight: 8,
    },
    customRange: {
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    dateLabel: {
        width: 60,
    },
    datePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 8,
        flex: 1,
    },
    errorText: {
        color: '#d32f2f',
        fontSize: 12,
        marginTop: 4,
    },
    listLoading: {
        marginTop: 24,
    },
    emptyCard: {
        marginHorizontal: 16,
    },
    emptyContent: {
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        marginTop: 16,
    },
    invoiceCard: {
        marginHorizontal: 16,
        marginBottom: 8,
    },
    invoiceContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    invoiceMain: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    invoiceInfo: {
        flex: 1,
    },
    invoiceNumber: {
        fontWeight: 'bold',
    },
    invoiceStats: {
        alignItems: 'flex-end',
    },
});
