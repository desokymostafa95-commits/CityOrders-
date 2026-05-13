import { useQuery } from '@tanstack/react-query';
import http from '../api/http';
import { ENDPOINTS } from '../api/endpoints';
import { Category, Brand, Product, Offer, DeliveryQuote } from '../types';

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await http.get<{ items: Category[] }>(ENDPOINTS.CATALOG.CATEGORIES);
            return data.items;
        },
    });
};

export const useBrands = (categorySlug?: string) => {
    return useQuery({
        queryKey: ['brands', categorySlug],
        queryFn: async () => {
            const { data } = await http.get<{ items: Brand[] }>(ENDPOINTS.CATALOG.BRANDS, {
                params: { category: categorySlug },
            });
            return data.items;
        },
    });
};

export const useBrandDetails = (brandId: number) => {
    return useQuery({
        queryKey: ['brand', brandId],
        queryFn: async () => {
            const { data } = await http.get<Brand>(ENDPOINTS.CATALOG.BRAND_DETAILS(brandId));
            return data;
        },
        enabled: !!brandId,
    });
};

export const useBrandProducts = (brandId: number) => {
    return useQuery({
        queryKey: ['brand-products', brandId],
        queryFn: async () => {
            const { data } = await http.get<Product[]>(ENDPOINTS.CATALOG.BRAND_PRODUCTS(brandId));
            return data;
        },
        enabled: !!brandId,
    });
};

export const useOffers = () => {
    return useQuery({
        queryKey: ['offers'],
        queryFn: async () => {
            const { data } = await http.get<{ items: Offer[] }>(ENDPOINTS.CATALOG.OFFERS);
            return data.items;
        },
    });
};

export const useDeliveryQuote = (brandId: number, addressId?: number) => {
    return useQuery({
        queryKey: ['delivery-quote', brandId, addressId],
        queryFn: async () => {
            const { data } = await http.get<DeliveryQuote>(ENDPOINTS.CATALOG.DELIVERY_QUOTE(brandId), {
                params: { addressId },
            });
            return data;
        },
        enabled: !!brandId && !!addressId,
    });
};
