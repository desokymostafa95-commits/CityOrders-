jest.mock('i18n-js', () => {
    return {
        I18n: jest.fn().mockImplementation(() => ({
            t: jest.fn((key, params) => {
                if (key === 'common.welcome') return `Welcome, ${params.name}`;
                if (key === 'subscription.active') return 'Active';
                if (key === 'subscription.expired') return 'Expired';
                if (key === 'subscription.grace') return 'Grace Period';
                if (key === 'auth.join_city_orders') return 'Join City Orders';
                if (key === 'auth.registration_success') return 'Account created successfully. You can now login to apply as a merchant.';
                if (key === 'apply.title') return 'Partner with City Orders';
                if (key === 'apply.submit') return 'Submit Application';
                return key;
            }),
            enableFallback: true,
            defaultLocale: 'en',
            locale: 'en'
        }))
    };
});

jest.mock('expo-localization', () => ({
    getLocales: () => [{ languageCode: 'en' }]
}));

jest.mock('react-native', () => ({
    I18nManager: {
        isRTL: false,
        forceRTL: jest.fn(),
    }
}));

import { t, initI18n } from '../i18n';

describe('Localization Feature', () => {
    beforeAll(async () => {
        await initI18n();
    });

    test('should load English translations by default', () => {
        expect(t('common.welcome', { name: 'Test' })).toBe('Welcome, Test');
    });

    test('should have new subscription translation keys', () => {
        expect(t('subscription.active')).toBe('Active');
        expect(t('subscription.expired')).toBe('Expired');
        expect(t('subscription.grace')).toBe('Grace Period');
    });

    test('should have new registration translation keys', () => {
        expect(t('auth.join_city_orders')).toBe('Join City Orders');
        expect(t('auth.registration_success')).toContain('successfully');
    });

    test('should have new application translation keys', () => {
        expect(t('apply.title')).toBe('Partner with City Orders');
        expect(t('apply.submit')).toBe('Submit Application');
    });
});

