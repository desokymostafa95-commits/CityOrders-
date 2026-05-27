import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Platform } from 'react-native';
import apiClient from '../api/client';
import { productsApi } from '../api/productsApi';
import { invoicesApi } from '../api/invoicesApi';
import { subscriptionApi } from '../api/subscriptionApi';
import { merchantApi } from '../api/merchantApi';
import { MerchantSubscriptionStatusDto, BrandDto, OrderListItem, ProductDto, PaginatedResult, MerchantProfileDto, CurrentShiftDto, MerchantAvailabilityDto, TemporaryCloseDto, MerchantStoreLocation, NotificationResponse, ChatThreadSummary, ChatThreadDetail, ChatMessage, MerchantOrderDetail, MerchantAnalyticsOverview, MarketSectorDto } from '../types';
import { t } from '../i18n';

const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message);
    }
};


export function useSubscriptionStatus(options?: { enabled?: boolean }) {
    return useQuery<MerchantSubscriptionStatusDto>({
        queryKey: ['subscription-status'],
        queryFn: async () => {
            const response = await apiClient.get('/merchant/subscription/status');
            return response.data;
        },
        refetchInterval: 10000,
        staleTime: 0,
        enabled: options?.enabled ?? true,
    });
}

export function useMyBrand(options?: { enabled?: boolean }) {
    return useQuery<BrandDto>({
        queryKey: ['my-brand'],
        queryFn: async () => {
            const response = await apiClient.get('/Merchant/brand');
            return response.data;
        },
        refetchInterval: (query) => {
            const error = query.state.error as any;
            if (error?.response?.status === 403 || error?.response?.status === 404) {
                return false;
            }
            return 15000;
        },
        retry: (failureCount, error: any) => {
            if (error.response?.status === 403 || error.response?.status === 404) {
                return false;
            }
            return failureCount < 3;
        },
        enabled: options?.enabled ?? true,
    });
}

export function useMyProducts(options?: { enabled?: boolean }) {
    return useQuery<ProductDto[]>({
        queryKey: ['my-products'],
        queryFn: productsApi.getAll,
        enabled: options?.enabled ?? true,
    });
}

export function useMyOrders(status?: string, page = 1, options?: { enabled?: boolean }) {
    return useQuery<PaginatedResult<OrderListItem>>({
        queryKey: ['my-orders', status, page],
        queryFn: () => productsApi.getOrders(status, page),
        enabled: options?.enabled ?? true,
        refetchInterval: 5000,
    });
}

export function useMarketSectors(options?: { enabled?: boolean }) {
    return useQuery<MarketSectorDto[]>({
        queryKey: ['market-sectors'],
        queryFn: merchantApi.getMarketSectors,
        staleTime: 5 * 60 * 1000,
        enabled: options?.enabled ?? true,
    });
}

export function useMyOrder(orderId?: number, options?: { enabled?: boolean }) {
    return useQuery<MerchantOrderDetail>({
        queryKey: ['my-order', orderId],
        queryFn: () => productsApi.getOrder(orderId!),
        enabled: (options?.enabled ?? true) && !!orderId,
    });
}


export function useMerchantProfile(options?: { enabled?: boolean }) {
    return useQuery<MerchantProfileDto>({
        queryKey: ['merchant-profile'],
        queryFn: async () => {
            const response = await apiClient.get('/merchant/profile');
            return response.data;
        },
        refetchInterval: 10000,
        staleTime: 0,
        enabled: options?.enabled ?? true,
    });
}


export function useActivateTrial() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: subscriptionApi.activateTrial,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
            queryClient.invalidateQueries({ queryKey: ['merchant-profile'] });
            queryClient.invalidateQueries({ queryKey: ['my-brand'] });
            showAlert(t('subscription.trial_activated_title'), t('subscription.trial_activated_message'));
        },
        onError: (error: any) => {
            const data = error.response?.data;
            const msg = data?.error || data?.message || (typeof data === 'string' ? data : null) || error.message || 'Failed to activate trial.';
            showAlert(t('common.error'), msg);
        },
    });
}


export function useMerchantAvailability(options?: { enabled?: boolean }) {
    return useQuery<MerchantAvailabilityDto>({
        queryKey: ['merchant-availability'],
        queryFn: async () => {
            const response = await apiClient.get('/merchant/availability');
            return response.data;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
        enabled: options?.enabled ?? true,
    });
}

export function useTemporaryClose() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: TemporaryCloseDto) => {
            const response = await apiClient.post('/merchant/availability/temporary-close', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchant-availability'] });
            showAlert(t('common.success'), t('dashboard.merchant_closed_msg'));
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || error.message || 'Failed to close merchant.';
            showAlert(t('common.error'), msg);
        },
    });
}

export function useTemporaryOpen() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post('/merchant/availability/temporary-open');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchant-availability'] });
            showAlert(t('common.success'), t('dashboard.merchant_opened_msg'));
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || error.message || 'Failed to open merchant.';
            showAlert(t('common.error'), msg);
        },
    });
}

export function useBrandLocation(options?: { enabled?: boolean }) {
    return useQuery<MerchantStoreLocation>({
        queryKey: ['brand-location'],
        queryFn: merchantApi.getBrandLocation,
        enabled: options?.enabled ?? true,
        staleTime: 0,
    });
}

export function useUpdateBrandLocation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: merchantApi.updateBrandLocation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brand-location'] });
            showAlert(t('common.success'), t('location.save_success'));
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || error.message || 'Failed to save location.';
            showAlert(t('common.error'), msg);
        },
    });
}

export function useUpdateBrandLogo() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: merchantApi.uploadLogo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-brand'] });
            showAlert(t('common.success'), t('brand.logo_upload_success'));
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || error.message || 'Failed to upload logo.';
            showAlert(t('common.error'), msg);
        },
    });
}

export function useMerchantAnalytics(days = 30, options?: { enabled?: boolean }) {
    return useQuery<MerchantAnalyticsOverview>({
        queryKey: ['merchant-analytics', days],
        queryFn: () => merchantApi.getAnalyticsOverview(days),
        refetchInterval: 5000,
        refetchIntervalInBackground: true,
        refetchOnMount: 'always',
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        staleTime: 0,
        enabled: options?.enabled ?? true,
    });
}

export function useNotifications(options?: { unreadOnly?: boolean; enabled?: boolean }) {
    return useQuery<NotificationResponse>({
        queryKey: ['notifications', options?.unreadOnly ?? false],
        queryFn: async () => {
            const response = await apiClient.get('/Notifications', {
                params: { unreadOnly: options?.unreadOnly || undefined },
            });
            return response.data;
        },
        refetchInterval: 8000,
        enabled: options?.enabled ?? true,
    });
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const response = await apiClient.put(`/Notifications/${id}/read`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

export function useChatThreads(options?: { type?: string; enabled?: boolean }) {
    return useQuery<ChatThreadSummary[]>({
        queryKey: ['chat-threads', options?.type],
        queryFn: async () => {
            const response = await apiClient.get('/Chat/threads', {
                params: { type: options?.type || undefined },
            });
            return response.data;
        },
        refetchInterval: 15000,
        enabled: options?.enabled ?? true,
    });
}

export function useChatThread(threadId: number, options?: { enabled?: boolean }) {
    return useQuery<ChatThreadDetail>({
        queryKey: ['chat-thread', threadId],
        queryFn: async () => {
            const response = await apiClient.get(`/Chat/threads/${threadId}`);
            return response.data;
        },
        refetchInterval: 3000,
        refetchOnWindowFocus: true,
        enabled: (options?.enabled ?? true) && !!threadId,
    });
}

export function useMerchantOrderChatThread() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (orderId: number) => {
            const response = await apiClient.post<ChatThreadSummary>(`/Chat/merchant/orders/${orderId}/thread`);
            return response.data;
        },
        onSuccess: (thread) => {
            queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
            queryClient.invalidateQueries({ queryKey: ['chat-thread', thread.id] });
        },
    });
}

export function useMerchantAdminChatThread() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post<ChatThreadSummary>('/Chat/merchant/admin/thread');
            return response.data;
        },
        onSuccess: (thread) => {
            queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
            queryClient.invalidateQueries({ queryKey: ['chat-thread', thread.id] });
        },
    });
}

export function useSendChatMessage(threadId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ body, attachmentUrl }: { body: string; attachmentUrl?: string }) => {
            const response = await apiClient.post<ChatMessage>(`/Chat/threads/${threadId}/messages`, { body, attachmentUrl });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
            queryClient.invalidateQueries({ queryKey: ['chat-thread', threadId] });
        },
    });
}

export function useBlockChatThread(threadId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post(`/Chat/threads/${threadId}/block`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
            queryClient.invalidateQueries({ queryKey: ['chat-thread', threadId] });
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || error.message || 'Failed to block chat thread.';
            showAlert(t('common.error'), msg);
        },
    });
}

export function useUnblockChatThread(threadId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post(`/Chat/threads/${threadId}/unblock`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
            queryClient.invalidateQueries({ queryKey: ['chat-thread', threadId] });
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || error.message || 'Failed to unblock chat thread.';
            showAlert(t('common.error'), msg);
        },
    });
}



