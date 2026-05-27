import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { AdminCategory, AdminMarketSector, CreateAdminCategoryDto, CreateAdminMarketSectorDto, ReorderAdminCategoryDto, UpdateAdminCategoryDto, UpdateAdminMarketSectorDto } from '@/types/category';
import { toast } from 'sonner';

export const useMarketSectors = (includeInactive = true) => {
    return useQuery<AdminMarketSector[]>({
        queryKey: ['admin-market-sectors', includeInactive],
        queryFn: () => apiClient.get('admin/categories/sectors', { params: { includeInactive } }).then(res => res.data)
    });
};

export const useCreateMarketSector = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateAdminMarketSectorDto) => {
            const formData = new FormData();
            formData.append('name', data.name);
            if (data.description) formData.append('description', data.description);
            if (data.iconKey) formData.append('iconKey', data.iconKey);
            if (data.image) formData.append('image', data.image);
            if (data.sortOrder !== undefined) formData.append('sortOrder', data.sortOrder.toString());
            if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());

            return apiClient.post('admin/categories/sectors', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-market-sectors'] });
            toast.success('Sector created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.response?.data || 'Failed to create sector');
        }
    });
};

export const useUpdateMarketSector = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateAdminMarketSectorDto }) => {
            const formData = new FormData();
            formData.append('name', data.name);
            if (data.description) formData.append('description', data.description);
            if (data.iconKey) formData.append('iconKey', data.iconKey);
            if (data.image) formData.append('image', data.image);
            if (data.sortOrder !== undefined) formData.append('sortOrder', data.sortOrder.toString());
            if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());

            return apiClient.put(`admin/categories/sectors/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-market-sectors'] });
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            toast.success('Sector updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.response?.data || 'Failed to update sector');
        }
    });
};

export const useToggleMarketSector = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiClient.patch(`admin/categories/sectors/${id}/toggle`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-market-sectors'] });
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            toast.success('Sector status updated');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update sector status');
        }
    });
};

export const useAdminCategories = (params?: { includeInactive?: boolean; search?: string; sort?: string; marketSectorId?: number }) => {
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
            formData.append('marketSectorId', data.marketSectorId.toString());
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
            toast.success('تم إنشاء الفئة بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'فشل إنشاء الفئة');
        }
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateAdminCategoryDto }) => {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('marketSectorId', data.marketSectorId.toString());
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
            toast.success('تم تحديث الفئة بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'فشل تحديث الفئة');
        }
    });
};

export const useToggleCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiClient.patch(`admin/categories/${id}/toggle`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            toast.success('تم تحديث حالة الفئة');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'فشل تغيير حالة الفئة');
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
            toast.error(error.response?.data?.message || 'فشل ترتيب الفئات');
        }
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiClient.delete(`admin/categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            toast.success('تم حذف الفئة بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.response?.data || 'فشل حذف الفئة');
        }
    });
};
