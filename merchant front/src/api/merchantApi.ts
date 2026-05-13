import apiClient from './client';

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
    uploadLogo: async (formData: FormData): Promise<{ logoUrl: string }> => {
        const response = await apiClient.post<{ logoUrl: string }>('/merchant/brand/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
