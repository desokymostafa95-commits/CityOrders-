export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/Auth/login',
        REGISTER: '/Auth/register/customer',
    },
    CATALOG: {
        CATEGORIES: '/Catalog/categories',
        BRANDS: '/Catalog/brands',
        BRAND_DETAILS: (id: number) => `/Catalog/brands/${id}`,
        BRAND_PRODUCTS: (id: number) => `/Catalog/brands/${id}/products`,
        DELIVERY_QUOTE: (brandId: number) => `/Catalog/brands/${brandId}/delivery-quote`,
        OFFERS: '/Catalog/offers',
    },
    ORDERS: {
        BASE: '/Order',
        DETAILS: (id: number) => `/Order/${id}`,
        CANCEL: (id: number) => `/Order/${id}/cancel`,
    },
    CUSTOMER: {
        ME: '/Customer/me',
        ADDRESSES: '/Customer/addresses',
        ADDRESS_DETAILS: (id: number) => `/Customer/addresses/${id}`,
        SET_DEFAULT_ADDRESS: (id: number) => `/Customer/addresses/${id}/default`,
    },
    ANNOUNCEMENTS: {
        ACTIVE: '/Announcements/active',
    },
};
