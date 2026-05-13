import apiClient from './client';
import {
    CurrentShiftDto,
    StartShiftResponseDto,
    CloseShiftResponseDto,
    InvoiceSummaryDto,
    InvoiceDetailDto,
    InvoicesListResponse,
} from '../types';

export interface InvoiceListParams {
    preset?: 'last24h' | 'last7d' | 'last30d' | 'last90d';
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
}

export const invoicesApi = {
    /**
     * Get current open shift (if any)
     */
    getCurrentShift: async (): Promise<CurrentShiftDto> => {
        try {
            const response = await apiClient.get<CurrentShiftDto>('/merchant/invoices/shift/current');
            return response.data;
        } catch (error: any) {
            // If endpoint doesn't exist yet, return no open shift
            if (error.response?.status === 404) {
                return { shiftId: null, status: 'NoOpenShift' };
            }
            throw error;
        }
    },

    /**
     * Start a new shift
     */
    startShift: async (): Promise<StartShiftResponseDto> => {
        const response = await apiClient.post<StartShiftResponseDto>('/merchant/invoices/shift/start');
        return response.data;
    },

    /**
     * Close current shift and generate invoice
     */
    closeShift: async (): Promise<CloseShiftResponseDto> => {
        const response = await apiClient.post<CloseShiftResponseDto>('/merchant/invoices/shift/close');
        return response.data;
    },

    /**
     * List invoices with optional filters
     */
    getInvoices: async (params: InvoiceListParams = {}): Promise<InvoicesListResponse> => {
        const queryParams = new URLSearchParams();

        if (params.preset) {
            queryParams.append('preset', params.preset);
        }
        if (params.from) {
            queryParams.append('from', params.from);
        }
        if (params.to) {
            queryParams.append('to', params.to);
        }
        if (params.page) {
            queryParams.append('page', params.page.toString());
        }
        if (params.pageSize) {
            queryParams.append('pageSize', params.pageSize.toString());
        }

        const queryString = queryParams.toString();
        const url = queryString ? `/merchant/invoices?${queryString}` : '/merchant/invoices';

        const response = await apiClient.get<InvoicesListResponse>(url);
        return response.data;
    },

    /**
     * Get invoice details by ID
     */
    getInvoiceById: async (invoiceId: number): Promise<InvoiceDetailDto> => {
        const response = await apiClient.get<InvoiceDetailDto>(`/merchant/invoices/${invoiceId}`);
        return response.data;
    },

    /**
     * Download invoice PDF as blob
     */
    downloadInvoicePdf: async (invoiceId: number): Promise<Blob> => {
        const response = await apiClient.get(`/merchant/invoices/${invoiceId}/pdf`, {
            responseType: 'blob',
        });
        return response.data;
    },

    /**
     * Get PDF download URL (for direct fetch with auth header)
     */
    getInvoicePdfUrl: (invoiceId: number): string => {
        const baseUrl = apiClient.defaults.baseURL || '';
        return `${baseUrl}/merchant/invoices/${invoiceId}/pdf`;
    },
};
