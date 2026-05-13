import apiClient from './client';

export enum AnnouncementTarget {
    All = 0,
    Customer = 1,
    Merchant = 2
}

export interface GlobalAnnouncement {
    id: number;
    message: string;
    targetAudience: AnnouncementTarget;
    createdAt: string;
    isActive: boolean;
    expiresAt?: string;
}

export interface CreateAnnouncementDto {
    message: string;
    targetAudience: AnnouncementTarget;
    expiresAt?: string;
}

export const announcementsApi = {
    getAnnouncements: async () => {
        const response = await apiClient.get<GlobalAnnouncement[]>('announcements');
        return response.data;
    },
    createAnnouncement: async (data: CreateAnnouncementDto) => {
        const response = await apiClient.post<GlobalAnnouncement>('announcements', data);
        return response.data;
    },
    toggleAnnouncement: async (id: number) => {
        const response = await apiClient.put<{ id: number; isActive: boolean }>(`announcements/${id}/toggle`);
        return response.data;
    },
    deleteAnnouncement: async (id: number) => {
        await apiClient.delete(`announcements/${id}`);
    }
};
