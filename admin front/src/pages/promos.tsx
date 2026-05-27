import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tag, Search, DollarSign, Percent, Calendar, Users, Activity, CheckCircle2 } from 'lucide-react';
import { adminPromoCodesApi } from '@/api/promoCodesApi';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

const statusMap: Record<string, string> = {
    'All': 'promos.status.all',
    'Active': 'promos.status.active',
    'Scheduled': 'promos.status.scheduled',
    'Expired': 'promos.status.expired',
    'Used Up': 'promos.status.usedup',
    'Disabled': 'promos.status.disabled'
};

export function PromosPage() {
    const { t, language } = useTranslation();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const { data: promos = [], isLoading } = useQuery({
        queryKey: ['admin-promos'],
        queryFn: adminPromoCodesApi.getAll
    });

    const filteredPromos = promos.filter(p => {
        const matchesSearch = p.code.toLowerCase().includes(search.toLowerCase()) || 
                              p.brandName.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800 border-green-200';
            case 'Disabled': return 'bg-slate-100 text-slate-800 border-slate-200';
            case 'Expired': return 'bg-red-100 text-red-800 border-red-200';
            case 'Scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Used Up': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('promos.title')}</h1>
                <p className="text-slate-500">{t('promos.subtitle')}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96 text-slate-500 focus-within:text-slate-900">
                    <Search className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5", language === 'ar' ? "right-3" : "left-3")} />
                    <input
                        type="text"
                        placeholder={t('promos.search')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className={cn(
                            "w-full py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-slate-900",
                            language === 'ar' ? "pl-4 pr-10" : "pl-10 pr-4"
                        )}
                    />
                </div>

                <div className="flex gap-2 text-sm font-medium flex-wrap">
                    {['All', 'Active', 'Scheduled', 'Expired', 'Used Up', 'Disabled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-md transition-colors ${
                                statusFilter === status
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {t(statusMap[status] || status)}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : filteredPromos.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                    <Tag className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-4 text-lg font-medium text-slate-900">{t('promos.noPromos')}</h3>
                    <p className="mt-1 text-slate-500">{t('promos.noPromosDesc')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPromos.map(promo => (
                        <div key={promo.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-5 w-5 text-indigo-600" />
                                        <h3 className="text-lg font-bold text-slate-900">{promo.code}</h3>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">{t('promos.by').replace('{brand}', promo.brandName)}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(promo.status)}`}>
                                    {t(statusMap[promo.status] || promo.status)}
                                </span>
                            </div>
                            
                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                        {promo.discountType === 'Percentage' ? <Percent size={18} /> : <DollarSign size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">{t('promos.discount')}</p>
                                        <p className="font-semibold text-slate-900">
                                            {promo.discountValue}{promo.discountType === 'Percentage' ? '%' : ` ${t('dashboard.currency')}`}
                                            {promo.maxDiscountAmount && <span className="text-sm text-slate-400 font-normal ml-1">{t('promos.maxDiscount').replace('{amount}', promo.maxDiscountAmount.toString())}</span>}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4 text-slate-400 shrink-0" />
                                        <div>
                                            <p className="text-slate-500">{t('promos.usages')}</p>
                                            <p className="font-medium text-slate-900">
                                                {promo.usageCount} {promo.usageLimit ? `/ ${promo.usageLimit}` : `(${t('promos.unlimited')})`}
                                            </p>
                                        </div>
                                    </div>

                                    {promo.minOrderAmount && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <DollarSign className="h-4 w-4 text-slate-400 shrink-0" />
                                            <div>
                                                <p className="text-slate-500">{t('promos.minOrder')}</p>
                                                <p className="font-medium text-slate-900">{promo.minOrderAmount} {t('dashboard.currency')}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                                    {promo.startsAt && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{t('promos.starts')} <span className="text-slate-700 font-medium">{new Date(promo.startsAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></span>
                                        </div>
                                    )}
                                    {promo.expiresAt ? (
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Activity className="h-3.5 w-3.5" />
                                            <span>{t('promos.expires')} <span className="text-slate-700 font-medium">{new Date(promo.expiresAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            <span>{t('promos.neverExpires')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PromosPage;
