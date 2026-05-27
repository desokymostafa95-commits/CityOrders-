import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { toast } from 'sonner';
import { Plus, Edit, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

export const SubscriptionPlansPage: React.FC = () => {
    const { t, language } = useTranslation();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    const { data: plans, isLoading } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: () => apiClient.get('Admin/subscription-plans').then(res => res.data)
    });

    const createMutation = useMutation({
        mutationFn: (newPlan: any) => apiClient.post('Admin/subscription-plans', newPlan),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            toast.success(t('plans.success.create'));
            setIsModalOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: any) => apiClient.put(`Admin/subscription-plans/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            toast.success(t('plans.success.update'));
            setIsModalOpen(false);
            setEditingPlan(null);
        }
    });

    const toggleMutation = useMutation({
        mutationFn: (id: number) => apiClient.patch(`Admin/subscription-plans/${id}/toggle`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            toast.success(t('payments.success.toggle'));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiClient.delete(`Admin/subscription-plans/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            toast.success(t('plans.success.delete'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data || t('settings.error'));
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            priceEgp: parseFloat(formData.get('priceEgp') as string),
            durationDays: parseInt(formData.get('durationDays') as string),
            graceDays: parseInt(formData.get('graceDays') as string),
            maxConcurrentOffers: parseInt(formData.get('maxConcurrentOffers') as string),
        };

        if (editingPlan) {
            updateMutation.mutate({ id: editingPlan.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">{t('plans.loading')}</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">{t('plans.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('plans.subtitle')}</p>
                </div>
                <button
                    onClick={() => { setEditingPlan(null); setIsModalOpen(true); }}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                    <Plus className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} /> {t('plans.add')}
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-start">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-start">{t('plans.name')}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-start">{t('plans.price')}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-start">{t('plans.duration')}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-start">{t('plans.graceDays')}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-start">{t('plans.maxOffers')}</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-start">{t('plans.status')}</th>
                            <th className={cn("px-6 py-3 text-xs font-semibold text-slate-500 uppercase", language === 'ar' ? "text-left" : "text-right")}>{t('plans.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {plans?.map((plan: any) => (
                            <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900 text-start">{plan.name}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-start">{plan.priceEgp}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-start">{t('plans.days').replace('{days}', plan.durationDays.toString())}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-start">{t('plans.days').replace('{days}', plan.graceDays.toString())}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-semibold text-start">{plan.maxConcurrentOffers}</td>
                                <td className="px-6 py-4 text-start">
                                    <span className={cn(
                                        "px-2 py-1 text-xs font-medium rounded-full",
                                        plan.isEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                                    )}>
                                        {plan.isEnabled ? t('plans.active') : t('plans.inactive')}
                                    </span>
                                </td>
                                <td className={cn("px-6 py-4 space-x-2", language === 'ar' ? "text-left" : "text-right")}>
                                    <button
                                        onClick={() => toggleMutation.mutate(plan.id)}
                                        className="p-1 hover:text-primary transition-colors"
                                    >
                                        {plan.isEnabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                                    </button>
                                    <button
                                        onClick={() => { setEditingPlan(plan); setIsModalOpen(true); }}
                                        className="p-1 hover:text-blue-600 transition-colors"
                                    >
                                        <Edit className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(t('plans.confirmDelete'))) {
                                                deleteMutation.mutate(plan.id);
                                            }
                                        }}
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
                        <h2 className="text-xl font-bold mb-4 text-start">{editingPlan ? t('plans.edit') : t('plans.add')}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4 text-start">
                            <div>
                                <label className="text-sm font-medium">{t('plans.form.name')}</label>
                                <input name="name" defaultValue={editingPlan?.name} required className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">{t('plans.form.price')}</label>
                                    <input type="number" step="0.01" name="priceEgp" defaultValue={editingPlan?.priceEgp} required className="w-full px-3 py-2 border rounded-md" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t('plans.form.duration')}</label>
                                    <input type="number" name="durationDays" defaultValue={editingPlan?.durationDays} required className="w-full px-3 py-2 border rounded-md" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">{t('plans.form.grace')}</label>
                                <input type="number" name="graceDays" defaultValue={editingPlan?.graceDays} required className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">{t('plans.form.max')}</label>
                                <input type="number" name="maxConcurrentOffers" defaultValue={editingPlan?.maxConcurrentOffers ?? 1} min="0" max="50" required className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div className={cn("flex justify-end gap-3 pt-4", language === 'ar' ? "flex-row-reverse" : "")}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600">{t('plans.form.cancel')}</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">{t('plans.form.save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
