import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import http from '../api/http';
import { ENDPOINTS } from '../api/endpoints';
import { NotificationResponse } from '../types';

export const useNotifications = (options?: { unreadOnly?: boolean; enabled?: boolean }) => {
    return useQuery({
        queryKey: ['notifications', options?.unreadOnly ?? false],
        queryFn: async () => {
            const { data } = await http.get<NotificationResponse>(ENDPOINTS.NOTIFICATIONS.BASE, {
                params: { unreadOnly: options?.unreadOnly || undefined },
            });
            return data;
        },
        refetchInterval: 5000,
        enabled: options?.enabled ?? true,
    });
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await http.put(ENDPOINTS.NOTIFICATIONS.READ(id));
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useMarkAllNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data } = await http.put(ENDPOINTS.NOTIFICATIONS.READ_ALL);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};
