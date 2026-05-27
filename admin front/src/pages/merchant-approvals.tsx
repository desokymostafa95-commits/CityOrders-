import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { toast } from 'sonner';
import { X, UserCheck, RotateCcw, MapPin, Store } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

const getServerImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = apiClient.defaults.baseURL || '';
    const serverRoot = baseUrl.endsWith('/api/') ? baseUrl.slice(0, -5) : baseUrl.replace('/api/', '');
    return `${serverRoot}${path}`;
};

export const MerchantApprovalsPage: React.FC = () => {
    const { t, language } = useTranslation();
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<'pending' | 'rejected'>('pending');

    const { data: applications, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['merchant-applications', status],
        queryFn: () => apiClient.get(`Admin/merchant-applications?status=${status}`).then(res => res.data),
        refetchInterval: 10000 // Auto-refresh every 10 seconds
    });

    const approveMutation = useMutation({
        mutationFn: (userId: number) => apiClient.post(`Admin/approve-merchant/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchant-applications'] });
            toast.success(t('approvals.success.approve'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('approvals.failedApprove'));
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
            apiClient.post(`Admin/reject-merchant/${userId}`, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchant-applications'] });
            toast.success(t('approvals.success.reject'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('approvals.failedReject'));
        }
    });

    if (isLoading) return <div className="p-8 text-center text-slate-500">{t('approvals.loading')}</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">{t('approvals.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('approvals.subtitle')}</p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isLoading || isRefetching}
                    className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
                >
                    <RotateCcw className={cn("h-4 w-4", (isLoading || isRefetching) ? 'animate-spin' : '', language === 'ar' ? 'ml-2' : 'mr-2')} />
                    {t('approvals.refresh')}
                </button>
            </div>

            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setStatus('pending')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${status === 'pending' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    {t('approvals.pendingReview')}
                </button>
                <button
                    onClick={() => setStatus('rejected')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${status === 'rejected' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    {t('approvals.rejectedRequireFix')}
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-start">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-start">{t('approvals.merchantInfo')}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-start">{t('approvals.brandName')}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-start">{t('approvals.reason')}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-start">{t('approvals.date')}</th>
                            <th className={cn("px-6 py-3 text-xs font-semibold text-slate-500 uppercase", language === 'ar' ? "text-left" : "text-right")}>{t('approvals.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {applications?.map((app: any) => (
                            <tr key={app.userId} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-start">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {app.logoUrl ? (
                                                <img
                                                    src={getServerImageUrl(app.logoUrl) || ''}
                                                    alt={app.brandName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Store className="h-5 w-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900">{app.userName}</div>
                                            <div className="text-sm text-slate-500">{app.email}</div>
                                        </div>
                                    </div>
                                    {app.masterCategories && app.masterCategories.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {app.masterCategories.map((cat: string) => (
                                                <span key={cat} className="bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded border border-indigo-100">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-start">
                                    <div className="text-sm font-medium text-indigo-600">{app.brandName || 'N/A'}</div>
                                    <div className="text-[11px] text-slate-400 mt-1 font-medium">{app.brandPhone || t('approvals.noPhone')}</div>
                                    <div className="text-xs text-slate-500 mt-1">{app.brandAddress || t('approvals.noAddress')}</div>
                                    {app.lat && app.lng && (
                                        <a
                                            href={`https://www.openstreetmap.org/?mlat=${app.lat}&mlon=${app.lng}#map=17/${app.lat}/${app.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-[10px] text-primary hover:underline mt-2 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100"
                                        >
                                            <MapPin size={10} className={language === 'ar' ? 'ml-1' : 'mr-1'} /> {t('approvals.viewOnMap')}
                                        </a>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-start">
                                    <div className="max-w-xs truncate" title={app.approvalRequestReason}>
                                        {app.approvalRequestReason || t('approvals.initialApplication')}
                                    </div>
                                    {app.rejectionReason && (
                                        <div className="text-xs text-red-500 mt-1 italic">
                                            {t('approvals.lastRejection')} {app.rejectionReason}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-start">
                                    {new Date(app.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                                </td>
                                <td className={cn("px-6 py-4", language === 'ar' ? "text-left" : "text-right")}>
                                    <div className={cn("flex gap-2", language === 'ar' ? "justify-start" : "justify-end")}>
                                        <button
                                            onClick={() => {
                                                const msg = t('approvals.confirmApprove').replace('{name}', app.userName);
                                                if (confirm(msg)) {
                                                    approveMutation.mutate(app.userId);
                                                }
                                            }}
                                            disabled={approveMutation.isPending || rejectMutation.isPending}
                                            className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            <UserCheck className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} /> {t('approvals.approve')}
                                        </button>
                                        {status === 'pending' ? (
                                            <button
                                                onClick={() => {
                                                    const msg = t('approvals.confirmReject').replace('{name}', app.userName);
                                                    const reason = prompt(msg);
                                                    if (reason) {
                                                        rejectMutation.mutate({ userId: app.userId, reason });
                                                    }
                                                }}
                                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                                className="inline-flex items-center px-4 py-2 border border-red-200 text-red-600 bg-red-50 text-sm font-medium rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                                            >
                                                <X className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} /> {t('approvals.reject')}
                                            </button>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200 uppercase tracking-wide">
                                                {t('approvals.rejected')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {applications?.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                                    {status === 'pending' ? t('approvals.noPending') : t('approvals.noRejected')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
