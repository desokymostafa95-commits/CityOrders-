export type SubscriptionState = 'Active' | 'Grace' | 'Expired' | 'None';

export function getSubscriptionState(endDate?: string | Date, graceEndDate?: string | Date): SubscriptionState {
    if (!endDate) return 'None';

    const now = new Date();
    const end = new Date(endDate);
    const grace = graceEndDate ? new Date(graceEndDate) : end;

    if (now <= end) return 'Active';
    if (now <= grace) return 'Grace';
    return 'Expired';
}

export function isRenewOnly(state: SubscriptionState): boolean {
    return state === 'Expired' || state === 'None';
}
