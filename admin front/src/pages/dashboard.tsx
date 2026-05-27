import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Clock,
    CreditCard,
    Eye,
    EyeOff,
    MessageCircle,
    PackageCheck,
    ReceiptText,
    RefreshCw,
    Settings as SettingsIcon,
    ShoppingCart,
    Search,
    Store,
    TimerReset,
    Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminAnalyticsOverview, useDashboardStats, useSystemHealth } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';
import { DashboardRecentOrder } from '@/types/admin';
import { useTranslation } from '@/context/LanguageContext';

const formatCurrency = (value?: number, lang?: string, symbol?: string) => {
    const formatted = Math.round(value ?? 0).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');
    const s = symbol || (lang === 'ar' ? 'جنيه' : 'EGP');
    return lang === 'ar' ? `${formatted} ${s}` : `${s} ${formatted}`;
};

const getStatusLabel = (status: string, t: (key: string) => string) => {
    const key = `dashboard.order_status.${status.toLowerCase()}`;
    return t(key);
};

const timeAgo = (dateStr: string, t: (key: string) => string, language: string) => {
    try {
        const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
        if (seconds < 60) return t('dashboard.time.now');
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return t('dashboard.time.minutes_ago').replace('{count}', String(minutes));
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return t('dashboard.time.hours_ago').replace('{count}', String(hours));
        return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
    } catch {
        return t('dashboard.time.recent');
    }
};

type StatCardProps = {
    title: string;
    value: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    subtitle?: string;
    to?: string;
    isLoading?: boolean;
    error?: unknown;
    onRetry?: () => void;
    retryLabel?: string;
};

const StatCard = ({ title, value, icon: Icon, color, subtitle, to, isLoading, error, onRetry, retryLabel }: StatCardProps) => (
    <Link
        to={to || '#'}
        className={cn(
            'bg-white p-6 rounded-lg shadow-sm border border-slate-200 block transition-all',
            to ? 'hover:shadow-md hover:border-slate-300 group' : 'cursor-default'
        )}
    >
        <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    {title}
                    {to && <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </p>
                {isLoading ? (
                    <div className="h-9 bg-slate-100 rounded w-20 mt-2 animate-pulse" />
                ) : error ? (
                    <div className="flex flex-col mt-1">
                        <span className="text-xl font-bold text-slate-400">-</span>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onRetry?.();
                            }}
                            className="text-[10px] text-blue-600 hover:underline font-bold uppercase tracking-wider"
                        >
                            {retryLabel || 'Retry'}
                        </button>
                    </div>
                ) : (
                    <p className="text-3xl font-bold mt-1">{value}</p>
                )}
                {subtitle && <p className="text-[11px] text-slate-400 mt-1 font-semibold">{subtitle}</p>}
            </div>
            <div className={cn('p-3 rounded-full transition-transform group-hover:scale-110', color)}>
                <Icon className="h-6 w-6 text-white" />
            </div>
        </div>
    </Link>
);

const HealthWidget = () => {
    const { data: health, isLoading, refresh, isFetching } = useSystemHealth();
    const { t, language } = useTranslation();

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {t('dashboard.system_health')}
                </h3>
                <button
                    onClick={() => refresh()}
                    disabled={isFetching}
                    className={cn('p-1 text-slate-400 hover:text-slate-600 rounded-md transition-all', isFetching && 'animate-spin')}
                    title={t('dashboard.retry')}
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{t('dashboard.api_status')}</span>
                    {isLoading ? (
                        <div className="h-5 bg-slate-100 rounded w-16 animate-pulse" />
                    ) : health?.ok ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            {t('dashboard.api_online')}
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full border border-rose-100">
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                            {t('dashboard.api_offline')}
                        </span>
                    )}
                </div>

                {!isLoading && health?.ok && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{t('dashboard.latency')}</span>
                        <span className={cn('text-xs font-mono font-bold', health.latencyMs < 100 ? 'text-emerald-600' : health.latencyMs < 300 ? 'text-amber-600' : 'text-rose-600')}>
                            {health.latencyMs}ms
                        </span>
                    </div>
                )}

                {!isLoading && !health?.ok && health?.message && (
                    <div className="bg-rose-50 border border-rose-100 rounded p-2 flex gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-rose-700 leading-tight">{health.message.substring(0, 80)}</p>
                    </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between opacity-60">
                    <span className="text-[10px] text-slate-400">{t('dashboard.last_checked')}</span>
                    <span className="text-[10px] text-slate-500">{health ? timeAgo(health.checkedAt, t, language) : '-'}</span>
                </div>
            </div>
        </div>
    );
};

const RecentOrders = ({ orders, language, t }: { orders: DashboardRecentOrder[]; language: string; t: (key: string) => string }) => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-blue-500" />
                {t('dashboard.recent_orders')}
            </h3>
            <span className="text-xs text-slate-400 font-bold">{t('dashboard.recent_orders_desc')}</span>
        </div>
        <div className="divide-y divide-slate-100">
            {orders.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">{t('dashboard.no_recent_orders')}</div>
            ) : (
                orders.map((order) => (
                    <div key={order.id} className="p-4 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-slate-800">#{order.orderNumber}</p>
                            <p className="text-xs text-slate-500">{order.brandName}، {timeAgo(order.createdAt, t, language)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(order.total, language)}</p>
                            <p className="text-xs text-slate-500">{getStatusLabel(order.status, t)}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

const NeedsAttentionOrders = ({ orders, language, t }: { orders: DashboardRecentOrder[]; language: string; t: (key: string) => string }) => (
    <div className="bg-white rounded-lg border border-amber-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <TimerReset className="w-4 h-4 text-amber-600" />
                {t('dashboard.attention_orders')}
            </h3>
            <span className="text-xs text-amber-700 font-bold">{t('dashboard.attention_orders_desc')}</span>
        </div>
        <div className="divide-y divide-amber-50">
            {orders.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">{t('dashboard.no_attention_orders')}</div>
            ) : (
                orders.map((order) => (
                    <div key={order.id} className="p-4 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-slate-800">#{order.orderNumber}</p>
                            <p className="text-xs text-slate-500">{order.brandName}، {timeAgo(order.createdAt, t, language)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-amber-700">{getStatusLabel(order.status, t)}</p>
                            <p className="text-xs text-slate-500">{formatCurrency(order.total, language)}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

const PlatformAnalytics = ({ analytics, language }: { analytics: any; language: string }) => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Platform analytics
            </h3>
            <span className="text-xs text-slate-400 font-bold">Last 7 days</span>
        </div>
        <div className="border-b border-slate-100">
            <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Sector mix</p>
            </div>
            {(analytics?.sectorBreakdown ?? []).length === 0 ? (
                <div className="px-4 pb-4 text-sm text-slate-500">No sector analytics yet.</div>
            ) : (
                <div className="space-y-2 px-4 pb-4">
                    {analytics.sectorBreakdown.map((sector: any) => (
                        <div key={sector.marketSectorId} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-bold text-slate-800 truncate">{sector.marketSectorName}</p>
                                <p className="text-sm font-bold text-slate-900 whitespace-nowrap">{formatCurrency(sector.revenue, language)}</p>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                {sector.storeViews} store views - {sector.productViews} product views - {sector.orders} orders - {sector.conversionRate}% conversion
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
        <div className="divide-y divide-slate-100">
            <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Top merchants</p>
            </div>
            {(analytics?.topMerchants ?? []).length === 0 ? (
                <div className="p-4 text-sm text-slate-500">No merchant analytics yet.</div>
            ) : (
                analytics.topMerchants.map((merchant: any) => (
                    <div key={merchant.brandId} className="p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{merchant.brandName}</p>
                            <p className="text-xs text-slate-500">
                                {merchant.productViews} views · {merchant.orders} orders · {merchant.conversionRate}% conversion
                            </p>
                        </div>
                        <p className="text-sm font-bold text-slate-900 whitespace-nowrap">{formatCurrency(merchant.revenue, language)}</p>
                    </div>
                ))
            )}
        </div>
    </div>
);

export const Dashboard: React.FC = () => {
    const { t, language } = useTranslation();

    const { data: settings, isLoading: isSettingsLoading, error: settingsError, refetch: refetchSettings } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: () => apiClient.get('admin/settings').then(res => res.data),
        refetchInterval: 7000,
    });

    const { data: methods, isLoading: isMethodsLoading, error: methodsError, refetch: refetchMethods } = useQuery({
        queryKey: ['payment-methods'],
        queryFn: () => apiClient.get('admin/payments/methods').then(res => res.data),
        refetchInterval: 7000,
    });

    const { data: dashStats, isLoading: isDashLoading, error: dashError, refetch: refetchDash } = useDashboardStats();
    const { data: analytics, isLoading: isAnalyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAdminAnalyticsOverview(7);
    const globalError = settingsError || methodsError || dashError;

    if (globalError) return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <h2 className="font-bold flex items-center mb-2">{t('dashboard.server_error_title')}</h2>
            <p className="text-sm mb-4">{t('dashboard.server_error_desc')}</p>
            <button
                onClick={() => {
                    refetchSettings();
                    refetchMethods();
                    refetchDash();
                    refetchAnalytics();
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-md hover:bg-red-700 transition-colors"
            >
                {t('dashboard.reconnect')}
            </button>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('dashboard.subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <StatCard 
                    title={t('dashboard.stats.total_orders')} 
                    value={dashStats?.totalOrders ?? 0} 
                    subtitle={t('dashboard.stats.active_orders').replace('{count}', String(dashStats?.activeOrders ?? 0))} 
                    icon={PackageCheck} 
                    color="bg-blue-500" 
                    isLoading={isDashLoading} 
                    error={dashError} 
                    onRetry={refetchDash} 
                    retryLabel={t('dashboard.retry')}
                />
                <StatCard 
                    title={t('dashboard.stats.late_orders')} 
                    value={dashStats?.lateActiveOrders ?? 0} 
                    subtitle={t('dashboard.stats.late_desc')} 
                    icon={TimerReset} 
                    color="bg-amber-500" 
                    isLoading={isDashLoading} 
                    error={dashError} 
                    onRetry={refetchDash} 
                    retryLabel={t('dashboard.retry')}
                />
                <StatCard 
                    title={t('dashboard.stats.delivered_revenue')} 
                    value={formatCurrency(dashStats?.deliveredRevenue, language)} 
                    subtitle={t('dashboard.stats.today_revenue').replace('{amount}', formatCurrency(dashStats?.todaysRevenue, language))} 
                    icon={ReceiptText} 
                    color="bg-emerald-500" 
                    isLoading={isDashLoading} 
                    error={dashError} 
                    onRetry={refetchDash} 
                    retryLabel={t('dashboard.retry')}
                />
                <StatCard
                    title="Store Views"
                    value={analytics?.storeViews ?? 0}
                    subtitle={`${analytics?.productViews ?? 0} product views`}
                    icon={Eye}
                    color="bg-sky-500"
                    isLoading={isAnalyticsLoading}
                    error={analyticsError}
                    onRetry={refetchAnalytics}
                    retryLabel={t('dashboard.retry')}
                />
                <StatCard
                    title="Cart Adds"
                    value={analytics?.addToCartEvents ?? 0}
                    subtitle={`${analytics?.abandonedCarts ?? 0} abandoned carts`}
                    icon={ShoppingCart}
                    color="bg-orange-500"
                    isLoading={isAnalyticsLoading}
                    error={analyticsError}
                    onRetry={refetchAnalytics}
                    retryLabel={t('dashboard.retry')}
                />
                <StatCard
                    title="Searches"
                    value={analytics?.searches ?? 0}
                    subtitle={`${analytics?.platformConversionRate ?? 0}% platform conversion`}
                    icon={Search}
                    color="bg-teal-500"
                    isLoading={isAnalyticsLoading}
                    error={analyticsError}
                    onRetry={refetchAnalytics}
                    retryLabel={t('dashboard.retry')}
                />
                <StatCard 
                    title={t('dashboard.stats.customers')} 
                    value={dashStats?.customers ?? 0} 
                    subtitle={t('dashboard.stats.new_customers').replace('{count}', String(dashStats?.newCustomers ?? 0))} 
                    icon={Users} 
                    color="bg-indigo-500" 
                    isLoading={isDashLoading} 
                    error={dashError} 
                    onRetry={refetchDash} 
                    retryLabel={t('dashboard.retry')}
                />
                <StatCard 
                    title={t('dashboard.stats.merchants')} 
                    value={dashStats?.merchants ?? 0} 
                    subtitle={t('dashboard.stats.online_merchants').replace('{count}', String(dashStats?.onlineMerchants ?? 0))} 
                    icon={Store} 
                    color="bg-violet-500" 
                    to="/subscriptions?filter=onShift" 
                    isLoading={isDashLoading} 
                    error={dashError} 
                    onRetry={refetchDash} 
                    retryLabel={t('dashboard.retry')}
                />
                <StatCard 
                    title={t('dashboard.stats.temp_closed')} 
                    value={dashStats?.temporarilyClosedMerchants ?? 0} 
                    subtitle={t('dashboard.stats.hidden_merchants')} 
                    icon={EyeOff} 
                    color="bg-amber-500" 
                    to="/subscriptions?filter=tempClosed" 
                    isLoading={isDashLoading} 
                    error={dashError} 
                    onRetry={refetchDash} 
                    retryLabel={t('dashboard.retry')}
                />
                <StatCard 
                    title={t('dashboard.stats.pending_approvals')} 
                    value={dashStats?.pendingApprovals ?? 0} 
                    icon={Activity} 
                    color="bg-cyan-500" 
                    to="/merchant-approvals" 
                    isLoading={isDashLoading} 
                    error={dashError} 
                    onRetry={refetchDash} 
                    retryLabel={t('dashboard.retry')}
                />
                <StatCard 
                    title={t('dashboard.stats.pending_payments')} 
                    value={dashStats?.pendingPayments ?? 0} 
                    icon={CreditCard} 
                    color="bg-rose-500" 
                    to="/subscription-payment-requests" 
                    isLoading={isDashLoading} 
                    error={dashError} 
                    onRetry={refetchDash} 
                    retryLabel={t('dashboard.retry')}
                />
                <StatCard 
                    title={t('dashboard.stats.unread_chats')} 
                    value={dashStats?.unreadAdminChats ?? 0} 
                    subtitle={t('dashboard.stats.open_chats').replace('{count}', String(dashStats?.openChatThreads ?? 0))} 
                    icon={MessageCircle} 
                    color="bg-fuchsia-500" 
                    to="/chats" 
                    isLoading={isDashLoading} 
                    error={dashError} 
                    onRetry={refetchDash} 
                    retryLabel={t('dashboard.retry')}
                />
                <StatCard 
                    title={t('dashboard.stats.payment_methods')} 
                    value={methods?.length ?? 0} 
                    icon={SettingsIcon} 
                    color="bg-slate-700" 
                    to="/payment-methods" 
                    isLoading={isMethodsLoading} 
                    error={methodsError} 
                    onRetry={refetchMethods} 
                    retryLabel={t('dashboard.retry')}
                />
                <StatCard 
                    title={t('dashboard.stats.free_trial')} 
                    value={isSettingsLoading ? '...' : settings?.isFreeTrialEnabled ? t('dashboard.stats.enabled') : t('dashboard.stats.disabled')} 
                    icon={Clock} 
                    color={settings?.isFreeTrialEnabled ? 'bg-green-500' : 'bg-slate-400'} 
                    to="/settings" 
                    isLoading={isSettingsLoading} 
                    error={settingsError} 
                    onRetry={refetchSettings} 
                    retryLabel={t('dashboard.retry')}
                />
            </div>

            <PlatformAnalytics analytics={analytics} language={language} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <RecentOrders orders={dashStats?.recentOrders ?? []} language={language} t={t} />
                </div>
                <HealthWidget />
            </div>

            <NeedsAttentionOrders orders={dashStats?.needsAttentionOrders ?? []} language={language} t={t} />
        </div>
    );
};
