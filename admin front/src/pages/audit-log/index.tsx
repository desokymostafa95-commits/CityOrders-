import React, { useState } from 'react';
import { useAuditLogs } from '@/hooks/useAdminActions';
import {
    Activity,
    Calendar,
    Filter,
    Search,
    AlertCircle,
    User,
    Tag,
    FileText,
    X,
    Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuditActionType } from '@/types/admin';

export const AuditLogPage: React.FC = () => {
    const [dateRange, setDateRange] = useState('7');
    const [actionType, setActionType] = useState('');

    // Stabilize dates to avoid infinite refetch loops
    const { fromDate, toDate } = React.useMemo(() => {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - Number(dateRange));

        // Reset to start/end of day to avoid fluctuating seconds
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        return {
            fromDate: from.toISOString(),
            toDate: to.toISOString()
        };
    }, [dateRange]);

    const { data: logs, isLoading, error, refetch } = useAuditLogs({
        from: fromDate,
        to: toDate,
        type: actionType
    });

    const ActionIcon = ({ type }: { type: AuditActionType }) => {
        const icons: Record<string, React.ReactNode> = {
            MerchantApproved: <Tag className="w-4 h-4 text-emerald-500" />,
            MerchantRejected: <X className="w-4 h-4 text-red-500" />,
            SettingsChanged: <Activity className="w-4 h-4 text-orange-500" />,
            PaymentApproved: <Tag className="w-4 h-4 text-emerald-500" />,
            PaymentRejected: <Tag className="w-4 h-4 text-red-500" />,
            PlanCreated: <FileText className="w-4 h-4 text-indigo-500" />,
            PlanUpdated: <FileText className="w-4 h-4 text-indigo-500" />,
            PlanToggled: <FileText className="w-4 h-4 text-indigo-500" />,
            PlanDeleted: <Trash2 className="w-4 h-4 text-red-500" />,
            SubscriptionExtend: <Calendar className="w-4 h-4 text-blue-500" />,
            ForceExpire: <AlertCircle className="w-4 h-4 text-red-500" />,
            // Legacy/Fallback mappings
            Approval: <Tag className="w-4 h-4 text-emerald-500" />,
            PaymentApprove: <Tag className="w-4 h-4 text-emerald-500" />,
            PaymentReject: <Tag className="w-4 h-4 text-red-500" />,
            SettingsChange: <Activity className="w-4 h-4 text-orange-500" />,
            PlanEdit: <FileText className="w-4 h-4 text-indigo-500" />
        };
        return icons[type] || <Activity className="w-4 h-4 text-slate-400" />;
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Audit Log</h1>
                    <p className="text-slate-500 mt-1">Track all administrative actions and system changes.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">Filters:</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Date Range</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Action Type</label>
                        <select
                            value={actionType}
                            onChange={(e) => setActionType(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="">All Actions</option>
                            <option value="MerchantApproved">Merchant Approval</option>
                            <option value="MerchantRejected">Merchant Rejection</option>
                            <option value="PaymentApproved">Payment Approval</option>
                            <option value="PaymentRejected">Payment Rejection</option>
                            <option value="SubscriptionExtend">Subscription Extend</option>
                            <option value="ForceExpire">Force Expire</option>
                            <option value="SettingsChanged">Settings Change</option>
                            <option value="PlanCreated">Plan Created</option>
                            <option value="PlanUpdated">Plan Updated</option>
                            <option value="PlanToggled">Plan Toggled</option>
                            <option value="PlanDeleted">Plan Deleted</option>
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter by description or target..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                            disabled
                        />
                    </div>
                </div>
            </div>

            {error ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-12 text-center max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Activity className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Audit API Not Available</h3>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        The auditing feature requires a specialized backend endpoint to fetch historical admin actions.
                        Please add the <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">/api/admin/audit</code> endpoint to enable this view.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-8 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all font-bold shadow-lg shadow-slate-200 flex items-center gap-2 mx-auto"
                    >
                        <RotateCw className="w-4 h-4" /> Check Again
                    </button>
                    <div className="mt-8 pt-8 border-t border-slate-200 grid grid-cols-2 gap-4 text-left opacity-40">
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Date / Time</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Target</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Administrator</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Summary</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-5">
                                            <div className="h-4 bg-slate-50 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : logs?.length ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm tabular-nums text-slate-500">
                                            {new Date(log.timestamp).toLocaleString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <ActionIcon type={log.action} />
                                                <span className="text-sm font-medium text-slate-900">{log.action}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono">
                                                {log.target}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                    <User className="w-3 h-3 text-indigo-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-700">{log.adminName}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono tracking-tighter -mt-0.5">{log.adminEmail}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-500 line-clamp-1 italic">"{log.summary}"</p>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="max-w-xs mx-auto space-y-3 opacity-20 grayscale">
                                            <Activity className="h-12 w-12 mx-auto" />
                                            <p className="text-sm font-medium">No activity records found for this period.</p>
                                        </div>
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

const RotateCw = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
    </svg>
)
