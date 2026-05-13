export interface BrandDto {
    id: number;
    name: string;
    address?: string;
    phone1?: string;
    isActive: boolean;
    masterCategoryIds?: number[];
    fixedDeliveryFee: number;
    minVariableDeliveryFee: number;
    maxVariableDeliveryFee: number;
    deliveryFeeType: 'Fixed' | 'Variable';
    logoUrl?: string;
}

export interface CategoryDto {
    id: number;
    name: string;
    productsCount: number;
}

export interface ProductDto {
    id: number;
    name: string;
    description?: string;
    price: number;
    isActive: boolean;
    primaryImageUrl?: string;
    categoryId?: number;
    categoryName?: string;
    unitType: string;
    quantityStep: number;
    allowFractionalQuantity: boolean;
}

export interface CreateProductDto {
    name: string;
    description?: string;
    price: number;
    photoUrl?: string;
    categoryId?: number;
    unitType?: string;
    quantityStep?: number;
    allowFractionalQuantity?: boolean;
}

export interface UpdateProductDto {
    name: string;
    description?: string;
    price: number;
    isActive?: boolean;
    categoryId?: number;
    unitType?: string;
    quantityStep?: number;
    allowFractionalQuantity?: boolean;
    photoUrl?: string;
}

export interface ApplyMerchantLoggedInDto {
    brandName: string;
    brandAddress?: string;
    brandPhone?: string;
    masterCategoryIds: number[];
    fixedDeliveryFee: number;
    minVariableDeliveryFee: number;
    maxVariableDeliveryFee: number;
    deliveryFeeType: 'Fixed' | 'Variable';
}

export interface OrderListItem {
    id: number;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    itemCount: number;
}

export interface PaginatedResult<T> {
    page: number;
    pageSize: number;
    total: number;
    items: T[];
}

export interface SubscriptionPlanPublicDto {
    id: number;
    name: string;
    priceEgp: number;
    durationDays: number;
    graceDays: number;
    maxConcurrentOffers: number;
}

export interface MerchantSubscriptionStatusDto {
    hasSubscription: boolean;
    state: 'Active' | 'Grace' | 'Expired' | 'None';
    planName?: string;
    startDate?: string;
    endDate?: string;
    graceEndDate?: string;
    daysRemaining?: number;
    hasPendingPayment: boolean;
    isTrial?: boolean;
    trialAvailable?: boolean;
    trialActivated?: boolean;
    isFreeTrialEnabled?: boolean;
    freeTrialDays?: number;
    isActive: boolean;
    isApproved: boolean;
    updatedAt?: string;
    rejectionReason?: string;
    maxConcurrentOffers: number;
    graceDays: number;
}


export interface PaymentRequestHistoryDto {
    id: number;
    planName: string;
    planPriceEgp: number;
    status: string;
    adminNotes?: string;
    createdAt: string;
    reviewedAt?: string;
}

export interface LoginResponse {
    token: string;
    email: string;
    name: string;
    roles: string[];
}

// Invoice / Shift types
export interface CurrentShiftDto {
    shiftId: number | null;
    startAt?: string;
    status: 'Open' | 'NoOpenShift';
    liveStats?: {
        deliveredOrdersCount: number;
        estimatedGrossSales: number;
    };
}

export interface StartShiftResponseDto {
    shiftId: number;
    startAt: string;
    status: string;
}

export interface CloseShiftResponseDto {
    invoiceId: number;
    invoiceNumber: string;
    startAt: string;
    endAt: string;
    deliveredOrdersCount: number;
    grossSales: number;
    currency: string;
    closedAt: string;
}

export interface InvoiceSummaryDto {
    invoiceId: number;
    invoiceNumber: string;
    startAt: string;
    endAt: string;
    closedAt: string;
    deliveredOrdersCount: number;
    grossSales: number;
    currency: string;
}

export interface InvoiceBrandSnapshotDto {
    name: string;
    address?: string;
    phone?: string;
}

export interface InvoiceLineDto {
    productId?: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
}

export interface InvoiceOrderDto {
    orderId: number;
    orderNumber: string;
    orderTotal: number;
    deliveredAt: string;
}

export interface InvoiceDetailDto extends InvoiceSummaryDto {
    status: string;
    brand: InvoiceBrandSnapshotDto;
    lines: InvoiceLineDto[];
    orders: InvoiceOrderDto[];
}

export interface InvoicesListResponse {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    items: InvoiceSummaryDto[];
}

export type InvoicePreset = 'last24h' | 'last7d' | 'last30d' | 'last90d' | 'custom';


export interface MerchantProfileDto {
    userId: number;
    isApproved: boolean;
    isActive: boolean;
    hasBrand: boolean;
    brandName?: string;
}

export interface SubmitPaymentRequestDto {
    PlanId: number;
    payerNumber: string;
    ProofFile: any; // Using any for File/Blob in React Native
}

export interface PaymentMethod {
    id: number;
    displayName: string;
    receiverName?: string;
    receiverNumber: string;
    instructions?: string;
    isActive: boolean;
    sortOrder: number;
}

export interface MerchantAvailabilityDto {
    isOnShift: boolean;
    isTemporarilyClosed: boolean;
    temporaryCloseReason?: string;
    temporaryCloseUntil?: string;
}

export interface TemporaryCloseDto {
    reason?: string;
    until?: string;
}


export interface MerchantStoreLocation {
    lat: number;
    lng: number;
    updatedAt?: string;
}

export interface MerchantOfferDto {
    id: number;
    productId: number;
    productName: string;
    productImageUrl?: string;
    originalPrice: number;
    offerPrice: number;
    startAt: string;
    endAt: string;
    isActive: boolean;
    status: 'Scheduled' | 'Active' | 'Expired' | 'Disabled';
}

export interface CreateOfferDto {
    productId: number;
    offerPrice: number;
    startAt: string;
    endAt: string;
}

export interface UpdateOfferDto extends CreateOfferDto {
    isActive: boolean;
}

export interface CatalogOfferDto {
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

export interface OfferLimitDto {
    maxConcurrentOffers: number;
    usedConcurrentOffers: number;
    remaining: number;
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
