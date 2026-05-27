import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import http from '../api/http';
import { ENDPOINTS } from '../api/endpoints';
import { Address } from '../types';

type UpdateAddressPayload = Pick<Address, 'addressLine' | 'notes' | 'lat' | 'lng'>;

export const useAddresses = () => {
    return useQuery({
        queryKey: ['addresses'],
        queryFn: async () => {
            const { data } = await http.get<Address[]>(ENDPOINTS.CUSTOMER.ADDRESSES);
            return data;
        },
    });
};

export const useCreateAddress = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (addressData: Omit<Address, 'id'>) => {
            const { data } = await http.post(ENDPOINTS.CUSTOMER.ADDRESSES, addressData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
        },
    });
};

export const useUpdateAddress = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, address }: { id: number; address: UpdateAddressPayload }) => {
            await http.put(ENDPOINTS.CUSTOMER.ADDRESS_DETAILS(id), address);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
        },
    });
};

export const useDeleteAddress = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await http.delete(ENDPOINTS.CUSTOMER.ADDRESS_DETAILS(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
        },
    });
};

export const useSetDefaultAddress = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await http.put(ENDPOINTS.CUSTOMER.SET_DEFAULT_ADDRESS(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
        },
    });
};
