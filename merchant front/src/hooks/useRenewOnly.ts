import { useSubscriptionStatus } from './useMerchantData';

/**
 * Hook to determine if the merchant is in "Renew-only" mode.
 * Renew-only mode occurs when the subscription is Expired.
 * In this mode, most business actions should be disabled.
 */
export function useRenewOnly(options?: { enabled?: boolean }) {
    const { data: sub, isLoading } = useSubscriptionStatus({ enabled: options?.enabled });

    const isExpired = sub?.state === 'Expired';
    const isDeactivated = sub?.isActive === false;

    return {
        isRenewOnly: isExpired || isDeactivated,
        isLoading,
        subscriptionState: sub?.state,
        isActive: sub?.isActive,
        isDeactivated
    };
}
