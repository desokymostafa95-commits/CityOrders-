import AsyncStorage from '@react-native-async-storage/async-storage';
import http from './http';
import { ENDPOINTS } from './endpoints';

type AnalyticsEventType = 'brand_view' | 'product_view' | 'add_to_cart' | 'checkout_started' | 'search';

const VISITOR_KEY = 'cityorders-customer-visitor-id';
let sessionId: string | null = null;

async function getVisitorId() {
    const existing = await AsyncStorage.getItem(VISITOR_KEY);
    if (existing) return existing;

    const created = `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    await AsyncStorage.setItem(VISITOR_KEY, created);
    return created;
}

function getSessionId() {
    if (!sessionId) {
        sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }
    return sessionId;
}

export async function trackAnalyticsEvent(params: {
    brandId: number;
    productId?: number;
    eventType: AnalyticsEventType;
    searchTerm?: string;
    metadataJson?: string;
}) {
    try {
        await http.post(ENDPOINTS.ANALYTICS.EVENTS, {
            brandId: params.brandId,
            productId: params.productId,
            eventType: params.eventType,
            searchTerm: params.searchTerm,
            metadataJson: params.metadataJson,
            visitorId: await getVisitorId(),
            sessionId: getSessionId(),
        });
    } catch {
        // Analytics must never block shopping.
    }
}
