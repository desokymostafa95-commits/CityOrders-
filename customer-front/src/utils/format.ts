import dayjs from 'dayjs';
import i18n from '../i18n';

const isArabic = () => i18n.locale?.toLowerCase().startsWith('ar');

export const formatCurrency = (amount: number) => {
    const value = Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
    return isArabic() ? `${value} جنيه` : `EGP ${value}`;
};

export const formatDistance = (meters: number) => {
    if (meters < 1000) {
        return isArabic() ? `${Math.round(meters)} متر` : `${Math.round(meters)} m`;
    }

    const value = (meters / 1000).toFixed(1);
    return isArabic() ? `${value} كم` : `${value} km`;
};

export const formatDate = (date: string | Date) => {
    return dayjs(date).format('DD MMM YYYY, hh:mm A');
};

export const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'pending':
            return '#F59E0B';
        case 'accepted':
            return '#2563EB';
        case 'preparing':
            return '#7C3AED';
        case 'outfordelivery':
            return '#EA580C';
        case 'delivered':
            return '#16A34A';
        case 'cancelled':
            return '#DC2626';
        default:
            return '#64748B';
    }
};
