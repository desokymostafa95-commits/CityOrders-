import apiClient from './client';
import { CategoryDto } from '../types';

export const categoriesApi = {
    getAll: async () => {
        const response = await apiClient.get<CategoryDto[]>('/MerchantCategories');
        return response.data;
    },
    create: async (name: string) => {
        const response = await apiClient.post<CategoryDto>('/MerchantCategories', { name });
        return response.data;
    },
    update: async (id: number, name: string) => {
        const response = await apiClient.put<CategoryDto>(`/MerchantCategories/${id}`, { name });
        return response.data;
    },
    delete: async (id: number) => {
        await apiClient.delete(`/MerchantCategories/${id}`);
    }
};
