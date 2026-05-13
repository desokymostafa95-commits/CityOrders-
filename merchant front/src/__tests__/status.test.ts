import { getSubscriptionState } from '../utils/status';

describe('Subscription Status Logic', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    const graceDate = new Date();
    graceDate.setDate(graceDate.getDate() + 5);

    test('should return Active if now <= endDate', () => {
        expect(getSubscriptionState(futureDate)).toBe('Active');
    });

    test('should return Grace if endDate < now <= graceEndDate', () => {
        // End date was 2 days ago, grace is 5 days from now
        expect(getSubscriptionState(pastDate, graceDate)).toBe('Grace');
    });

    test('should return Expired if now > graceEndDate', () => {
        const wayPastDate = new Date();
        wayPastDate.setDate(wayPastDate.getDate() - 10);
        const expiredGraceDate = new Date();
        expiredGraceDate.setDate(expiredGraceDate.getDate() - 5);

        expect(getSubscriptionState(wayPastDate, expiredGraceDate)).toBe('Expired');
    });

    test('should return None if no endDate provided', () => {
        expect(getSubscriptionState(undefined)).toBe('None');
    });
});
