import apiClient from './client';
import { GlobalAnnouncement } from '../types';

export const announcementsApi = {
    getActive: async (): Promise<GlobalAnnouncement[]> => {
        const response = await apiClient.get<GlobalAnnouncement[]>('announcements/active');
        return response.data;
    }
};
