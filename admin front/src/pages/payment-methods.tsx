import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export const PaymentMethodsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<any>(null);

    const { data: methods, isLoading } = useQuery({
        queryKey: ['payment-methods'],
        queryFn: () => apiClient.get('admin/payments/methods').then(res => res.data)
    });

    const createMutation = useMutation({
        mutationFn: (newMethod: any) => apiClient.post('admin/payments/methods', newMethod),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
            toast.success('Payment method created');
            setIsModalOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: any) => apiClient.put(`admin/payments/methods/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
            toast.success('Payment method updated');
            setIsModalOpen(false);
            setEditingMethod(null);
        }
    });

    const toggleMutation = useMutation({
        mutationFn: (id: number) => apiClient.patch(`admin/payments/methods/${id}/toggle`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
            toast.success('Status toggled');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiClient.delete(`admin/payments/methods/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
            toast.success('Payment method deleted');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete payment method');
        }
    });

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this payment method?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            displayName: formData.get('displayName'),
            receiverName: formData.get('receiverName'),
            receiverNumber: formData.get('receiverNumber'),
            instructions: formData.get('instructions'),
            isActive: formData.get('isActive') === 'on',
            sortOrder: parseInt(formData.get('sortOrder') as string || '0'),
        };

        if (editingMethod) {
            updateMutation.mutate({ id: editingMethod.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Payment Methods</h1>
                    <p className="text-slate-500 mt-1">Manage methods merchants use to pay for subscriptions.</p>
                </div>
                <button
                    onClick={() => { setEditingMethod(null); setIsModalOpen(true); }}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Method
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Display Name</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Receiver</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Order</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {methods?.map((method: any) => (
                            <tr key={method.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{method.displayName}</div>
                                    <div className="text-xs text-slate-500">{method.instructions}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {method.receiverName} ({method.receiverNumber})
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2 py-1 text-xs font-medium rounded-full",
                                        method.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                                    )}>
                                        {method.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{method.sortOrder}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => toggleMutation.mutate(method.id)}
                                        className="p-1 hover:text-primary transition-colors"
                                    >
                                        {method.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                                    </button>
                                    <button
                                        onClick={() => { setEditingMethod(method); setIsModalOpen(true); }}
                                        className="p-1 hover:text-blue-600 transition-colors"
                                    >
                                        <Edit className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(method.id)}
                                        className="p-1 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">{editingMethod ? 'Edit' : 'Add'} Payment Method</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Display Name</label>
                                <input name="displayName" defaultValue={editingMethod?.displayName} required className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Receiver Name</label>
                                    <input name="receiverName" defaultValue={editingMethod?.receiverName} required className="w-full px-3 py-2 border rounded-md" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Receiver Number</label>
                                    <input name="receiverNumber" defaultValue={editingMethod?.receiverNumber} required className="w-full px-3 py-2 border rounded-md" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Instructions</label>
                                <textarea name="instructions" defaultValue={editingMethod?.instructions} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Sort Order</label>
                                    <input type="number" name="sortOrder" defaultValue={editingMethod?.sortOrder} className="w-full px-3 py-2 border rounded-md" />
                                </div>
                                <div className="flex items-center space-x-2 pt-6">
                                    <input type="checkbox" name="isActive" defaultChecked={editingMethod?.isActive ?? true} />
                                    <label className="text-sm font-medium">Is Active</label>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simple utility if cn is not imported correctly in earlier implementation
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
