import apiClient from './client';

export interface AdminPromoCodeDto {
    id: number;
    brandId: number;
    brandName: string;
    code: string;
    discountType: string;
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    usageLimit?: number;
    usageCount: number;
    isActive: boolean;
    startsAt?: string;
    expiresAt?: string;
    createdAt: string;
    status: string;
}

export const adminPromoCodesApi = {
    getAll: async () => {
        const response = await apiClient.get<AdminPromoCodeDto[]>('/admin/promos');
        return response.data;
    }
};
