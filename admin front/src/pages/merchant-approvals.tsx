import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { toast } from 'sonner';
import { Check, X, UserCheck, RotateCcw, Loader2, MapPin, Store } from 'lucide-react';

const getServerImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = apiClient.defaults.baseURL || '';
    const serverRoot = baseUrl.endsWith('/api/') ? baseUrl.slice(0, -5) : baseUrl.replace('/api/', '');
    return `${serverRoot}${path}`;
};

export const MerchantApprovalsPage: React.FC = () => {
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
            toast.success('Merchant approved successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to approve merchant');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
            apiClient.post(`Admin/reject-merchant/${userId}`, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchant-applications'] });
            toast.success('Merchant application rejected');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reject merchant');
        }
    });

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Merchant Approvals</h1>
                    <p className="text-slate-500 mt-1">Review and approve new merchant registrations.</p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isLoading || isRefetching}
                    className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
                >
                    <RotateCcw className={`mr-2 h-4 w-4 ${(isLoading || isRefetching) ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setStatus('pending')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${status === 'pending' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Pending Review
                </button>
                <button
                    onClick={() => setStatus('rejected')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${status === 'rejected' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Rejected / Require Fix
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Merchant Info</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Brand Name</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Reason</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {applications?.map((app: any) => (
                            <tr key={app.userId} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
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
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-indigo-600">{app.brandName || 'N/A'}</div>
                                    <div className="text-[11px] text-slate-400 mt-1 font-medium">{app.brandPhone || 'No phone'}</div>
                                    <div className="text-xs text-slate-500 mt-1">{app.brandAddress || 'No address provided'}</div>
                                    {app.lat && app.lng && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${app.lat},${app.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-[10px] text-primary hover:underline mt-2 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100"
                                        >
                                            <MapPin size={10} className="mr-1" /> View on Maps
                                        </a>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    <div className="max-w-xs truncate" title={app.approvalRequestReason}>
                                        {app.approvalRequestReason || 'Initial application'}
                                    </div>
                                    {app.rejectionReason && (
                                        <div className="text-xs text-red-500 mt-1 italic">
                                            Last rejection: {app.rejectionReason}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {new Date(app.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                if (confirm(`Are you sure you want to approve ${app.userName}?`)) {
                                                    approveMutation.mutate(app.userId);
                                                }
                                            }}
                                            disabled={approveMutation.isPending || rejectMutation.isPending}
                                            className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            <UserCheck className="mr-2 h-4 w-4" /> Approve
                                        </button>
                                        {status === 'pending' ? (
                                            <button
                                                onClick={() => {
                                                    const reason = prompt(`What is the reason for rejecting ${app.userName}?`);
                                                    if (reason) {
                                                        rejectMutation.mutate({ userId: app.userId, reason });
                                                    }
                                                }}
                                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                                className="inline-flex items-center px-4 py-2 border border-red-200 text-red-600 bg-red-50 text-sm font-medium rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                                            >
                                                <X className="mr-2 h-4 w-4" /> Reject
                                            </button>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200 uppercase tracking-wide">
                                                Rejected
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {applications?.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                                    No {status} merchant applications.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
