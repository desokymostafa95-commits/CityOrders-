import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { toast } from 'sonner';
import { Eye, CheckCircle, XCircle } from 'lucide-react';

export const PaymentRequestsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState('');

    const { data: requests, isLoading } = useQuery({
        queryKey: ['payment-requests'],
        queryFn: () => apiClient.get('Admin/payment-requests?status=Pending').then(res => res.data)
    });

    const approveMutation = useMutation({
        mutationFn: (id: number) => apiClient.post(`Admin/payment-requests/${id}/approve`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
            toast.success('Payment approved');
            setSelectedRequest(null);
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: any) => apiClient.post(`Admin/payment-requests/${id}/reject`, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
            toast.success('Payment rejected');
            setSelectedRequest(null);
            setRejectReason('');
        }
    });

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Subscription Payment Requests</h1>
                <p className="text-slate-500 mt-1">Review and approve merchant payment proofs.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Merchant</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Plan</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Payer Number</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {requests?.map((req: any) => (
                            <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{req.merchantName}</div>
                                    <div className="text-xs text-slate-500">{req.merchantEmail}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {req.planName} ({req.planPriceEgp} EGP)
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{req.payerNumber}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setSelectedRequest(req)}
                                        className="flex items-center ml-auto px-3 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                                    >
                                        <Eye className="mr-2 h-4 w-4" /> Review
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {requests?.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                                    No pending payment requests.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Review Payment Request</h2>
                            <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Merchant</label>
                                    <p className="font-medium">{selectedRequest.merchantName}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Plan</label>
                                    <p className="font-medium">{selectedRequest.planName} ({selectedRequest.planPriceEgp} EGP)</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Payer Number</label>
                                    <p className="font-medium">{selectedRequest.payerNumber}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Proof of Payment</label>
                                <div className="mt-2 border rounded-md overflow-hidden bg-slate-50">
                                    <img
                                        src={selectedRequest.proofFileUrl ? `${import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace(/\/$/, '')}/${selectedRequest.proofFileUrl.replace(/^\//, '')}` : '/placeholder-image.png'}
                                        alt="Proof"
                                        className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => {
                                            if (selectedRequest.proofFileUrl) {
                                                const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace(/\/$/, '');
                                                const path = selectedRequest.proofFileUrl.replace(/^\//, '');
                                                const url = `${baseUrl}/${path}`;
                                                window.open(url, '_blank');
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-100">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Rejection Reason (Required if rejecting)</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Explain why the proof was rejected..."
                                    className="w-full px-3 py-2 border rounded-md h-24"
                                />
                            </div>

                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={() => {
                                        if (!rejectReason) {
                                            toast.error('Please provide a reason for rejection');
                                            return;
                                        }
                                        rejectMutation.mutate({ id: selectedRequest.id, reason: rejectReason });
                                    }}
                                    disabled={rejectMutation.isPending || approveMutation.isPending}
                                    className="px-6 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => approveMutation.mutate(selectedRequest.id)}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                    className="flex items-center px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" /> Approve Payment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
