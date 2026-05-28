import apiClient from './client';

export interface DeliveryAgent {
    userId: number;
    name: string;
    email: string;
    agentType: string;
    deliveryOfficeId?: number;
    deliveryOfficeName?: string;
    merchantUserId?: number;
    merchantName?: string;
    phone?: string;
    vehicleType?: string;
    isActive: boolean;
    isAvailable: boolean;
    commissionPercent?: number;
    owedAmount: number;
    createdAt: string;
}

export interface DeliveryPlan {
    id: number;
    name: string;
    priceEgp: number;
    durationDays: number;
    isEnabled: boolean;
    description: string;
    createdAt: string;
}

export interface DeliveryPaymentRequest {
    id: number;
    agentUserId: number;
    agentName: string;
    agentEmail: string;
    planName: string;
    planPriceEgp: number;
    amount: number;
    proofFileUrl: string;
    payerNumber: string;
    status: string;
    adminNotes?: string;
    createdAt: string;
    reviewedAt?: string;
}

export const deliveryAgentsApi = {
    getAgents: async (officeId?: number) => {
        const url = officeId ? `admin/delivery/agents?officeId=${officeId}` : 'admin/delivery/agents';
        const response = await apiClient.get<DeliveryAgent[]>(url);
        return response.data;
    },
    getPlans: async () => {
        const response = await apiClient.get<DeliveryPlan[]>('admin/delivery/plans');
        return response.data;
    },
    createPlan: async (data: Omit<DeliveryPlan, 'id' | 'isEnabled' | 'createdAt'>) => {
        const response = await apiClient.post<DeliveryPlan>('admin/delivery/plans', data);
        return response.data;
    },
    updatePlan: async (id: number, data: Partial<Omit<DeliveryPlan, 'id' | 'createdAt'>>) => {
        const response = await apiClient.put<DeliveryPlan>(`admin/delivery/plans/${id}`, data);
        return response.data;
    },
    togglePlan: async (id: number) => {
        const response = await apiClient.post<{ message: string; isEnabled: boolean }>(`admin/delivery/plans/${id}/toggle`);
        return response.data;
    },
    deletePlan: async (id: number) => {
        const response = await apiClient.delete<{ message: string }>(`admin/delivery/plans/${id}`);
        return response.data;
    },
    getPaymentRequests: async (status?: string) => {
        const url = status ? `admin/delivery/payment-requests?status=${status}` : 'admin/delivery/payment-requests';
        const response = await apiClient.get<DeliveryPaymentRequest[]>(url);
        return response.data;
    },
    approvePaymentRequest: async (id: number) => {
        const response = await apiClient.post<{ message: string }>(`admin/delivery/payment-requests/${id}/approve`);
        return response.data;
    },
    rejectPaymentRequest: async (id: number, reason: string) => {
        const response = await apiClient.post<{ message: string }>(`admin/delivery/payment-requests/${id}/reject`, { reason });
        return response.data;
    }
};
