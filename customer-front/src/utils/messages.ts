import i18n from '../i18n';

const isArabic = () => i18n.locale?.toLowerCase().startsWith('ar');

const statusLabelsEn: Record<string, string> = {
    Pending: 'Pending',
    Accepted: 'Accepted',
    Preparing: 'Preparing',
    OutForDelivery: 'Out for delivery',
    Delivered: 'Delivered',
    Cancelled: 'Cancelled',
};

const statusLabelsAr: Record<string, string> = {
    Pending: 'قيد الانتظار',
    Accepted: 'تم القبول',
    Preparing: 'جاري التجهيز',
    OutForDelivery: 'في الطريق',
    Delivered: 'تم التسليم',
    Cancelled: 'ملغي',
};

const backendMessagesAr: Record<string, string> = {
    'Email already exists.': 'البريد الإلكتروني مستخدم بالفعل.',
    'Invalid email or password.': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'Account is inactive.': 'الحساب غير مفعل.',
    'Order must have items.': 'لا يمكن إنشاء طلب بدون منتجات.',
    'Invalid delivery address.': 'عنوان التوصيل غير صحيح.',
    'Brand not valid or inactive.': 'المتجر غير متاح حاليا.',
    'Brand is not currently accepting orders.': 'المتجر لا يستقبل طلبات حاليا.',
    'Merchant is currently unavailable. Please try again later.': 'التاجر غير متاح حاليا، حاول لاحقا.',
    'Some products are invalid, inactive, or do not belong to this brand.': 'بعض المنتجات غير متاحة حاليا.',
    'Only pending orders can be cancelled.': 'يمكن إلغاء الطلب فقط قبل قبول التاجر له.',
};

const backendMessagesEn: Record<string, string> = {
    'Email already exists.': 'This email is already in use.',
    'Invalid email or password.': 'Invalid email or password.',
    'Account is inactive.': 'This account is inactive.',
    'Order must have items.': 'You cannot place an order without products.',
    'Invalid delivery address.': 'The delivery address is invalid.',
    'Brand not valid or inactive.': 'This store is not available right now.',
    'Brand is not currently accepting orders.': 'This store is not accepting orders right now.',
    'Merchant is currently unavailable. Please try again later.': 'The merchant is unavailable right now. Please try later.',
    'Some products are invalid, inactive, or do not belong to this brand.': 'Some products are no longer available.',
    'Only pending orders can be cancelled.': 'Orders can only be cancelled before the merchant accepts them.',
};

export function translateStatus(status?: string) {
    if (!status) return isArabic() ? 'غير معروف' : 'Unknown';

    const key = status.replace(/\s/g, '');
    const labels = isArabic() ? statusLabelsAr : statusLabelsEn;
    return labels[status] ?? labels[key] ?? status;
}

export function friendlyError(
    error: any,
    fallback = isArabic()
        ? 'حدث خطأ غير متوقع. حاول مرة أخرى.'
        : 'Something went wrong. Please try again.'
) {
    const data = error?.response?.data;
    const messages = isArabic() ? backendMessagesAr : backendMessagesEn;

    if (!error?.response) {
        return isArabic()
            ? 'تعذر الاتصال بالخادم. تأكد أن الباك يعمل وأن الإنترنت متاح.'
            : 'Could not connect to the server. Make sure the API is running and your connection is available.';
    }

    if (typeof data === 'string') {
        return messages[data] ?? data;
    }

    if (data?.errors) {
        return Object.values(data.errors).flat().join(isArabic() ? '، ' : ', ') || fallback;
    }

    if (data?.detail) {
        return messages[data.detail] ?? data.detail;
    }

    if (data?.message) {
        return messages[data.message] ?? data.message;
    }

    if (error.response?.status === 401) {
        return isArabic()
            ? 'انتهت الجلسة أو بيانات الدخول غير صحيحة.'
            : 'Your session expired or the login details are invalid.';
    }

    if (error.response?.status >= 500) {
        return isArabic()
            ? 'الخادم واجه مشكلة. حاول مرة أخرى بعد قليل.'
            : 'The server hit a problem. Please try again shortly.';
    }

    return fallback;
}
