import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { AdminAnalyticsOverview, DashboardSummary, HealthStatus } from '@/types/admin';

export const useDashboardStats = () => {
    return useQuery<DashboardSummary>({
        queryKey: ['admin-dashboard-stats'],
        queryFn: async () => {
            const response = await apiClient.get<DashboardSummary>('Admin/dashboard-summary');
            return response.data;
        },
        refetchInterval: 7000,
    });
};

export const useSystemHealth = () => {
    const queryClient = useQueryClient();

    const query = useQuery<HealthStatus>({
        queryKey: ['system-health'],
        queryFn: async () => {
            const start = performance.now();
            try {
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
        refetchInterval: 30000,
        retry: false
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['system-health'] });
    };

    return { ...query, refresh };
};

export const useAdminAnalyticsOverview = (days = 7) => {
    return useQuery<AdminAnalyticsOverview>({
        queryKey: ['admin-analytics-overview', days],
        queryFn: async () => {
            const response = await apiClient.get<AdminAnalyticsOverview>('Analytics/admin/overview', {
                params: { days }
            });
            return response.data;
        },
        refetchInterval: 10000,
    });
};
