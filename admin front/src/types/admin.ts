export type SubscriptionState = 'Active' | 'Grace' | 'Expired' | 'None';

export interface MerchantSubscriptionRow {
    userId: number;
    userName: string;
    email: string;
    brandName: string;
    brandPhone: string;
    brandAddress: string;
    lat?: number;
    lng?: number;
    logoUrl?: string;
    state: SubscriptionState;
    endDate: string;
    daysRemaining: number;
    graceEndDate?: string;
    isOnShift: boolean;
    shiftAutoCloseAt?: string;
    isActive: boolean;
    isApproved: boolean;
    isTemporarilyClosed: boolean;
    approvalRequestReason?: string;
    masterCategories?: string[];
    masterCategoryIds?: number[];
}

export type AuditActionType =
    | 'MerchantApproved'
    | 'MerchantRejected'
    | 'SettingsChanged'
    | 'PaymentApproved'
    | 'PaymentRejected'
    | 'PlanCreated'
    | 'PlanUpdated'
    | 'PlanToggled'
    | 'SubscriptionExtend'
    | 'ForceExpire'
    | 'PaymentMethodEdit'
    | 'ForceOpenShift'
    | 'ForceCloseShift'
    | 'OpenShiftTimed'
    | 'MerchantActivated'
    | 'MerchantDeactivated'
    | 'Approval' // Legacy support
    | 'SettingsChange'; // Legacy support

export interface AuditLogRow {
    id: number;
    timestamp: string;
    action: AuditActionType;
    target: string;
    summary: string;
    adminName: string;
    adminEmail: string;
}

export interface SubscriptionDetails extends MerchantSubscriptionRow {
    planName: string;
    startDate: string;
    isTrial: boolean;
}

export interface HealthStatus {
    ok: boolean;
    latencyMs: number;
    checkedAt: string;
    message?: string;
}

export interface DashboardRecentOrder {
    id: number;
    orderNumber: string;
    status: string;
    total: number;
    brandName: string;
    createdAt: string;
}

export interface DashboardSummary {
    totalOrders: number;
    activeOrders: number;
    lateActiveOrders: number;
    deliveredRevenue: number;
    todaysRevenue: number;
    customers: number;
    merchants: number;
    onlineMerchants: number;
    temporarilyClosedMerchants: number;
    pendingApprovals: number;
    pendingPayments: number;
    newCustomers: number;
    unreadAdminChats: number;
    openChatThreads: number;
    recentOrders: DashboardRecentOrder[];
    needsAttentionOrders: DashboardRecentOrder[];
}

export interface AdminMerchantAnalytics {
    brandId: number;
    brandName: string;
    storeViews: number;
    productViews: number;
    orders: number;
    revenue: number;
    conversionRate: number;
}

export interface AdminSearchTermAnalytics {
    term: string;
    count: number;
    hasMatchingProduct: boolean;
    lastSearchedAt: string;
}

export interface AdminSectorAnalytics {
    marketSectorId: number;
    marketSectorName: string;
    marketSectorSlug: string;
    storeViews: number;
    productViews: number;
    orders: number;
    revenue: number;
    conversionRate: number;
}

export interface AdminLiveAnalyticsEvent {
    type: string;
    label: string;
    detail?: string;
    at: string;
}

export interface AdminAnalyticsOverview {
    from: string;
    to: string;
    storeViews: number;
    productViews: number;
    addToCartEvents: number;
    checkoutStartedEvents: number;
    searches: number;
    orders: number;
    revenue: number;
    abandonedCarts: number;
    platformConversionRate: number;
    sectorBreakdown: AdminSectorAnalytics[];
    topMerchants: AdminMerchantAnalytics[];
    searchTerms: AdminSearchTermAnalytics[];
    liveFeed: AdminLiveAnalyticsEvent[];
}
