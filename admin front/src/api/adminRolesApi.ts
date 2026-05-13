import apiClient from './client';

export interface AdminRole {
    id: number;
    name: string;
    isCustom: boolean;
    permissions: string; // JSON array of endpoint strings
}

export const adminRolesApi = {
    getRoles: async () => {
        const response = await apiClient.get<AdminRole[]>('/api/adminroles');
        return response.data;
    },
    createRole: async (name: string, permissions: string[]) => {
        const response = await apiClient.post<AdminRole>('/api/adminroles', {
            name,
            permissionsJson: JSON.stringify(permissions)
        });
        return response.data;
    },
    updateRole: async (id: number, name: string, permissions: string[]) => {
        const response = await apiClient.put<AdminRole>(`/api/adminroles/${id}`, {
            name,
            permissionsJson: JSON.stringify(permissions)
        });
        return response.data;
    },
    deleteRole: async (id: number) => {
        await apiClient.delete(`/api/adminroles/${id}`);
    }
};
