import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi } from '../api/offersApi';
import { CreateOfferDto, UpdateOfferDto, OfferLimitDto } from '../types';
import { Alert } from 'react-native';
import { t } from '../i18n';

export const useMerchantOffers = () => {
    return useQuery({
        queryKey: ['merchantOffers'],
        queryFn: offersApi.getAll
    });
};

export const useCurrentOffer = () => {
    return useQuery({
        queryKey: ['currentOffer'],
        queryFn: offersApi.getCurrent
    });
};

export const useOfferLimit = () => {
    return useQuery({
        queryKey: ['merchantOfferLimit'],
        queryFn: offersApi.getLimit
    });
};

export const useCreateOffer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: offersApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchantOffers'] });
            queryClient.invalidateQueries({ queryKey: ['currentOffer'] });
            queryClient.invalidateQueries({ queryKey: ['merchantOfferLimit'] });
            Alert.alert(t('common.success'), t('common.success_msg') || 'Offer created successfully');
        },
        onError: (error: any) => {
            console.error('useCreateOffer onError:', error);
            // We'll let the component handle specific error alerts via its own onError
        }
    });
};

export const useUpdateOffer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateOfferDto }) => offersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchantOffers'] });
            queryClient.invalidateQueries({ queryKey: ['currentOffer'] });
            queryClient.invalidateQueries({ queryKey: ['merchantOfferLimit'] });
            Alert.alert(t('common.success'), t('common.success_update') || 'Offer updated successfully');
        },
        onError: (error: any) => {
            console.error('useUpdateOffer onError:', error);
            // We'll let the component handle specific error alerts
        }
    });
};

export const useDisableOffer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: offersApi.disable,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchantOffers'] });
            queryClient.invalidateQueries({ queryKey: ['currentOffer'] });
            queryClient.invalidateQueries({ queryKey: ['merchantOfferLimit'] });
            Alert.alert('Success', 'Offer disabled successfully');
        },
        onError: (error: any) => {
            Alert.alert('Error', error.response?.data?.message || 'Failed to disable offer');
        }
    });
};
