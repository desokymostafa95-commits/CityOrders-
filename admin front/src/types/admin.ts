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
