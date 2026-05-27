export interface MarketSector {
    id: number;
    name: string;
    slug: string;
    description?: string;
    iconKey?: string;
    imageUrl?: string;
    sortOrder: number;
    isActive: boolean;
    categoriesCount: number;
    brandsCount: number;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    iconKey: string;
    imageUrl?: string;
    marketSectorId: number;
    marketSectorName?: string;
    marketSectorSlug?: string;
}

export interface Brand {
    id: number;
    name: string;
    address: string;
    phone1: string;
    logoUrl?: string;
    marketSectorId: number;
    marketSectorName?: string;
    marketSectorSlug?: string;
    categoryTags: string[];
    averageRating?: number;
    reviewsCount: number;
    deliveryPricing: {
        baseFee: number;
        feePerMeter: number;
        minFee?: number;
        maxFee?: number;
        maxDistanceMeters?: number;
    };
    distanceMeters?: number;
    estimatedDeliveryFee?: number;
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
    discountAmount?: number;
    promoCode?: string;
    deliveryAddress: string;
    items: OrderItem[];
    timeline: OrderTimelineItem[];
    nextStep: string;
    canReview: boolean;
    review?: BrandReview;
}

export interface OrderTimelineItem {
    key: string;
    label: string;
    description: string;
    completed: boolean;
    at?: string;
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

export interface BrandReview {
    id: number;
    orderId: number;
    brandId: number;
    customerName: string;
    rating: number;
    comment?: string;
    createdAt: string;
}

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    relatedOrderId?: number;
    isRead: boolean;
    createdAt: string;
}

export interface NotificationResponse {
    unreadCount: number;
    items: Notification[];
}

export interface ChatThreadSummary {
    id: number;
    type: string;
    merchantUserId: number;
    merchantName: string;
    customerUserId?: number;
    customerName?: string;
    adminUserId?: number;
    adminName?: string;
    brandId?: number;
    brandName?: string;
    orderId?: number;
    orderNumber?: string;
    subject: string;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount: number;
    updatedAt: string;
    isBlockedByCustomer: boolean;
    isBlockedByMerchant: boolean;
}

export interface ChatMessage {
    id: number;
    threadId: number;
    senderUserId: number;
    senderName: string;
    body: string;
    attachmentUrl?: string;
    createdAt: string;
    isRead: boolean;
    isMine: boolean;
}

export interface ChatThreadDetail {
    thread: ChatThreadSummary;
    messages: ChatMessage[];
}
