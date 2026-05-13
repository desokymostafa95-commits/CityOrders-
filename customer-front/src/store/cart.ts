import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';

interface CartItem {
    product: Product;
    quantity: number;
}

interface CartStore {
    carts: Record<number, { brandId: number; items: CartItem[] }>;
    addItem: (brandId: number, product: Product, quantity: number) => void;
    removeItem: (brandId: number, productId: number) => void;
    updateQuantity: (brandId: number, productId: number, quantity: number) => void;
    clearBrandCart: (brandId: number) => void;
    clearAll: () => void;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set) => ({
            carts: {},
            addItem: (brandId, product, quantity) =>
                set((state) => {
                    const brandCart = state.carts[brandId] || { brandId, items: [] };
                    const existingItemIndex = brandCart.items.findIndex((i) => i.product.id === product.id);

                    const newItems = [...brandCart.items];
                    if (existingItemIndex > -1) {
                        newItems[existingItemIndex].quantity += quantity;
                    } else {
                        newItems.push({ product, quantity });
                    }

                    return {
                        carts: {
                            ...state.carts,
                            [brandId]: { ...brandCart, items: newItems },
                        },
                    };
                }),
            removeItem: (brandId, productId) =>
                set((state) => {
                    const brandCart = state.carts[brandId];
                    if (!brandCart) return state;

                    const newItems = brandCart.items.filter((i) => i.product.id !== productId);
                    if (newItems.length === 0) {
                        const { [brandId]: _, ...rest } = state.carts;
                        return { carts: rest };
                    }

                    return {
                        carts: {
                            ...state.carts,
                            [brandId]: { ...brandCart, items: newItems },
                        },
                    };
                }),
            updateQuantity: (brandId, productId, quantity) =>
                set((state) => {
                    const brandCart = state.carts[brandId];
                    if (!brandCart) return state;

                    const newItems = brandCart.items.map((i) =>
                        i.product.id === productId ? { ...i, quantity } : i
                    );

                    return {
                        carts: {
                            ...state.carts,
                            [brandId]: { ...brandCart, items: newItems },
                        },
                    };
                }),
            clearBrandCart: (brandId) =>
                set((state) => {
                    const { [brandId]: _, ...rest } = state.carts;
                    return { carts: rest };
                }),
            clearAll: () => set({ carts: {} }),
        }),
        {
            name: 'cityorders-customer-cart',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
