import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { MerchantSubscriptionRow, HealthStatus } from '@/types/admin';

export const useDashboardStats = () => {
    return useQuery({
        queryKey: ['admin-dashboard-stats'],
        queryFn: async () => {
            // We've updated AdminController.GetSubscriptionsMonitoring to include IsTemporarilyClosed
            // Fetching all 'active' or 'all' to get counts
            const response = await apiClient.get('Admin/subscriptions-monitoring', {
                params: { filter: 'active' } // Or 'all' if we had such filter, but 'active' is a good proxy for most
            });
            const merchants = response.data as MerchantSubscriptionRow[];

            return {
                merchantsOnline: merchants.filter(m => m.isOnShift).length,
                tempClosed: merchants.filter(m => m.isTemporarilyClosed).length
            };
        },
        refetchInterval: 7000 // Refresh every 7 seconds
    });
};

export const useSystemHealth = () => {
    const queryClient = useQueryClient();

    const query = useQuery<HealthStatus>({
        queryKey: ['system-health'],
        queryFn: async () => {
            const start = performance.now();
            try {
                // Using Admin/settings as a lightweight health check
                await apiClient.get('Admin/settings');
                const end = performance.now();
                return {
                    ok: true,
                    latencyMs: Math.round(end - start),
                    checkedAt: new Date().toISOString()
                };
            } catch (error: any) {
                const end = performance.now();
                return {
                    ok: false,
                    latencyMs: Math.round(end - start),
                    checkedAt: new Date().toISOString(),
                    message: error.message || 'API connection failed'
                };
            }
        },
        refetchInterval: 30000, // 30 seconds
        retry: false
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['system-health'] });
    };

    return { ...query, refresh };
};
