import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import {
    useSubscriptionDetails,
    useExtendSubscription,
    useForceExpire,
    useActivateMerchant,
    useDeactivateMerchant,
    useMasterCategories,
    useUpdateMerchantCategories
} from '@/hooks/useAdminActions';
import {
    ArrowLeft,
    Calendar,
    Clock,
    ShieldAlert,
    History,
    Plus,
    RotateCcw,
    AlertCircle,
    Info,
    MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Tag, Save, Loader2, Store } from 'lucide-react';

const getServerImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = apiClient.defaults.baseURL || '';
    const serverRoot = baseUrl.endsWith('/api/') ? baseUrl.slice(0, -5) : baseUrl.replace('/api/', '');
    return `${serverRoot}${path}`;
};

interface Category {
    id: number;
    name: string;
}

const MerchantCategoriesSection: React.FC<{ merchantId: number; currentCategoryIds: number[] }> = ({ merchantId, currentCategoryIds }) => {
    const { data: allCategories, isLoading: categoriesLoading } = useMasterCategories();
    const updateMutation = useUpdateMerchantCategories();
    const [selectedIds, setSelectedIds] = React.useState<number[]>(currentCategoryIds);

    // Sync if props change (unlikely but good practice)
    React.useEffect(() => {
        setSelectedIds(currentCategoryIds);
    }, [currentCategoryIds]);

    const toggleCategory = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const hasChanges = JSON.stringify([...selectedIds].sort()) !== JSON.stringify([...currentCategoryIds].sort());

    const handleSave = () => {
        updateMutation.mutate({ userId: merchantId, categoryIds: selectedIds });
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                Manage Categories
            </h3>

            {categoriesLoading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
            ) : (
                <div className="space-y-2 mt-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {allCategories?.map((cat: Category) => (
                        <label key={cat.id} className="flex items-center group cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(cat.id)}
                                onChange={() => toggleCategory(cat.id)}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-3 text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                                {cat.name}
                            </span>
                        </label>
                    ))}
                </div>
            )}

            <button
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
                className="mt-6 w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 transition-all"
            >
                {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save Categories
            </button>
        </div>
    );
};

export const SubscriptionDetailsPage: React.FC = () => {
    const { merchantId } = useParams();
    const navigate = useNavigate();
    const { data: details, isLoading, error, refetch } = useSubscriptionDetails(merchantId);

    const extendMutation = useExtendSubscription();
    const expireMutation = useForceExpire();
    const activateMutation = useActivateMerchant();
    const deactivateMutation = useDeactivateMerchant();

    const [extendDays, setExtendDays] = useState(7);
    const [reason, setReason] = useState('');
    const [showConfirmExtend, setShowConfirmExtend] = useState(false);
    const [showConfirmExpire, setShowConfirmExpire] = useState(false);

    if (isLoading) return <div className="p-12 text-center text-slate-500 animate-pulse font-medium">Loading merchant subscription details...</div>;

    if (error) return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-2xl mx-auto mt-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-900 mb-2">View Not Available</h3>
            <p className="text-red-700 mb-6">
                {error.message || 'Could not load subscription details for this merchant.'}
            </p>
            <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 transition-colors"
            >
                Go Back
            </button>
        </div>
    );

    if (!details) return <div>Merchant not found.</div>;

    const handleExtend = () => {
        if (!merchantId) return;
        extendMutation.mutate({
            userId: Number(merchantId),
            days: extendDays,
            reason
        }, {
            onSuccess: () => setShowConfirmExtend(false)
        });
    };

    const handleForceExpire = () => {
        if (!merchantId) return;
        expireMutation.mutate(Number(merchantId), {
            onSuccess: () => setShowConfirmExpire(false)
        });
    };

    return (
        <div className="space-y-8 pb-12">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-slate-500 hover:text-slate-900 transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
                Back to monitoring
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {details.logoUrl ? (
                            <img
                                src={getServerImageUrl(details.logoUrl) || ''}
                                alt={details.brandName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <Store className="h-8 w-8 text-slate-300" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{details.brandName || details.userName}</h1>
                        <p className="text-slate-500 mt-1">Merchant ID: {details.userId} • {details.email}</p>

                        {!details.isApproved && details.approvalRequestReason && (
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Approval Rationale</p>
                                    <p className="text-sm text-amber-900 font-medium">{details.approvalRequestReason}</p>
                                </div>
                            </div>
                        )}

                        {details.masterCategories && details.masterCategories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {details.masterCategories.map((cat: string) => (
                                    <span key={cat} className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-0.5 rounded-full border border-indigo-100">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className={cn(
                    "px-4 py-2 rounded-lg font-bold text-lg border-2",
                    !details.isActive ? "bg-rose-50 text-rose-700 border-rose-200" :
                        details.state === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            details.state === 'Grace' ? "bg-orange-50 text-orange-700 border-orange-200" :
                                "bg-red-50 text-red-700 border-red-200"
                )}>
                    {!details.isActive ? "Deactivated" : `${details.state} (${details.daysRemaining}d left)`}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Details Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-lg font-bold">Subscription Info</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Plan</label>
                                <p className="text-lg font-medium text-slate-900 mt-0.5">{details.planName}</p>
                                {details.isTrial && (
                                    <span className="inline-flex mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase">Trial Mode</span>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className={cn(
                                        "w-2.5 h-2.5 rounded-full",
                                        !details.isActive ? "bg-rose-500" :
                                            details.state === 'Active' ? "bg-emerald-500" :
                                                details.state === 'Grace' ? "bg-orange-500" : "bg-red-500"
                                    )} />
                                    <span className="font-medium">{!details.isActive ? "Deactivated" : details.state}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider italic">Start Date</label>
                                <p className="text-slate-700 mt-0.5 flex items-center">
                                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                    {new Date(details.startDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Renewal Date</label>
                                <p className="text-slate-700 mt-0.5 flex items-center">
                                    <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                    {new Date(details.endDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Admin Actions Section */}
                    <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 -rotate-12 transform scale-150 group-hover:rotate-0 transition-transform duration-700">
                            <ShieldAlert className="w-32 h-32" />
                        </div>

                        <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
                            <ShieldAlert className="w-6 h-6 text-orange-400" />
                            Admin Actions
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-300">Extend Subscription</h3>
                                <div className="flex flex-wrap gap-2">
                                    {[3, 7, 30].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setExtendDays(d)}
                                            className={cn(
                                                "px-3 py-1.5 rounded text-sm font-medium border transition-colors",
                                                extendDays === d ? "bg-indigo-600 border-indigo-400 text-white" : "border-slate-700 text-slate-400 hover:text-white"
                                            )}
                                        >
                                            +{d} Days
                                        </button>
                                    ))}
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={extendDays}
                                            onChange={(e) => setExtendDays(Number(e.target.value))}
                                            className="w-20 px-3 py-1.5 bg-slate-800 border-slate-700 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <textarea
                                    placeholder="Reason for extension (internal notes)..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 h-20"
                                />
                                <button
                                    onClick={() => setShowConfirmExtend(true)}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Apply Extension
                                </button>
                            </div>

                            <div className="space-y-4 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-300">Force Expiration</h3>
                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                        Immediately ends the current subscription period and puts the merchant into 'None' state.
                                        Use only for policy violations or manual overrides.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowConfirmExpire(true)}
                                    className="w-full py-2.5 bg-red-900/50 hover:bg-red-800 border border-red-700/50 text-red-200 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" /> Force Expire Now
                                </button>
                            </div>

                            <div className="space-y-4 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-300">{details.isActive ? 'Deactivate' : 'Activate'} Merchant</h3>
                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                        {details.isActive
                                            ? "Temporarily disable the merchant's account. This will block all API access and hide their brand from customers."
                                            : "Restore the merchant's account access. Their existing subscription status will be maintained."
                                        }
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        const action = details.isActive ? 'Deactivate' : 'Activate';
                                        if (confirm(`${action} merchant ${details.userName}?`)) {
                                            details.isActive
                                                ? deactivateMutation.mutate(Number(merchantId))
                                                : activateMutation.mutate(Number(merchantId));
                                        }
                                    }}
                                    className={cn(
                                        "w-full py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2",
                                        details.isActive
                                            ? "bg-amber-900/50 hover:bg-amber-800 border border-amber-700/50 text-amber-200"
                                            : "bg-emerald-900/50 hover:bg-emerald-800 border border-emerald-700/50 text-emerald-200"
                                    )}
                                    disabled={activateMutation.isPending || deactivateMutation.isPending}
                                >
                                    {details.isActive ? <ShieldAlert className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                    {details.isActive ? 'Deactivate Merchant' : 'Activate Merchant'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Info className="w-4 h-4 text-slate-400" />
                            Overview
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                                <span className="text-slate-500">Days Remaining</span>
                                <span className={cn("font-bold", details.daysRemaining < 0 ? "text-red-500" : "text-slate-900")}>
                                    {details.daysRemaining} Days
                                </span>
                            </div>
                            <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                                <span className="text-slate-500">Grace Status</span>
                                <span className="font-medium text-slate-900">
                                    {details.graceEndDate ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            Contact & Location
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</label>
                                <p className="text-sm font-medium text-slate-900 mt-0.5">{details.brandPhone || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</label>
                                <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{details.brandAddress || 'No address provided'}</p>
                            </div>
                            {details.lat && details.lng && (
                                <div className="pt-4 border-t border-slate-50">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GPS Coordinates</label>
                                    <p className="text-xs font-mono text-slate-500 mt-1">
                                        {details.lat.toFixed(6)}, {details.lng.toFixed(6)}
                                    </p>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${details.lat},${details.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 block text-center py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                                    >
                                        Open in Google Maps
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    <MerchantCategoriesSection merchantId={Number(merchantId)} currentCategoryIds={details.masterCategoryIds || []} />
                </div>
            </div>

            {/* Modals */}
            {
                showConfirmExtend && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Confirm Extension</h3>
                            <p className="text-slate-600 mb-6">
                                You are about to extend {details.brandName}'s subscription by <strong className="text-indigo-600">{extendDays} days</strong>.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmExtend(false)}
                                    className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleExtend}
                                    disabled={extendMutation.isPending}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
                                >
                                    {extendMutation.isPending ? 'Applying...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showConfirmExpire && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-red-50">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                                <RotateCcw className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 text-center">Danger Zone</h3>
                            <p className="text-slate-600 mb-8 text-center">
                                Are you absolutely sure you want to <strong>force expire</strong> this subscription? This will disable the merchant's active features immediately.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleForceExpire}
                                    disabled={expireMutation.isPending}
                                    className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-100 disabled:opacity-50"
                                >
                                    {expireMutation.isPending ? 'Processing...' : 'Yes, Force Expire'}
                                </button>
                                <button
                                    onClick={() => setShowConfirmExpire(false)}
                                    className="w-full py-3 text-slate-400 font-medium hover:text-slate-600 transition-colors"
                                >
                                    Nevermind, go back
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
