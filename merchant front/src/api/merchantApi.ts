import apiClient from './client';
import { MarketSectorDto, MerchantAnalyticsOverview } from '../types';

export interface MerchantStoreLocation {
    lat: number;
    lng: number;
    updatedAt?: string;
}

export const merchantApi = {
    getBrandLocation: async (): Promise<MerchantStoreLocation> => {
        const response = await apiClient.get<MerchantStoreLocation>('/merchant/brand/location');
        return response.data;
    },
    updateBrandLocation: async (location: { lat: number, lng: number }): Promise<MerchantStoreLocation> => {
        const response = await apiClient.put<MerchantStoreLocation>('/merchant/brand/location', location);
        return response.data;
    },
    getMarketSectors: async (): Promise<MarketSectorDto[]> => {
        const response = await apiClient.get<MarketSectorDto[]>('/merchant/market-sectors');
        return response.data;
    },
    uploadLogo: async (formData: FormData): Promise<{ logoUrl: string }> => {
        const response = await apiClient.post<{ logoUrl: string }>('/merchant/brand/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getAnalyticsOverview: async (days = 30): Promise<MerchantAnalyticsOverview> => {
        const response = await apiClient.get<MerchantAnalyticsOverview>('/Analytics/merchant/overview', {
            params: { days }
        });
        return response.data;
    }
};
