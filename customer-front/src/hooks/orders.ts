import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import http from '../api/http';
import { ENDPOINTS } from '../api/endpoints';
import { Order, OrderDetail } from '../types';

export const useOrders = () => {
    return useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const { data } = await http.get<Order[]>(ENDPOINTS.ORDERS.BASE);
            return data;
        },
    });
};

export const useOrderDetails = (orderId: number) => {
    return useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            const { data } = await http.get<OrderDetail>(ENDPOINTS.ORDERS.DETAILS(orderId));
            return data;
        },
        enabled: !!orderId,
    });
};

export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (orderData: {
            brandId: number;
            deliveryAddressId: number;
            items: { productId: number; quantity: number }[];
            notes?: string;
        }) => {
            const { data } = await http.post(ENDPOINTS.ORDERS.BASE, orderData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
};

export const useCancelOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (orderId: number) => {
            const { data } = await http.put(ENDPOINTS.ORDERS.CANCEL(orderId));
            return data;
        },
        onSuccess: (_, orderId) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        },
    });
};
