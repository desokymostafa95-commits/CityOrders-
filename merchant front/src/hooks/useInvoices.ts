import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi, InvoiceListParams } from '../api/invoicesApi';
import {
    CurrentShiftDto,
    InvoiceSummaryDto,
    InvoiceDetailDto,
    InvoicesListResponse,
    InvoicePreset,
} from '../types';
import { Alert, Platform } from 'react-native';
import { t } from '../i18n';

// Query keys
export const invoiceKeys = {
    all: ['invoices'] as const,
    lists: () => [...invoiceKeys.all, 'list'] as const,
    list: (params: InvoiceListParams) => [...invoiceKeys.lists(), params] as const,
    details: () => [...invoiceKeys.all, 'detail'] as const,
    detail: (id: number) => [...invoiceKeys.details(), id] as const,
    currentShift: ['current-shift'] as const,
};

/**
 * Hook to get current open shift
 */
export function useCurrentShift(options?: { enabled?: boolean }) {
    return useQuery<CurrentShiftDto>({
        queryKey: invoiceKeys.currentShift,
        queryFn: invoicesApi.getCurrentShift,
        refetchInterval: 30000, // Refresh every 30 seconds for live stats
        enabled: options?.enabled ?? true,
    });
}

/**
 * Hook to list invoices with filters
 */
export function useInvoices(params: InvoiceListParams = {}, options?: { enabled?: boolean }) {
    return useQuery<InvoicesListResponse>({
        queryKey: invoiceKeys.list(params),
        queryFn: () => invoicesApi.getInvoices(params),
        enabled: options?.enabled ?? true,
    });
}

/**
 * Hook to get invoice details
 */
export function useInvoiceDetails(invoiceId: number | null) {
    return useQuery<InvoiceDetailDto>({
        queryKey: invoiceKeys.detail(invoiceId!),
        queryFn: () => invoicesApi.getInvoiceById(invoiceId!),
        enabled: invoiceId !== null,
    });
}

/**
 * Hook for shift operations (start/close)
 */
export function useShiftMutations() {
    const queryClient = useQueryClient();

    const startShiftMutation = useMutation({
        mutationFn: invoicesApi.startShift,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.currentShift });
            queryClient.invalidateQueries({ queryKey: ['merchant-availability'] });
            showAlert(t('invoices.shift_started_title'), t('invoices.shift_started_message'));
        },
        onError: (error: any) => {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data;

            if (status === 409) {
                showAlert(t('invoices.shift_already_open_title'), t('invoices.shift_already_open_message'));
            } else if (status === 403) {
                if (message?.includes('deactivated')) {
                    showAlert(t('invoices.error_title'), t('invoices.account_deactivated'));
                } else {
                    showAlert(t('invoices.subscription_required_title'), t('invoices.subscription_required_message'));
                }
            } else {
                showAlert(t('invoices.error_title'), message || t('invoices.error_start_shift'));
            }
        },
    });

    const closeShiftMutation = useMutation({
        mutationFn: invoicesApi.closeShift,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.currentShift });
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ['merchant-availability'] });
            showAlert(
                t('invoices.invoice_generated_title'),
                t('invoices.invoice_generated_message', {
                    invoiceNumber: data.invoiceNumber,
                    ordersCount: data.deliveredOrdersCount,
                    total: `${data.grossSales} ${data.currency}`
                })
            );
        },
        onError: (error: any) => {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.response?.data;

            if (status === 404) {
                showAlert(t('invoices.no_open_shift_title'), t('invoices.no_open_shift_message'));
            } else if (status === 403) {
                showAlert(t('invoices.subscription_required_title'), t('invoices.subscription_required_message'));
            } else {
                showAlert(t('invoices.error_title'), message || t('invoices.error_close_shift'));
            }
        },
    });

    return {
        startShift: startShiftMutation.mutate,
        closeShift: closeShiftMutation.mutate,
        isStarting: startShiftMutation.isPending,
        isClosing: closeShiftMutation.isPending,
    };
}

/**
 * Helper function to show alerts cross-platform
 */
function showAlert(title: string, message: string) {
    if (Platform.OS === 'web') {
        alert(`${title}: ${message}`);
    } else {
        Alert.alert(title, message);
    }
}


/**
 * Helper to get preset label
 */
export function getPresetLabel(preset: InvoicePreset): string {
    switch (preset) {
        case 'last24h':
            return 'Last 24h';
        case 'last7d':
            return 'Last 7 days';
        case 'last30d':
            return 'Last 30 days';
        case 'last90d':
            return 'Last 90 days';
        case 'custom':
            return 'Custom';
        default:
            return preset;
    }
}

/**
 * Format date for display
 */
export function formatInvoiceDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'EGP'): string {
    return `${amount.toFixed(2)} ${currency}`;
}
