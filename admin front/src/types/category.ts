export interface AdminCategory {
    id: number;
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
}

export interface CreateAdminCategoryDto {
    name: string;
    description?: string;
    image?: File;
    sortOrder?: number;
    isActive?: boolean;
}

export interface UpdateAdminCategoryDto {
    name: string;
    description?: string;
    image?: File;
    sortOrder?: number;
    isActive?: boolean;
}

export interface ReorderAdminCategoryDto {
    id: number;
    sortOrder: number;
}
