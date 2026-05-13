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
            Alert.alert('Error', error.response?.data || 'Failed to create category');
        }
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, name }: { id: number; name: string }) => categoriesApi.update(id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['my-products'] }); // Because product lists might show category name
        },
        onError: (error: any) => {
            Alert.alert('Error', error.response?.data || 'Failed to update category');
        }
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: categoriesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['my-products'] });
        },
        onError: (error: any) => {
            console.error('Category deletion error:', error);
            const serverMessage = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : null);

            const title = 'Cannot Delete';
            const message = error.response?.status === 409
                ? 'You can’t delete this category because it contains products. Move or delete products first.'
                : (serverMessage || 'Failed to delete category');

            console.log('Displaying alert:', { title, message });

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
            console.log('Initiating category deletion for ID:', id);
            deleteCategoryMutation.mutate(id);
        },
        isCreating: createCategoryMutation.isPending,
        isUpdating: updateCategoryMutation.isPending,
        isDeleting: deleteCategoryMutation.isPending,
    };
}
