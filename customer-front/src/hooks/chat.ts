import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import http from '../api/http';
import { ENDPOINTS } from '../api/endpoints';
import { ChatMessage, ChatThreadDetail, ChatThreadSummary } from '../types';

export const useChatThreads = () => {
    return useQuery({
        queryKey: ['chat-threads'],
        queryFn: async () => {
            const { data } = await http.get<ChatThreadSummary[]>(ENDPOINTS.CHAT.THREADS);
            return data;
        },
        refetchInterval: 8000,
    });
};

export const useChatThread = (threadId: number) => {
    return useQuery({
        queryKey: ['chat-thread', threadId],
        queryFn: async () => {
            const { data } = await http.get<ChatThreadDetail>(ENDPOINTS.CHAT.THREAD_DETAILS(threadId));
            return data;
        },
        enabled: !!threadId,
        refetchInterval: 3000,
        refetchOnWindowFocus: true,
    });
};

export const useCustomerOrderChatThread = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (orderId: number) => {
            const { data } = await http.post<ChatThreadSummary>(ENDPOINTS.CHAT.CUSTOMER_ORDER_THREAD(orderId));
            return data;
        },
        onSuccess: (thread) => {
            queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
            queryClient.invalidateQueries({ queryKey: ['chat-thread', thread.id] });
        },
    });
};

export const useSendChatMessage = (threadId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ body, attachmentUrl }: { body: string; attachmentUrl?: string }) => {
            const { data } = await http.post<ChatMessage>(ENDPOINTS.CHAT.SEND(threadId), { body, attachmentUrl });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
            queryClient.invalidateQueries({ queryKey: ['chat-thread', threadId] });
        },
    });
};

export const useBlockChatThread = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (threadId: number) => {
            const { data } = await http.post(ENDPOINTS.CHAT.BLOCK(threadId));
            return data;
        },
        onSuccess: (_, threadId) => {
            queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
            queryClient.invalidateQueries({ queryKey: ['chat-thread', threadId] });
        },
    });
};

export const useUnblockChatThread = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (threadId: number) => {
            const { data } = await http.post(ENDPOINTS.CHAT.UNBLOCK(threadId));
            return data;
        },
        onSuccess: (_, threadId) => {
            queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
            queryClient.invalidateQueries({ queryKey: ['chat-thread', threadId] });
        },
    });
};
