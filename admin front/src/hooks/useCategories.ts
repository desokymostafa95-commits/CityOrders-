import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { AdminCategory, CreateAdminCategoryDto, ReorderAdminCategoryDto, UpdateAdminCategoryDto } from '@/types/category';
import { toast } from 'sonner';

export const useAdminCategories = (params?: { includeInactive?: boolean; search?: string; sort?: string }) => {
    return useQuery<AdminCategory[]>({
        queryKey: ['admin-categories', params],
        queryFn: () => apiClient.get('admin/categories', { params }).then(res => res.data)
    });
};

export const useCategoryIconKeys = () => {
    return useQuery<string[]>({
        queryKey: ['admin-categories-icons'],
        queryFn: () => apiClient.get('admin/categories/icon-keys').then(res => res.data),
        staleTime: Infinity
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateAdminCategoryDto) => {
            const formData = new FormData();
            formData.append('name', data.name);
            if (data.description) formData.append('description', data.description);
            if (data.image) formData.append('image', data.image);
            if (data.sortOrder !== undefined) formData.append('sortOrder', data.sortOrder.toString());
            if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());

            return apiClient.post('admin/categories', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            toast.success('Category created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create category');
        }
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateAdminCategoryDto }) => {
            const formData = new FormData();
            formData.append('name', data.name);
            if (data.description) formData.append('description', data.description);
            if (data.image) formData.append('image', data.image);
            if (data.sortOrder !== undefined) formData.append('sortOrder', data.sortOrder.toString());
            if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());

            return apiClient.put(`admin/categories/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            toast.success('Category updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update category');
        }
    });
};

export const useToggleCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiClient.patch(`admin/categories/${id}/toggle`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            toast.success('Category status updated');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to toggle category');
        }
    });
};

export const useReorderCategories = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ReorderAdminCategoryDto[]) => apiClient.put('admin/categories/reorder', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            toast.success('Categories reordered successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reorder categories');
        }
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiClient.delete(`admin/categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            toast.success('Category deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.response?.data || 'Failed to delete category');
        }
    });
};
