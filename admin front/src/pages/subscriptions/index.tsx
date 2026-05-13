import React, { useState } from 'react';
import { useSubscriptionsMonitoring, useActivateMerchant, useDeactivateMerchant } from '@/hooks/useAdminActions';
import { Link } from 'react-router-dom';
import { Search, Eye, AlertCircle, Calendar, Clock, AlertTriangle, CheckCircle2, UserX, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubscriptionState, MerchantSubscriptionRow } from '@/types/admin';

export const SubscriptionsMonitoringPage: React.FC = () => {
    const [filter, setFilter] = useState('expiringSoon');
    const [days, setDays] = useState(7);
    const [search, setSearch] = useState('');

    const { data: subscriptions, isLoading, error, refetch } = useSubscriptionsMonitoring({ filter, days, search });

    const activate = useActivateMerchant();
    const deactivate = useDeactivateMerchant();

    const StatusBadge = ({ state }: { state: SubscriptionState }) => {
        const styles = {
            Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
            Grace: "bg-orange-100 text-orange-700 border-orange-200",
            Expired: "bg-red-100 text-red-700 border-red-200",
            None: "bg-slate-100 text-slate-700 border-slate-200"
        };
        const icons = {
            Active: <CheckCircle2 className="w-3 h-3 mr-1" />,
            Grace: <Clock className="w-3 h-3 mr-1" />,
            Expired: <AlertTriangle className="w-3 h-3 mr-1" />,
            None: null
        };

        return (
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", styles[state])}>
                {icons[state]}
                {state}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Subscriptions Monitoring</h1>
                    <p className="text-slate-500 mt-1">Monitor merchant subscription states and upcoming expirations.</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {[
                            { id: 'expiringSoon', label: 'Expiring Soon' },
                            { id: 'grace', label: 'In Grace' },
                            { id: 'expired', label: 'Expired' },
                            { id: 'active', label: 'Active' },
                            { id: 'deactivated', label: 'Deactivated' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                    filter === tab.id
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {filter === 'expiringSoon' && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-600">Threshold:</label>
                            <select
                                value={days}
                                onChange={(e) => setDays(Number(e.target.value))}
                                className="bg-white border border-slate-200 rounded-md px-2 py-1.5 text-sm"
                            >
                                <option value={3}>3 Days</option>
                                <option value={7}>7 Days</option>
                                <option value={14}>14 Days</option>
                                <option value={30}>30 Days</option>
                            </select>
                        </div>
                    )}

                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search merchant, email, brand..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>
            </div>

            {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-red-900 mb-2">Endpoint Not Ready</h3>
                    <p className="text-red-700 max-w-md mx-auto mb-6">
                        {(error as any).message || 'No endpoint found. Add an admin endpoint that returns merchants with subscription dates/status.'}
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Merchant</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Brand</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Term / Expiry</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4">
                                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : subscriptions?.length ? (
                                subscriptions.map((sub: MerchantSubscriptionRow) => (
                                    <tr key={sub.userId} className="hover:bg-slate-50 transition-colors group text-sm">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full shrink-0 shadow-sm",
                                                    sub.isOnShift ? "bg-emerald-500 ring-4 ring-emerald-500/10" : "bg-slate-300"
                                                )} title={sub.isOnShift ? "Online" : "Offline"} />
                                                <div className="flex flex-col">
                                                    <div className="font-medium text-slate-900 leading-none">{sub.userName}</div>
                                                    <div className="text-[11px] text-slate-500 mt-1">{sub.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="font-medium text-slate-700">{sub.brandName}</div>
                                                <div className="text-[11px] text-slate-400 mt-1">{sub.brandPhone}</div>
                                                {sub.masterCategories && sub.masterCategories.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {sub.masterCategories.map((cat: string) => (
                                                            <span key={cat} className="bg-indigo-50 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded border border-indigo-100 font-medium">
                                                                {cat}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {!sub.isActive ? (
                                                    <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-100 uppercase">
                                                        Deactivated
                                                    </span>
                                                ) : (
                                                    <StatusBadge state={sub.state} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="text-slate-600 font-medium flex items-center justify-center">
                                                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                                    {new Date(sub.endDate).toLocaleDateString()}
                                                </div>
                                                <div className={cn(
                                                    "text-[10px] mt-1 font-bold px-2 py-0.5 rounded-full inline-block",
                                                    sub.daysRemaining <= 0 ? "bg-rose-100 text-rose-700" :
                                                        sub.daysRemaining <= 7 ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"
                                                )}>
                                                    {sub.daysRemaining <= 0 ? (
                                                        sub.state === 'Grace' ? 'GRACE PERIOD' : 'EXPIRED'
                                                    ) : `${sub.daysRemaining} days left`}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        const action = sub.isActive ? 'Deactivate' : 'Activate';
                                                        if (confirm(`${action} merchant ${sub.userName}?`)) {
                                                            sub.isActive ? deactivate.mutate(sub.userId) : activate.mutate(sub.userId);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-all",
                                                        sub.isActive
                                                            ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                            : "text-blue-600 bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-200"
                                                    )}
                                                    title={sub.isActive ? "Deactivate Merchant" : "Reactivate Merchant"}
                                                    disabled={activate.isPending || deactivate.isPending}
                                                >
                                                    {sub.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                </button>

                                                <Link
                                                    to={`/merchants/${sub.userId}/subscription`}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="View Subscription Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                                        No merchants found matching the current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
