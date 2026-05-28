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

export interface DeliveryPaymentRequest {
    id: number;
    agentUserId: number;
    agentName: string;
    agentEmail: string;
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
