import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { toast } from 'sonner';
import { useTranslation } from '@/context/LanguageContext';

export const SettingsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const { data: settings, isLoading, error } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: () => apiClient.get('admin/settings').then(res => res.data)
    });

    const mutation = useMutation({
        mutationFn: (newSettings: any) => apiClient.put('/admin/settings', newSettings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            toast.success(t('settings.settingsUpdated'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('settings.settingsUpdateFailed'));
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            isFreeTrialEnabled: formData.get('isFreeTrialEnabled') === 'on',
            freeTrialDays: parseInt(formData.get('freeTrialDays') as string),
            trialGraceDays: parseInt(formData.get('trialGraceDays') as string),
            trialMaxConcurrentOffers: parseInt(formData.get('trialMaxConcurrentOffers') as string),
        };
        mutation.mutate(data);
    };

    if (isLoading) return <div className="flex items-center justify-center p-12 text-slate-500 font-medium animate-pulse">{t('settings.loading')}</div>;

    if (error) return (
        <div className="max-w-2xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 mt-8">
            <h2 className="font-bold mb-2">{t('settings.connectionError')}</h2>
            <p className="text-sm">
                {(error as any).message || t('settings.connectionErrorDesc')}
                {' '}{t('settings.connectionErrorDesc')} <strong>http://localhost:5014</strong>.
            </p>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
                <p className="text-slate-500 mt-1">{t('settings.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <label className="text-base font-medium">{t('settings.free_trial')}</label>
                        <p className="text-sm text-slate-500">{t('settings.free_trial_desc')}</p>
                    </div>
                    <input
                        type="checkbox"
                        name="isFreeTrialEnabled"
                        defaultChecked={settings?.isFreeTrialEnabled}
                        className="w-5 h-5 accent-primary"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('settings.trial_days')}</label>
                    <input
                        type="number"
                        name="freeTrialDays"
                        defaultValue={settings?.freeTrialDays}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('settings.grace_days')}</label>
                    <input
                        type="number"
                        name="trialGraceDays"
                        defaultValue={settings?.trialGraceDays}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('settings.max_offers')}</label>
                    <input
                        type="number"
                        name="trialMaxConcurrentOffers"
                        defaultValue={settings?.trialMaxConcurrentOffers}
                        min={0}
                        max={50}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>

                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {mutation.isPending ? t('settings.saving') : t('settings.save')}
                </button>
            </form>

        </div>
    );
};
