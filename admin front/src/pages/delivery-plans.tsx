import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryAgentsApi, DeliveryPlan } from '@/api/deliveryAgentsApi';
import { toast } from 'sonner';
import { Plus, Edit, ToggleLeft, ToggleRight, Trash2, Calendar, FileText } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

export const DeliveryPlansPage: React.FC = () => {
    const { language } = useTranslation();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<DeliveryPlan | null>(null);

    const { data: plans, isLoading } = useQuery({
        queryKey: ['delivery-plans'],
        queryFn: () => deliveryAgentsApi.getPlans()
    });

    const createMutation = useMutation({
        mutationFn: (newPlan: any) => deliveryAgentsApi.createPlan(newPlan),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delivery-plans'] });
            toast.success(language === 'ar' ? 'تم إنشاء الخطة بنجاح' : 'Plan created successfully');
            setIsModalOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data || (language === 'ar' ? 'حدث خطأ ما' : 'An error occurred'));
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => deliveryAgentsApi.updatePlan(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delivery-plans'] });
            toast.success(language === 'ar' ? 'تم تحديث الخطة بنجاح' : 'Plan updated successfully');
            setIsModalOpen(false);
            setEditingPlan(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data || (language === 'ar' ? 'حدث خطأ ما' : 'An error occurred'));
        }
    });

    const toggleMutation = useMutation({
        mutationFn: (id: number) => deliveryAgentsApi.togglePlan(id),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['delivery-plans'] });
            toast.success(res.message);
        },
        onError: (err: any) => {
            toast.error(err.response?.data || (language === 'ar' ? 'حدث خطأ ما' : 'An error occurred'));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deliveryAgentsApi.deletePlan(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delivery-plans'] });
            toast.success(language === 'ar' ? 'تم حذف الخطة بنجاح' : 'Plan deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data || (language === 'ar' ? 'فشل حذف الخطة' : 'Failed to delete plan'));
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            priceEgp: parseFloat(formData.get('priceEgp') as string),
            durationDays: parseInt(formData.get('durationDays') as string),
            description: formData.get('description') as string,
        };

        if (editingPlan) {
            updateMutation.mutate({ id: editingPlan.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

    if (isLoading) return <div className="p-8 text-center text-slate-500">{t('جاري التحميل...', 'Loading plans...')}</div>;

    return (
        <div className="space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">{t('خطط تحصيل الطيارين', 'Delivery Settlement Plans')}</h1>
                    <p className="text-slate-500 mt-1">
                        {t('إعداد وتعديل باقات سداد العهد والمديونيات للطيارين.', 'Configure weekly, monthly or custom dues settlement plans for delivery agents.')}
                    </p>
                </div>
                <button
                    onClick={() => { setEditingPlan(null); setIsModalOpen(true); }}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-all font-semibold shadow-sm"
                >
                    <Plus className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} /> {t('إضافة خطة جديدة', 'Add New Plan')}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-start">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('اسم الخطة', 'Plan Name')}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('السعر (ج.م)', 'Price (EGP)')}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('المدة', 'Duration')}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('الوصف', 'Description')}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('الحالة', 'Status')}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('الإجراءات', 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {plans?.map((plan: DeliveryPlan) => (
                            <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-900 text-start">{plan.name}</td>
                                <td className="px-6 py-4 text-sm font-semibold text-slate-700 text-start">{plan.priceEgp} {t('ج.م', 'EGP')}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-start">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span>{plan.durationDays} {t('أيام', 'Days')}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 text-start max-w-xs truncate" title={plan.description}>
                                    {plan.description || t('-', 'No description')}
                                </td>
                                <td className="px-6 py-4 text-start">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                        plan.isEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}>
                                        {plan.isEnabled ? t('نشط', 'Active') : t('معطل', 'Inactive')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleMutation.mutate(plan.id)}
                                            className="p-1 text-slate-400 hover:text-primary transition-colors"
                                            title={plan.isEnabled ? t('تعطيل', 'Disable') : t('تفعيل', 'Enable')}
                                        >
                                            {plan.isEnabled ? <ToggleRight className="h-6 w-6 text-primary" /> : <ToggleLeft className="h-6 w-6" />}
                                        </button>
                                        <button
                                            onClick={() => { setEditingPlan(plan); setIsModalOpen(true); }}
                                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                            title={t('تعديل', 'Edit')}
                                        >
                                            <Edit className="h-4.5 w-4.5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(t('هل أنت متأكد من حذف هذه الخطة؟ سيتم إزالة طلبات الدفع المرتبطة بها.', 'Are you sure you want to delete this plan? Associated payment requests will also be removed.'))) {
                                                    deleteMutation.mutate(plan.id);
                                                }
                                            }}
                                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                            title={t('حذف', 'Delete')}
                                        >
                                            <Trash2 className="h-4.5 w-4.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-100 animate-scale-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingPlan ? t('تعديل الخطة', 'Edit Plan') : t('إضافة خطة جديدة', 'Add New Plan')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('اسم الخطة', 'Plan Name')}</label>
                                <input name="name" defaultValue={editingPlan?.name} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-slate-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('السعر (ج.م)', 'Price (EGP)')}</label>
                                    <input type="number" step="0.01" name="priceEgp" defaultValue={editingPlan?.priceEgp} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-slate-800" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('المدة بالأيام', 'Duration (Days)')}</label>
                                    <input type="number" name="durationDays" defaultValue={editingPlan?.durationDays} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-slate-800" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t('الوصف', 'Description')}</label>
                                <textarea name="description" defaultValue={editingPlan?.description} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-slate-800" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                                    {t('إلغاء', 'Cancel')}
                                </button>
                                <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-sm">
                                    {t('حفظ', 'Save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
