import dayjs from 'dayjs';

export const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} EGP`;
};

export const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
};

export const formatDate = (date: string | Date) => {
    return dayjs(date).format('DD MMM YYYY, hh:mm A');
};

export const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'pending':
            return '#FFA000'; // Amber
        case 'accepted':
            return '#1976D2'; // Blue
        case 'preparing':
            return '#7B1FA2'; // Purple
        case 'outfordelivery':
            return '#F57C00'; // Orange
        case 'delivered':
            return '#388E3C'; // Green
        case 'cancelled':
            return '#D32F2F'; // Red
        default:
            return '#757575'; // Grey
    }
};
