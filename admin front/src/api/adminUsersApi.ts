import apiClient from './client';

export interface AdminUserRole {
    id: number;
    name: string;
    isCustom: boolean;
}

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
    roles: AdminUserRole[];
}

export const adminUsersApi = {
    getAdmins: async () => {
        const response = await apiClient.get<AdminUser[]>('adminusers');
        return response.data;
    },
    createAdmin: async (data: any) => {
        const response = await apiClient.post<AdminUser>('adminusers', data);
        return response.data;
    },
    updateAdminRole: async (id: number, roleId: number) => {
        await apiClient.put(`adminusers/${id}/role`, { roleId });
    },
    deleteAdmin: async (id: number) => {
        await apiClient.delete(`adminusers/${id}`);
    }
};
