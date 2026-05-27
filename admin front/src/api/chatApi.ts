import apiClient from './client';

export interface ChatThreadSummary {
    id: number;
    type: string;
    merchantUserId: number;
    merchantName: string;
    customerUserId?: number;
    customerName?: string;
    adminUserId?: number;
    adminName?: string;
    brandId?: number;
    brandName?: string;
    orderId?: number;
    orderNumber?: string;
    subject: string;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount: number;
    updatedAt: string;
}

export interface ChatMessage {
    id: number;
    threadId: number;
    senderUserId: number;
    senderName: string;
    body: string;
    attachmentUrl?: string;
    createdAt: string;
    isRead: boolean;
    isMine: boolean;
}

export interface ChatThreadDetail {
    thread: ChatThreadSummary;
    messages: ChatMessage[];
}

export interface ChatMerchantOption {
    userId: number;
    name: string;
    email: string;
    brandName?: string;
}

export const chatApi = {
    getThreads: async () => {
        const response = await apiClient.get<ChatThreadSummary[]>('Chat/threads', {
            params: { type: 'AdminMerchant' },
        });
        return response.data;
    },
    getThread: async (threadId: number) => {
        const response = await apiClient.get<ChatThreadDetail>(`Chat/threads/${threadId}`);
        return response.data;
    },
    sendMessage: async (threadId: number, body: string, attachmentUrl?: string) => {
        const response = await apiClient.post<ChatMessage>(`Chat/threads/${threadId}/messages`, { body, attachmentUrl });
        return response.data;
    },
    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<{ url: string }>('Chat/upload', formData, {
            headers: {
                'Content-Type': undefined,
            },
        });
        return response.data;
    },
    getMerchants: async (search?: string) => {
        const response = await apiClient.get<ChatMerchantOption[]>('Chat/admin/merchants', {
            params: { search: search || undefined },
        });
        return response.data;
    },
    getOrCreateMerchantThread: async (merchantUserId: number) => {
        const response = await apiClient.post<ChatThreadSummary>(`Chat/admin/merchants/${merchantUserId}/thread`);
        return response.data;
    },
};
