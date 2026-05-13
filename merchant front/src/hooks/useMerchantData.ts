import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Platform } from 'react-native';
import apiClient from '../api/client';
import { productsApi } from '../api/productsApi';
import { invoicesApi } from '../api/invoicesApi';
import { subscriptionApi } from '../api/subscriptionApi';
import { merchantApi } from '../api/merchantApi';
import { MerchantSubscriptionStatusDto, BrandDto, OrderListItem, ProductDto, PaginatedResult, MerchantProfileDto, CurrentShiftDto, MerchantAvailabilityDto, TemporaryCloseDto, MerchantStoreLocation } from '../types';
import { t } from '../i18n';

// Helper function that works on both web and native
const showAlert = (title: string, message: string) => {
    console.log(`[ALERT] ${title}: ${message}`);
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


