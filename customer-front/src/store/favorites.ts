import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesStore {
    brandIds: number[];
    toggleBrand: (brandId: number) => void;
    isFavorite: (brandId: number) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
    persist(
        (set, get) => ({
            brandIds: [],
            toggleBrand: (brandId) =>
                set((state) => ({
                    brandIds: state.brandIds.includes(brandId)
                        ? state.brandIds.filter((id) => id !== brandId)
                        : [...state.brandIds, brandId],
                })),
            isFavorite: (brandId) => get().brandIds.includes(brandId),
        }),
        {
            name: 'cityorders-customer-favorites',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
