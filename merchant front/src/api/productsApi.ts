import apiClient from './client';
import { ProductDto, CreateProductDto, UpdateProductDto, PaginatedResult, OrderListItem } from '../types';

export const productsApi = {
    getAll: async () => {
        const response = await apiClient.get<ProductDto[]>('/Merchant/products');
        return response.data;
    },
    create: async (data: CreateProductDto) => {
        const response = await apiClient.post<ProductDto>('/Merchant/products', data);
        return response.data;
    },
    update: async (id: number, data: UpdateProductDto) => {
        const response = await apiClient.put<ProductDto>(`/Merchant/products/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        await apiClient.delete(`/Merchant/products/${id}`);
    },
    toggle: async (id: number) => {
        const response = await apiClient.patch<{ isActive: boolean }>(`/Merchant/products/${id}/toggle`);
        return response.data;
    },
    getOrders: async (status?: string, page = 1) => {
        const response = await apiClient.get<PaginatedResult<OrderListItem>>('/Merchant/orders', {
            params: { status, page }
        });
        return response.data;
    }
};
