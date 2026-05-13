import { http } from './http';
import { ENDPOINTS } from './endpoints';
import { GlobalAnnouncement } from '../types';

export const announcementsApi = {
    getActive: async (): Promise<GlobalAnnouncement[]> => {
        const response = await http.get<GlobalAnnouncement[]>(ENDPOINTS.ANNOUNCEMENTS.ACTIVE);
        return response.data;
    }
};
