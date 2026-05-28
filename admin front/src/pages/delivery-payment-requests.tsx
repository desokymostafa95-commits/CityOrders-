import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { deliveryAgentsApi, DeliveryPaymentRequest } from '@/api/deliveryAgentsApi';
import { toast } from 'sonner';
import { Eye, CheckCircle, XCircle, FileText, Wallet, Calendar, CheckSquare, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export const DeliveryPaymentRequestsPage: React.FC = () => {
    const { language } = useTranslation();
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
    const [selectedRequest, setSelectedRequest] = useState<DeliveryPaymentRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Fetch requests
    const { data: requests, isLoading } = useQuery({
        queryKey: ['delivery-payment-requests', statusFilter],
        queryFn: () => deliveryAgentsApi.getPaymentRequests(statusFilter)
    });

    // Fetch stats (using all requests to calculate dashboard totals)
    const { data: allRequests } = useQuery({
        queryKey: ['delivery-payment-requests-all'],
        queryFn: () => deliveryAgentsApi.getPaymentRequests()
    });

    const approveMutation = useMutation({
        mutationFn: (id: number) => deliveryAgentsApi.approvePaymentRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delivery-payment-requests'] });
            queryClient.invalidateQueries({ queryKey: ['delivery-payment-requests-all'] });
            queryClient.invalidateQueries({ queryKey: ['delivery-agents-list'] });
            toast.success(language === 'ar' ? 'تمت الموافقة على طلب الدفع وتسوية المديونيات بنجاح' : 'Payment request approved and cash settled successfully');
            setSelectedRequest(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data || (language === 'ar' ? 'حدث خطأ ما' : 'An error occurred'));
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) => 
            deliveryAgentsApi.rejectPaymentRequest(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delivery-payment-requests'] });
            queryClient.invalidateQueries({ queryKey: ['delivery-payment-requests-all'] });
            toast.success(language === 'ar' ? 'تم رفض طلب الدفع بنجاح' : 'Payment request rejected');
            setSelectedRequest(null);
            setRejectReason('');
        },
        onError: (err: any) => {
            toast.error(err.response?.data || (language === 'ar' ? 'حدث خطأ ما' : 'An error occurred'));
        }
    });

    const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

    // Compute stats
    const pendingCount = allRequests?.filter(r => r.status === 'Pending').length || 0;
    const approvedTotal = allRequests?.filter(r => r.status === 'Approved').reduce((sum, r) => sum + r.amount, 0) || 0;
    const rejectedCount = allRequests?.filter(r => r.status === 'Rejected').length || 0;

    if (isLoading) return <div className="p-8 text-center text-slate-500">{t('جاري التحميل...', 'Loading payment requests...')}</div>;

    return (
        <div className="space-y-8 animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-3xl font-bold">{t('طلبات دفع الطيارين', 'Delivery Payment Requests')}</h1>
                <p className="text-slate-500 mt-1">
                    {t('مراجعة طلبات الدفع وإثباتات التحويل المرسلة من الطيارين لتسوية مديونيات الكاش.', 'Review payments and screenshots uploaded by pilots to settle their outstanding cash balances.')}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase">{t('طلبات معلقة للمراجعة', 'Pending Requests')}</p>
                        <h4 className="text-2xl font-bold text-slate-900 mt-1">{pendingCount}</h4>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <CheckSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase">{t('إجمالي المبالغ المحصلة المعتمدة', 'Total Settled Amount')}</p>
                        <h4 className="text-2xl font-bold text-emerald-600 mt-1">{approvedTotal.toLocaleString()} {t('ج.م', 'EGP')}</h4>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase">{t('طلبات مرفوضة', 'Rejected Requests')}</p>
                        <h4 className="text-2xl font-bold text-rose-600 mt-1">{rejectedCount}</h4>
                    </div>
                </div>
            </div>

            {/* Status Tab Filters */}
            <div className="flex border-b border-slate-200">
                {(['Pending', 'Approved', 'Rejected'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setStatusFilter(tab)}
                        className={cn(
                            "px-6 py-3 font-semibold text-sm transition-all border-b-2 -mb-[2px]",
                            statusFilter === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        )}
                    >
                        {tab === 'Pending' && t(`معلقة (${pendingCount})`, `Pending (${pendingCount})`)}
                        {tab === 'Approved' && t('مقبولة', 'Approved')}
                        {tab === 'Rejected' && t('مرفوضة', 'Rejected')}
                    </button>
                ))}
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-start">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('الطيار', 'Pilot')}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('المبلغ المدفوع', 'Amount Paid')}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('رقم المحول', 'Payer Number')}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('التاريخ', 'Date')}</th>
                            {statusFilter !== 'Pending' && (
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('ملاحظات الإدارة', 'Admin Notes')}</th>
                            )}
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('المراجعة', 'Review')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {requests?.map((req: DeliveryPaymentRequest) => (
                            <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-start">
                                    <div className="font-bold text-slate-900">{req.agentName}</div>
                                    <div className="text-xs text-slate-500">{req.agentEmail}</div>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-start">
                                    {req.amount} {t('ج.م', 'EGP')}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-start font-mono">{req.payerNumber}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-start">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{new Date(req.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                                    </div>
                                </td>
                                {statusFilter !== 'Pending' && (
                                    <td className="px-6 py-4 text-sm text-slate-500 text-start max-w-xs truncate" title={req.adminNotes}>
                                        {req.adminNotes || t('-', 'No notes')}
                                    </td>
                                )}
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => setSelectedRequest(req)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        {statusFilter === 'Pending' ? t('مراجعة الطلب', 'Review Request') : t('عرض التفاصيل', 'View Details')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {requests?.length === 0 && (
                            <tr>
                                <td colSpan={statusFilter === 'Pending' ? 5 : 6} className="px-6 py-12 text-center text-slate-500 italic">
                                    {t('لا توجد طلبات سداد حالياً', 'No payment requests found.')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Request Review Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh] border border-slate-100 animate-scale-up">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">{t('مراجعة إثبات سداد الطيار', 'Review Pilot Payment Proof')}</h2>
                            <button onClick={() => { setSelectedRequest(null); setRejectReason(''); }} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('الطيار', 'Pilot')}</label>
                                    <p className="font-bold text-slate-800">{selectedRequest.agentName}</p>
                                    <p className="text-xs text-slate-500">{selectedRequest.agentEmail}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('المبلغ المحول للتسوية', 'Amount Transferred')}</label>
                                    <p className="text-lg font-extrabold text-emerald-600">{selectedRequest.amount} {t('ج.م', 'EGP')}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('رقم محفظة المحول', 'Payer Number')}</label>
                                    <p className="font-mono font-bold text-slate-800">{selectedRequest.payerNumber}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('تاريخ الإرسال', 'Submitted Date')}</label>
                                    <p className="text-sm text-slate-600">{new Date(selectedRequest.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('إيصال التحويل المرفق', 'Payment Receipt / Proof')}</label>
                                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center p-2">
                                    <img
                                        src={selectedRequest.proofFileUrl ? `${import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace(/\/$/, '')}/${selectedRequest.proofFileUrl.replace(/^\//, '')}` : '/placeholder-image.png'}
                                        alt="Proof"
                                        className="max-h-64 object-contain rounded cursor-zoom-in hover:opacity-90 transition-opacity"
                                        onClick={() => {
                                            if (selectedRequest.proofFileUrl) {
                                                const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace(/\/$/, '');
                                                const url = `${baseUrl}/${selectedRequest.proofFileUrl.replace(/^\//, '')}`;
                                                window.open(url, '_blank');
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {selectedRequest.status === 'Pending' ? (
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('ملاحظات الرفض (مطلوب فقط في حالة الرفض)', 'Rejection Reason (Required only for Reject)')}</label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder={t('اكتب سبب الرفض هنا لكي يظهر للطيار...', 'Enter why this proof is invalid so the pilot can rectify...')}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-slate-800 text-sm h-20"
                                    />
                                </div>

                                <div className={cn("flex justify-end gap-3", language === 'ar' ? "flex-row-reverse" : "")}>
                                    <button
                                        onClick={() => {
                                            if (!rejectReason.trim()) {
                                                toast.error(t('يرجى كتابة سبب الرفض أولاً', 'Please provide a rejection reason'));
                                                return;
                                            }
                                            rejectMutation.mutate({ id: selectedRequest.id, reason: rejectReason });
                                        }}
                                        disabled={rejectMutation.isPending || approveMutation.isPending}
                                        className="px-5 py-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {t('رفض الإيصال', 'Reject Receipt')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(t('هل تريد الموافقة على هذا الإيصال؟ سيؤدي ذلك لتصفية وتخفيض مديونية هذا الطيار بقيمة المبلغ المذكور.', 'Are you sure you want to approve this receipt? This will settle and subtract from the pilot\'s dues by the approved amount.'))) {
                                                approveMutation.mutate(selectedRequest.id);
                                            }
                                        }}
                                        disabled={approveMutation.isPending || rejectMutation.isPending}
                                        className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-all shadow-sm disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        {t('اعتماد وتصفية الحساب', 'Approve & Settle')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500">{t('حالة الطلب الحالية:', 'Current Status:')}</span>
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                                        selectedRequest.status === 'Approved' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                    )}>
                                        {selectedRequest.status === 'Approved' ? t('مقبول ومعتمد', 'Approved & Settled') : t('مرفوض', 'Rejected')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                                >
                                    {t('إغلاق', 'Close')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
