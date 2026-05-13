import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import {
    Users,
    CreditCard,
    Clock,
    Settings as SettingsIcon,
    ArrowRight,
    Store,
    EyeOff,
    CheckCircle2,
    XCircle,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardStats, useSystemHealth } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';

const timeAgo = (dateStr: string) => {
    try {
        const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(dateStr).toLocaleDateString();
    } catch (e) {
        return "recently";
    }
};

const StatCard = ({ title, value, icon: Icon, color, subtitle, to, isLoading, error, onRetry }: any) => (
    <Link
        to={to || '#'}
        className={cn(
            "bg-white p-6 rounded-lg shadow-sm border border-slate-200 block transition-all",
            to ? "hover:shadow-md hover:border-slate-300 group" : "cursor-default"
        )}
    >
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    {title}
                    {to && <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </p>
                {isLoading ? (
                    <div className="h-9 bg-slate-100 rounded w-16 mt-1 animate-pulse" />
                ) : error ? (
                    <div className="flex flex-col mt-1">
                        <span className="text-xl font-bold text-slate-400">—</span>
                        <button
                            onClick={(e) => { e.preventDefault(); onRetry?.(); }}
                            className="text-[10px] text-blue-600 hover:underline font-bold uppercase tracking-wider"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <p className="text-3xl font-bold mt-1">{value}</p>
                )}
                {subtitle && <p className="text-[11px] text-slate-400 mt-1 uppercase font-semibold tracking-wider">{subtitle}</p>}
            </div>
            <div className={cn("p-3 rounded-full transition-transform group-hover:scale-110", color)}>
                <Icon className="h-6 w-6 text-white" />
            </div>
        </div>
    </Link>
);

const HealthWidget = () => {
    const { data: health, isLoading, error, refresh, isFetching } = useSystemHealth();

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden max-w-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    System Health
                </h3>
                <button
                    onClick={() => refresh()}
                    disabled={isFetching}
                    className={cn(
                        "p-1 text-slate-400 hover:text-slate-600 rounded-md transition-all",
                        isFetching && "animate-spin"
                    )}
                    title="Manual Refresh"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">API Gateway</span>
                    {isLoading ? (
                        <div className="h-5 bg-slate-100 rounded w-16 animate-pulse" />
                    ) : health?.ok ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100 uppercase">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            Online
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full border border-rose-100 uppercase">
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                            Offline
                        </span>
                    )}
                </div>

                {!isLoading && health?.ok && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Response Time</span>
                        <span className={cn(
                            "text-xs font-mono font-bold",
                            health.latencyMs < 100 ? "text-emerald-600" :
                                health.latencyMs < 300 ? "text-amber-600" : "text-rose-600"
                        )}>
                            {health.latencyMs}ms
                        </span>
                    </div>
                )}

                {!isLoading && !health?.ok && health?.message && (
                    <div className="bg-rose-50 border border-rose-100 rounded p-2 flex gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-rose-700 leading-tight">
                            {health.message.substring(0, 50)}{health.message.length > 50 ? '...' : ''}
                        </p>
                    </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between opacity-60">
                    <span className="text-[10px] text-slate-400">Last checked</span>
                    <span className="text-[10px] text-slate-500">
                        {health ? timeAgo(health.checkedAt) : '—'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
    // Existing stats
    const { data: apps, isLoading: isAppsLoading, error: appsError, refetch: refetchApps } = useQuery({
        queryKey: ['merchant-apps'],
        queryFn: () => apiClient.get('Admin/merchant-applications?status=pending').then(res => res.data),
        refetchInterval: 7000
    });

    const { data: payments, isLoading: isPaymentsLoading, error: paymentsError, refetch: refetchPayments } = useQuery({
        queryKey: ['payment-requests'],
        queryFn: () => apiClient.get('Admin/payment-requests?status=Pending').then(res => res.data),
        refetchInterval: 7000
    });

    const { data: settings, isLoading: isSettingsLoading, error: settingsError, refetch: refetchSettings } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: () => apiClient.get('admin/settings').then(res => res.data),
        refetchInterval: 7000
    });

    const { data: methods, isLoading: isMethodsLoading, error: methodsError, refetch: refetchMethods } = useQuery({
        queryKey: ['payment-methods'],
        queryFn: () => apiClient.get('admin/payments/methods').then(res => res.data),
        refetchInterval: 7000
    });

    // New stats
    const { data: dashStats, isLoading: isDashLoading, error: dashError, refetch: refetchDash } = useDashboardStats();

    const statsLoading = isAppsLoading || isPaymentsLoading || isSettingsLoading || isMethodsLoading || isDashLoading;
    const globalError = appsError || paymentsError || settingsError || methodsError;

    if (globalError) return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <h2 className="font-bold flex items-center mb-2">
                API Unreachable
            </h2>
            <p className="text-sm mb-4">
                {(globalError as any).message || 'Could not connect to the CityOrders API.'}
                {' '}Check if the backend project in <code>CityOrders.Api</code> is running on <strong>port 5014</strong>.
            </p>
            <button
                onClick={() => {
                    refetchApps();
                    refetchPayments();
                    refetchSettings();
                    refetchMethods();
                    refetchDash();
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-md hover:bg-red-700 transition-colors"
            >
                Retry All Connections
            </button>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome to CityOrders Admin Panel.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Merchants Online"
                    value={dashStats?.merchantsOnline || 0}
                    subtitle="On Shift"
                    icon={Store}
                    color="bg-emerald-500"
                    to="/subscriptions?filter=onShift"
                    isLoading={isDashLoading}
                    error={dashError}
                    onRetry={refetchDash}
                />
                <StatCard
                    title="Temporarily Closed"
                    value={dashStats?.tempClosed || 0}
                    subtitle="Hidden from customers"
                    icon={EyeOff}
                    color="bg-amber-500"
                    to="/subscriptions?filter=tempClosed"
                    isLoading={isDashLoading}
                    error={dashError}
                    onRetry={refetchDash}
                />
                <StatCard
                    title="Pending Approvals"
                    value={apps?.length || 0}
                    icon={Users}
                    color="bg-blue-500"
                    to="/merchant-approvals"
                    isLoading={isAppsLoading}
                    error={appsError}
                    onRetry={refetchApps}
                />
                <StatCard
                    title="Pending Payments"
                    value={payments?.length || 0}
                    icon={CreditCard}
                    color="bg-indigo-500"
                    to="/subscription-payment-requests"
                    isLoading={isPaymentsLoading}
                    error={paymentsError}
                    onRetry={refetchPayments}
                />
                <StatCard
                    title="Payment Methods"
                    value={methods?.length || 0}
                    icon={SettingsIcon}
                    color="bg-slate-700"
                    to="/payment-methods"
                    isLoading={isMethodsLoading}
                    error={methodsError}
                    onRetry={refetchMethods}
                />
                <StatCard
                    title="Free Trial"
                    value={isSettingsLoading ? '...' : settings?.isFreeTrialEnabled ? 'Enabled' : 'Disabled'}
                    icon={Clock}
                    color={settings?.isFreeTrialEnabled ? 'bg-indigo-400' : 'bg-slate-400'}
                    to="/settings"
                    isLoading={isSettingsLoading}
                    error={settingsError}
                    onRetry={refetchSettings}
                />
            </div>

            <div className="pt-4">
                <HealthWidget />
            </div>
        </div>
    );
};
