import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { toast } from 'sonner';
import { MerchantSubscriptionRow, AuditLogRow, SubscriptionDetails } from '@/types/admin';

export const useSubscriptionsMonitoring = (params: { filter: string; days: number; search: string }) => {
    return useQuery({
        queryKey: ['admin-subscriptions', params],
        queryFn: async () => {
            try {
                // Prefer specific monitoring endpoint if it exists
                const response = await apiClient.get('Admin/subscriptions-monitoring', { params });
                return response.data as MerchantSubscriptionRow[];
            } catch (error: any) {
                // If endpoint missing, return empty or handle gracefully as requested
                if (error.response?.status === 404) {
                    throw new Error('Endpoint not available: GET /api/admin/subscriptions-monitoring');
                }
                throw error;
            }
        },
        retry: false
    });
};

export const useSubscriptionDetails = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['admin-subscription-details', userId],
        queryFn: async () => {
            if (!userId) return null;
            try {
                const response = await apiClient.get(`Admin/merchants/${userId}/subscription`);
                return response.data as SubscriptionDetails;
            } catch (error: any) {
                if (error.response?.status === 404) {
                    throw new Error(`Endpoint not available: GET /api/admin/merchants/${userId}/subscription`);
                }
                throw error;
            }
        },
        enabled: !!userId,
        retry: false
    });
};

export const useExtendSubscription = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, days, reason }: { userId: number; days: number; reason?: string }) => {
            try {
                const response = await apiClient.post(`Admin/subscriptions/${userId}/extend`, { days, reason });
                return response.data;
            } catch (error: any) {
                if (error.response?.status === 404) {
                    throw new Error('Endpoint not available: POST /api/admin/subscriptions/{id}/extend');
                }
                throw error;
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-subscription-details', String(variables.userId)] });
            queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
            toast.success('Subscription extended successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to extend subscription');
        }
    });
};

export const useForceExpire = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: number) => {
            try {
                const response = await apiClient.post(`Admin/subscriptions/${userId}/force-expire`);
                return response.data;
            } catch (error: any) {
                if (error.response?.status === 404) {
                    throw new Error('Endpoint not available: POST /api/admin/subscriptions/{id}/force-expire');
                }
                throw error;
            }
        },
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: ['admin-subscription-details', String(userId)] });
            queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
            toast.success('Subscription forced to expire');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to force expire');
        }
    });
};

export const useActivateMerchant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: number) => {
            const response = await apiClient.post(`Admin/merchants/${userId}/activate`);
            return response.data;
        },
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: ['admin-subscription-details', String(userId)] });
            queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
            toast.success('Merchant activated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data || error.message || 'Failed to activate merchant');
        }
    });
};

export const useDeactivateMerchant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: number) => {
            const response = await apiClient.post(`Admin/merchants/${userId}/deactivate`);
            return response.data;
        },
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: ['admin-subscription-details', String(userId)] });
            queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
            toast.success('Merchant deactivated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data || error.message || 'Failed to deactivate merchant');
        }
    });
};

export const useUpdateMerchantCategories = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, categoryIds }: { userId: number, categoryIds: number[] }) =>
            apiClient.post(`Admin/merchants/${userId}/categories`, categoryIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['admin-subscription-details'] });
            toast.success('Categories updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update categories');
        }
    });
};

export const useMasterCategories = () => {
    return useQuery({
        queryKey: ['admin-master-categories'],
        queryFn: async () => {
            const response = await apiClient.get('Admin/categories');
            return response.data;
        }
    });
};

export const useAuditLogs = (params: { from?: string; to?: string; type?: string }) => {
    return useQuery({
        queryKey: ['admin-audit-logs', params],
        queryFn: async () => {
            try {
                const response = await apiClient.get('Admin/audit', { params });
                return response.data as AuditLogRow[];
            } catch (error: any) {
                if (error.response?.status === 404) {
                    throw new Error('Endpoint not available: GET /api/admin/audit');
                }
                throw error;
            }
        },
        retry: false
    });
};
