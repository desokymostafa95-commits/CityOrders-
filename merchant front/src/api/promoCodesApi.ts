import apiClient from './client';

export interface PromoCodeDto {
    id: number;
    code: string;
    discountType: 'Percentage' | 'Fixed';
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    usageLimit?: number;
    usageCount: number;
    isActive: boolean;
    startsAt?: string;
    expiresAt?: string;
    createdAt: string;
    status: 'Active' | 'Disabled' | 'Expired' | 'Scheduled' | 'Used Up';
}

export interface CreatePromoCodeDto {
    code: string;
    discountType: 'Percentage' | 'Fixed';
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    usageLimit?: number;
    isActive?: boolean;
    startsAt?: string;
    expiresAt?: string;
}

export interface UpdatePromoCodeDto {
    discountType: 'Percentage' | 'Fixed';
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    usageLimit?: number;
    isActive: boolean;
    startsAt?: string;
    expiresAt?: string;
}

export const promoCodesApi = {
    getAll: async (): Promise<PromoCodeDto[]> => {
        const res = await apiClient.get<PromoCodeDto[]>('/merchantpromocodes');
        return res.data;
    },

    create: async (data: CreatePromoCodeDto): Promise<PromoCodeDto> => {
        const res = await apiClient.post<PromoCodeDto>('/merchantpromocodes', data);
        return res.data;
    },

    update: async (id: number, data: UpdatePromoCodeDto): Promise<PromoCodeDto> => {
        const res = await apiClient.put<PromoCodeDto>(`/merchantpromocodes/${id}`, data);
        return res.data;
    },

    toggle: async (id: number): Promise<{ isActive: boolean }> => {
        const res = await apiClient.patch<{ isActive: boolean }>(`/merchantpromocodes/${id}/toggle`);
        return res.data;
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/merchantpromocodes/${id}`);
    },
};
