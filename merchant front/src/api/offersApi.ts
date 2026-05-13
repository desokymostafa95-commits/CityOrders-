import apiClient from './client';
import { MerchantOfferDto, CreateOfferDto, UpdateOfferDto, OfferLimitDto } from '../types';

export const offersApi = {
    getAll: async () => {
        const response = await apiClient.get<MerchantOfferDto[]>('/merchant/offers');
        return response.data;
    },
    getCurrent: async () => {
        const response = await apiClient.get<MerchantOfferDto | null>('/merchant/offers/current');
        return response.data;
    },
    create: async (data: CreateOfferDto) => {
        const response = await apiClient.post<MerchantOfferDto>('/merchant/offers', data);
        return response.data;
    },
    update: async (id: number, data: UpdateOfferDto) => {
        const response = await apiClient.put<MerchantOfferDto>(`/merchant/offers/${id}`, data);
        return response.data;
    },
    disable: async (id: number) => {
        await apiClient.delete(`/merchant/offers/${id}`);
    },
    getLimit: async () => {
        const response = await apiClient.get<OfferLimitDto>('/merchant/offers/limit');
        return response.data;
    }
};
