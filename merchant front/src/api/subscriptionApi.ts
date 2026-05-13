import apiClient from './client';
import { MerchantSubscriptionStatusDto, SubmitPaymentRequestDto, SubscriptionPlanPublicDto, PaymentRequestHistoryDto } from '../types';

export const subscriptionApi = {
    getStatus: async (): Promise<MerchantSubscriptionStatusDto> => {
        const response = await apiClient.get<MerchantSubscriptionStatusDto>('/merchant/subscription/status');
        return response.data;
    },

    getPlans: async (): Promise<SubscriptionPlanPublicDto[]> => {
        const response = await apiClient.get<SubscriptionPlanPublicDto[]>('/merchant/subscription/plans');
        return response.data;
    },

    activateTrial: async (): Promise<MerchantSubscriptionStatusDto> => {
        const response = await apiClient.post<MerchantSubscriptionStatusDto>('/merchant/subscription/trial/activate');
        return response.data;
    },

    submitPaymentRequest: async (data: SubmitPaymentRequestDto) => {
        const formData = new FormData();
        formData.append('PlanId', data.PlanId.toString());
        // Handle file
        if (data.ProofFile) {
            formData.append('ProofFile', data.ProofFile as any);
        }

        const response = await apiClient.post('/merchant/subscription/payment-request', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getHistory: async (): Promise<PaymentRequestHistoryDto[]> => {
        const response = await apiClient.get<PaymentRequestHistoryDto[]>('/merchant/subscription/payment-requests');
        return response.data;
    },

    getPaymentMethods: async (): Promise<import('../types').PaymentMethod[]> => {
        const response = await apiClient.get<import('../types').PaymentMethod[]>('/payments/methods');
        return response.data;
    }
};
