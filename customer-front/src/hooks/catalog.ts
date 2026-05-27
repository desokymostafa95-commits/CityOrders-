import { useQuery } from '@tanstack/react-query';
import http from '../api/http';
import { ENDPOINTS } from '../api/endpoints';
import { Category, Brand, Product, Offer, DeliveryQuote, BrandReview, MarketSector } from '../types';

export const useMarketSectors = () => {
    return useQuery({
        queryKey: ['market-sectors'],
        queryFn: async () => {
            const { data } = await http.get<{ items: MarketSector[] }>(ENDPOINTS.CATALOG.SECTORS);
            return data.items;
        },
    });
};

export const useCategories = (sectorSlug?: string) => {
    return useQuery({
        queryKey: ['categories', sectorSlug],
        queryFn: async () => {
            const { data } = await http.get<{ items: Category[] }>(ENDPOINTS.CATALOG.CATEGORIES, {
                params: { sector: sectorSlug || undefined },
            });
            return data.items;
        },
    });
};

export const useBrands = (
    categorySlug?: string,
    options?: { search?: string; sort?: string; lat?: number; lng?: number; sector?: string }
) => {
    return useQuery({
        queryKey: ['brands', categorySlug, options],
        queryFn: async () => {
            const { data } = await http.get<{ items: Brand[] }>(ENDPOINTS.CATALOG.BRANDS, {
                params: {
                    category: categorySlug,
                    search: options?.search || undefined,
                    sort: options?.sort || undefined,
                    sector: options?.sector || undefined,
                    lat: options?.lat,
                    lng: options?.lng,
                },
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

export const useBrandReviews = (brandId: number) => {
    return useQuery({
        queryKey: ['brand-reviews', brandId],
        queryFn: async () => {
            const { data } = await http.get<BrandReview[]>(ENDPOINTS.CATALOG.BRAND_REVIEWS(brandId));
            return data;
        },
        enabled: !!brandId,
    });
};

export const useBrandProducts = (brandId: number, options?: { search?: string; sort?: string }) => {
    return useQuery({
        queryKey: ['brand-products', brandId, options],
        queryFn: async () => {
            const { data } = await http.get<Product[]>(ENDPOINTS.CATALOG.BRAND_PRODUCTS(brandId), {
                params: {
                    search: options?.search || undefined,
                    sort: options?.sort || undefined,
                },
            });
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
