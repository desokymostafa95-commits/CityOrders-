export interface Category {
    id: number;
    name: string;
    slug: string;
    iconKey: string;
    imageUrl?: string;
}

export interface Brand {
    id: number;
    name: string;
    address: string;
    phone1: string;
    logoUrl?: string;
    categoryTags: string[];
    deliveryPricing: {
        baseFee: number;
        feePerMeter: number;
        minFee: number;
        maxFee: number;
        maxDistanceMeters: number;
    };
}

export interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    primaryImageUrl?: string;
    unitType: string;
    quantityStep: number;
    allowFractionalQuantity: boolean;
}

export interface Offer {
    brandId: number;
    brandName: string;
    brandLogoUrl?: string;
    productId: number;
    productName: string;
    productImageUrl?: string;
    originalPrice: number;
    offerPrice: number;
    endAt: string;
}

export interface Address {
    id: number;
    addressLine: string;
    notes?: string;
    isDefault: boolean;
    lat?: number;
    lng?: number;
}

export interface Order {
    id: number;
    orderNumber: string;
    status: string;
    total: number;
    brandName: string;
    createdAt: string;
    quantityItems: number;
}

export interface OrderDetail extends Order {
    notes?: string;
    subtotal: number;
    deliveryFee: number;
    deliveryAddress: string;
    items: OrderItem[];
}

export interface OrderItem {
    productId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
}

export interface DeliveryQuote {
    brandId: number;
    addressId: number;
    distanceMeters: number;
    deliveryFee: number;
    isDeliverable: boolean;
    reason?: string;
}

export enum AnnouncementTarget {
    All = 0,
    Customer = 1,
    Merchant = 2
}

export interface GlobalAnnouncement {
    id: number;
    message: string;
    targetAudience: AnnouncementTarget;
    createdAt: string;
    isActive: boolean;
    expiresAt?: string;
}
