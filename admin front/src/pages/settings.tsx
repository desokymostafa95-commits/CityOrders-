import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
    const queryClient = useQueryClient();

    const { data: settings, isLoading, error } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: () => apiClient.get('admin/settings').then(res => res.data)
    });

    const mutation = useMutation({
        mutationFn: (newSettings: any) => apiClient.put('/admin/settings', newSettings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            toast.success('Settings updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update settings');
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

    if (isLoading) return <div className="flex items-center justify-center p-12 text-slate-500 font-medium animate-pulse">Loading settings...</div>;

    if (error) return (
        <div className="max-w-2xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 mt-8">
            <h2 className="font-bold mb-2">Connection Error</h2>
            <p className="text-sm">
                {(error as any).message || 'Failed to fetch settings from the backend.'}
                {' '}Please verify that the backend API is running at <strong>http://localhost:5014</strong>.
            </p>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Global Settings</h1>
                <p className="text-slate-500 mt-1">Configure system-wide parameters for merchants.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <label className="text-base font-medium">Enable Free Trial</label>
                        <p className="text-sm text-slate-500">Allow new merchants to start a trial without payment.</p>
                    </div>
                    <input
                        type="checkbox"
                        name="isFreeTrialEnabled"
                        defaultChecked={settings?.isFreeTrialEnabled}
                        className="w-5 h-5 accent-primary"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Free Trial Days</label>
                    <input
                        type="number"
                        name="freeTrialDays"
                        defaultValue={settings?.freeTrialDays}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Trial Grace Days</label>
                    <input
                        type="number"
                        name="trialGraceDays"
                        defaultValue={settings?.trialGraceDays}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Max Concurrent Offers (Trial)</label>
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
                    {mutation.isPending ? 'Saving...' : 'Save Settings'}
                </button>
            </form>

            <div className="mt-12">
                <h2 className="text-2xl font-bold">Security</h2>
                <p className="text-slate-500 mt-1">Update your admin account password.</p>
            </div>
            
            <ChangePasswordForm />
        </div>
    );
};

const ChangePasswordForm = () => {
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');

    const mutation = useMutation({
        mutationFn: () => apiClient.post('/auth/change-password', { currentPassword, newPassword }),
        onSuccess: () => {
            toast.success('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data || 'Failed to change password');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        mutation.mutate();
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Current Password</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>
            </div>
            <button
                type="submit"
                disabled={mutation.isPending}
                className="py-2 px-4 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
                {mutation.isPending ? 'Updating...' : 'Change Password'}
            </button>
        </form>
    );
};
