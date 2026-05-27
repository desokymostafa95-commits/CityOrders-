export interface AdminMarketSector {
    id: number;
    name: string;
    slug: string;
    description?: string;
    iconKey?: string;
    imageUrl?: string;
    sortOrder: number;
    isActive: boolean;
    categoriesCount: number;
    createdAt: string;
}

export interface AdminCategory {
    id: number;
    marketSectorId: number;
    marketSectorName?: string;
    marketSectorSlug?: string;
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
    marketSectorId: number;
    description?: string;
    image?: File;
    sortOrder?: number;
    isActive?: boolean;
}

export interface UpdateAdminCategoryDto {
    name: string;
    marketSectorId: number;
    description?: string;
    image?: File;
    sortOrder?: number;
    isActive?: boolean;
}

export interface ReorderAdminCategoryDto {
    id: number;
    sortOrder: number;
}

export interface CreateAdminMarketSectorDto {
    name: string;
    description?: string;
    iconKey?: string;
    image?: File;
    sortOrder?: number;
    isActive?: boolean;
}

export type UpdateAdminMarketSectorDto = CreateAdminMarketSectorDto;
