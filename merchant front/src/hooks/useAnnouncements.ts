import { useQuery } from '@tanstack/react-query';
import { announcementsApi } from '../api/announcementsApi';
import { GlobalAnnouncement } from '../types';

export function useActiveAnnouncements(options?: { enabled?: boolean }) {
    return useQuery<GlobalAnnouncement[]>({
        queryKey: ['active-announcements'],
        queryFn: announcementsApi.getActive,
        refetchInterval: 10000, // Refresh every 10 seconds
        staleTime: 0,
        enabled: options?.enabled ?? true,
    });
}
