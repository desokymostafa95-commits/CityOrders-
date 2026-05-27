export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/Auth/login',
        REGISTER: '/Auth/register/customer',
    },
    CATALOG: {
        SECTORS: '/Catalog/sectors',
        CATEGORIES: '/Catalog/categories',
        BRANDS: '/Catalog/brands',
        BRAND_DETAILS: (id: number) => `/Catalog/brands/${id}`,
        BRAND_REVIEWS: (id: number) => `/Catalog/brands/${id}/reviews`,
        BRAND_PRODUCTS: (id: number) => `/Catalog/brands/${id}/products`,
        DELIVERY_QUOTE: (brandId: number) => `/Catalog/brands/${brandId}/delivery-quote`,
        OFFERS: '/Catalog/offers',
    },
    ORDERS: {
        BASE: '/Order',
        DETAILS: (id: number) => `/Order/${id}`,
        CANCEL: (id: number) => `/Order/${id}/cancel`,
        REVIEW: (id: number) => `/Order/${id}/review`,
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
    ANALYTICS: {
        EVENTS: '/Analytics/events',
    },
    NOTIFICATIONS: {
        BASE: '/Notifications',
        READ: (id: number) => `/Notifications/${id}/read`,
        READ_ALL: '/Notifications/read-all',
    },
    CHAT: {
        THREADS: '/Chat/threads',
        THREAD_DETAILS: (id: number) => `/Chat/threads/${id}`,
        SEND: (id: number) => `/Chat/threads/${id}/messages`,
        CUSTOMER_ORDER_THREAD: (orderId: number) => `/Chat/customer/orders/${orderId}/thread`,
        BLOCK: (id: number) => `/Chat/threads/${id}/block`,
        UNBLOCK: (id: number) => `/Chat/threads/${id}/unblock`,
    },
};
