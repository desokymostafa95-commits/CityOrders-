import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';
import { CategoryDto } from '../types';
import { Alert, Platform } from 'react-native';

export function useCategories() {
    const queryClient = useQueryClient();

    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: categoriesApi.getAll,
    });

    const createCategoryMutation = useMutation({
        mutationFn: categoriesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
        onError: (error: any) => {
            Alert.alert('خطأ', error.response?.data || 'فشل إنشاء الفئة');
        }
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, name }: { id: number; name: string }) => categoriesApi.update(id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['my-products'] });
        },
        onError: (error: any) => {
            Alert.alert('خطأ', error.response?.data || 'فشل تحديث الفئة');
        }
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: categoriesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['my-products'] });
        },
        onError: (error: any) => {
            const serverMessage = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : null);

            const title = 'لا يمكن الحذف';
            const message = error.response?.status === 409
                ? 'لا يمكن حذف هذه الفئة لأنها تحتوي على منتجات. انقل المنتجات أو احذفها أولا.'
                : (serverMessage || 'فشل حذف الفئة');

            if (Platform.OS === 'web') {
                alert(`${title}: ${message}`);
            } else {
                Alert.alert(title, message);
            }
        }
    });

    return {
        categories: categoriesQuery.data || [],
        isLoading: categoriesQuery.isLoading,
        isError: categoriesQuery.isError,
        refetch: categoriesQuery.refetch,
        createCategory: createCategoryMutation.mutateAsync,
        updateCategory: updateCategoryMutation.mutateAsync,
        deleteCategory: (id: number) => {
            deleteCategoryMutation.mutate(id);
        },
        isCreating: createCategoryMutation.isPending,
        isUpdating: updateCategoryMutation.isPending,
        isDeleting: deleteCategoryMutation.isPending,
    };
}
