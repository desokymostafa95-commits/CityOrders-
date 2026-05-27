import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import apiClient from '@/api/client';
import { toast } from 'sonner';
import { useTranslation } from '@/context/LanguageContext';

type PasswordFieldProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    autoComplete: string;
    minLength?: number;
};

const PasswordField: React.FC<PasswordFieldProps> = ({ label, value, onChange, autoComplete, minLength }) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const inputId = React.useId();

    return (
        <div className="space-y-2">
            <label htmlFor={inputId} className="text-sm font-medium text-slate-800">
                {label}
            </label>
            <div className="relative">
                <input
                    id={inputId}
                    type={isVisible ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete={autoComplete}
                    required
                    minLength={minLength}
                    className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-11 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                    type="button"
                    onClick={() => setIsVisible((current) => !current)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-slate-500 transition-colors hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    aria-label="Toggle password visibility"
                >
                    {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
};

export const SecurityPage: React.FC = () => {
    const { t } = useTranslation();
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');

    const mutation = useMutation({
        mutationFn: () => apiClient.post('/auth/change-password', { currentPassword, newPassword }),
        onSuccess: () => {
            toast.success(t('settings.passwordChanged'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (error: any) => {
            const message = typeof error.response?.data === 'string'
                ? error.response.data
                : error.response?.data?.message;
            toast.error(message || t('settings.passwordChangeFailed'));
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error(t('settings.passwordMismatch'));
            return;
        }
        if (newPassword.length < 6) {
            toast.error(t('settings.passwordTooShort'));
            return;
        }
        mutation.mutate();
    };

    return (
        <div className="mx-auto max-w-2xl space-y-8">
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-950">{t('settings.security')}</h1>
                    <p className="mt-1 text-slate-500">{t('settings.change_password')}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                        <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-slate-950">{t('settings.update_password')}</h2>
                        <p className="text-sm text-slate-500">{t('settings.change_password')}</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <PasswordField
                        label={t('settings.current_password')}
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        autoComplete="current-password"
                    />
                    <PasswordField
                        label={t('settings.new_password')}
                        value={newPassword}
                        onChange={setNewPassword}
                        autoComplete="new-password"
                        minLength={6}
                    />
                    <PasswordField
                        label={t('settings.confirm_password')}
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        autoComplete="new-password"
                        minLength={6}
                    />
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="inline-flex h-11 items-center justify-center rounded-md bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {mutation.isPending ? t('settings.updating') : t('settings.update_password')}
                    </button>
                </div>
            </form>
        </div>
    );
};
