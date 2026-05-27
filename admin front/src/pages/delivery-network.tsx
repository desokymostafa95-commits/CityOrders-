import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bike, Building2, CheckCircle2, CircleOff, HandCoins, Plus, RefreshCw, Route, Truck, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';

type Summary = {
    offices: number;
    activeOffices: number;
    agents: number;
    availableAgents: number;
    platformOpenAssignments: number;
    acceptedAssignments: number;
};

type Office = {
    id: number;
    name: string;
    phone?: string;
    address?: string;
    managerName: string;
    managerEmail: string;
    defaultCommissionPercent: number;
    agentCollectionCycleDays: number;
    agentCollectionMethods: string[];
    isActive: boolean;
    agentsCount: number;
    availableAgentsCount: number;
};

type Agent = {
    userId: number;
    name: string;
    email: string;
    agentType: string;
    deliveryOfficeId?: number;
    deliveryOfficeName?: string;
    phone?: string;
    vehicleType?: string;
    isActive: boolean;
    isAvailable: boolean;
    commissionPercent?: number;
};

type Assignment = {
    id: number;
    orderNumber: string;
    source: string;
    status: string;
    brandName: string;
    customerName: string;
    agentName?: string;
    deliveryOfficeName?: string;
    deliveryFeeSnapshot: number;
    platformCommissionAmount?: number;
    agentEarningAmount?: number;
    officeCommissionAmount?: number;
    collectionRecipient?: string;
    collectionStatus: string;
    collectionAmount?: number;
    collectionCycleDays?: number;
    collectionDueAt?: string;
    collectionMethod?: string;
    collectionMethods: string[];
    createdAt: string;
};

type PlatformSettings = {
    independentPlatformCommissionPercent: number;
    independentCollectionCycleDays: number;
    independentCollectionMethods: string[];
};

const copy = {
    ar: {
        title: 'شبكة التوصيل',
        subtitle: 'إدارة مكاتب الشحن والطيارين وتكليفات التوصيل.',
        addOffice: 'إضافة مكتب شحن',
        addAgent: 'إضافة طيار',
        addIndependent: 'إضافة طيار مستقل',
        offices: 'مكاتب الشحن',
        agents: 'الطيارين',
        available: 'متاحين',
        poolOrders: 'طلبات في CityOrders Pool',
        activeAssignments: 'تكليفات نشطة',
        activeOffices: 'مكاتب فعالة',
        manager: 'المشرف',
        commission: 'نسبة المكتب من التوصيل',
        platformSettings: 'إعدادات تحصيل المنصة',
        platformShare: 'نسبة المنصة من الطيار الحر',
        independentCollectionDays: 'دورة تحصيل الطيار الحر بالأيام',
        agentCollectionDays: 'دورة تحصيل طياري المكتب بالأيام',
        collectionMethods: 'طرق التحصيل',
        collection: 'التحصيل',
        collectionDue: 'موعد التحصيل',
        collectionAmount: 'مبلغ التحصيل',
        markCollected: 'تم التحصيل',
        collected: 'تم التحصيل',
        pending: 'مستحق',
        notRequired: 'غير مطلوب',
        officeAgents: 'طيارين المكتب',
        status: 'الحالة',
        active: 'فعال',
        inactive: 'متوقف',
        online: 'متاح',
        offline: 'غير متاح',
        name: 'الاسم',
        phone: 'الموبايل',
        address: 'العنوان',
        managerName: 'اسم المشرف',
        managerEmail: 'إيميل المشرف',
        password: 'كلمة المرور',
        save: 'حفظ',
        cancel: 'إلغاء',
        email: 'الإيميل',
        vehicleType: 'نوع المركبة',
        office: 'المكتب',
        assignments: 'تكليفات التوصيل',
        order: 'الأوردر',
        merchant: 'المتجر',
        customer: 'العميل',
        source: 'المصدر',
        fee: 'رسوم التوصيل',
        earnings: 'مستحقات الطيار',
        noOffices: 'لا توجد مكاتب شحن بعد.',
        noAgents: 'لا يوجد طيارين بعد.',
        noAssignments: 'لا توجد تكليفات توصيل حالية.',
        success: 'تم الحفظ بنجاح',
        updated: 'تم التحديث',
    },
    en: {
        title: 'Delivery Network',
        subtitle: 'Manage delivery offices, agents, and delivery assignments.',
        addOffice: 'Add Office',
        addAgent: 'Add Agent',
        addIndependent: 'Add Independent',
        offices: 'Delivery Offices',
        agents: 'Agents',
        available: 'Available',
        poolOrders: 'CityOrders Pool Orders',
        activeAssignments: 'Active Assignments',
        activeOffices: 'Active offices',
        manager: 'Manager',
        commission: 'Office share from delivery fee',
        platformSettings: 'Platform Collection Settings',
        platformShare: 'Platform share from independent agent',
        independentCollectionDays: 'Independent agent collection cycle days',
        agentCollectionDays: 'Office agent collection cycle days',
        collectionMethods: 'Collection methods',
        collection: 'Collection',
        collectionDue: 'Collection due',
        collectionAmount: 'Collection amount',
        markCollected: 'Mark collected',
        collected: 'Collected',
        pending: 'Pending',
        notRequired: 'Not required',
        officeAgents: 'Office agents',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        online: 'Available',
        offline: 'Unavailable',
        name: 'Name',
        phone: 'Phone',
        address: 'Address',
        managerName: 'Manager name',
        managerEmail: 'Manager email',
        password: 'Password',
        save: 'Save',
        cancel: 'Cancel',
        email: 'Email',
        vehicleType: 'Vehicle type',
        office: 'Office',
        assignments: 'Delivery Assignments',
        order: 'Order',
        merchant: 'Store',
        customer: 'Customer',
        source: 'Source',
        fee: 'Delivery fee',
        earnings: 'Agent earnings',
        noOffices: 'No delivery offices yet.',
        noAgents: 'No delivery agents yet.',
        noAssignments: 'No delivery assignments right now.',
        success: 'Saved successfully',
        updated: 'Updated',
    }
};

const formatCurrency = (value?: number, language?: string) => {
    const amount = Math.round(value ?? 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
    return language === 'ar' ? `${amount} جنيه` : `EGP ${amount}`;
};

const getErrorMessage = (error: any) => {
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    return data?.message || 'Failed';
};

const methodOptions = ['Cash', 'Instapay', 'COD'];

const formatDate = (value?: string, language?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
};

const StatCard = ({ title, value, icon: Icon, tone }: { title: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }>; tone: string }) => (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="mt-1 text-3xl font-bold text-slate-950">{value}</p>
            </div>
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-md text-white', tone)}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
    </div>
);

export const DeliveryNetworkPage: React.FC = () => {
    const { language } = useTranslation();
    const { isSystemAdmin } = useAuth();
    const text = copy[language];
    const queryClient = useQueryClient();
    const [officeModalOpen, setOfficeModalOpen] = React.useState(false);
    const [agentModalOpen, setAgentModalOpen] = React.useState(false);
    const [agentMode, setAgentMode] = React.useState<'office' | 'independent'>('office');

    const summaryQuery = useQuery({
        queryKey: ['delivery-summary'],
        queryFn: () => apiClient.get('admin/delivery/summary').then((res) => res.data as Summary),
        refetchInterval: 10000,
    });

    const officesQuery = useQuery({
        queryKey: ['delivery-offices'],
        queryFn: () => apiClient.get('admin/delivery/offices').then((res) => res.data as Office[]),
    });

    const agentsQuery = useQuery({
        queryKey: ['delivery-agents'],
        queryFn: () => apiClient.get('admin/delivery/agents').then((res) => res.data as Agent[]),
    });

    const assignmentsQuery = useQuery({
        queryKey: ['delivery-assignments'],
        queryFn: () => apiClient.get('admin/delivery/assignments').then((res) => res.data as Assignment[]),
        refetchInterval: 10000,
    });

    const platformSettingsQuery = useQuery({
        queryKey: ['delivery-platform-settings'],
        queryFn: () => apiClient.get('admin/delivery/platform-settings').then((res) => res.data as PlatformSettings),
        enabled: isSystemAdmin,
    });

    const refreshAll = () => {
        queryClient.invalidateQueries({ queryKey: ['delivery-summary'] });
        queryClient.invalidateQueries({ queryKey: ['delivery-offices'] });
        queryClient.invalidateQueries({ queryKey: ['delivery-agents'] });
        queryClient.invalidateQueries({ queryKey: ['delivery-assignments'] });
        queryClient.invalidateQueries({ queryKey: ['delivery-platform-settings'] });
    };

    const updatePlatformSettings = useMutation({
        mutationFn: (payload: unknown) => apiClient.put('admin/delivery/platform-settings', payload),
        onSuccess: () => {
            toast.success(text.updated);
            refreshAll();
        },
        onError: (error: any) => toast.error(getErrorMessage(error)),
    });

    const createOffice = useMutation({
        mutationFn: (payload: unknown) => apiClient.post('admin/delivery/offices', payload),
        onSuccess: () => {
            toast.success(text.success);
            setOfficeModalOpen(false);
            refreshAll();
        },
        onError: (error: any) => toast.error(getErrorMessage(error)),
    });

    const createAgent = useMutation({
        mutationFn: ({ payload, officeId, mode }: { payload: unknown; officeId?: number; mode: 'office' | 'independent' }) =>
            mode === 'independent'
                ? apiClient.post('admin/delivery/agents/independent', payload)
                : apiClient.post(`admin/delivery/offices/${officeId}/agents`, payload),
        onSuccess: () => {
            toast.success(text.success);
            setAgentModalOpen(false);
            refreshAll();
        },
        onError: (error: any) => toast.error(getErrorMessage(error)),
    });

    const updateAgent = useMutation({
        mutationFn: ({ userId, payload }: { userId: number; payload: unknown }) => apiClient.put(`admin/delivery/agents/${userId}`, payload),
        onSuccess: () => {
            toast.success(text.updated);
            refreshAll();
        },
        onError: (error: any) => toast.error(getErrorMessage(error)),
    });

    const collectAssignment = useMutation({
        mutationFn: ({ id, method }: { id: number; method?: string }) => apiClient.post(`admin/delivery/assignments/${id}/collect`, { method }),
        onSuccess: () => {
            toast.success(text.updated);
            refreshAll();
        },
        onError: (error: any) => toast.error(getErrorMessage(error)),
    });

    const handlePlatformSettingsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        updatePlatformSettings.mutate({
            independentPlatformCommissionPercent: Number(data.get('independentPlatformCommissionPercent') || 0),
            independentCollectionCycleDays: Number(data.get('independentCollectionCycleDays') || 7),
            independentCollectionMethods: data.getAll('independentCollectionMethods').map(String),
        });
    };

    const handleOfficeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        createOffice.mutate({
            name: data.get('name'),
            phone: data.get('phone'),
            address: data.get('address'),
            defaultCommissionPercent: Number(data.get('defaultCommissionPercent') || 0),
            agentCollectionCycleDays: Number(data.get('agentCollectionCycleDays') || 7),
            agentCollectionMethods: data.getAll('agentCollectionMethods').map(String),
            managerName: data.get('managerName'),
            managerEmail: data.get('managerEmail'),
            managerPassword: data.get('managerPassword'),
        });
    };

    const handleAgentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const officeId = Number(data.get('officeId') || officesQuery.data?.[0]?.id);
        createAgent.mutate({
            mode: agentMode,
            officeId,
            payload: {
                name: data.get('name'),
                email: data.get('email'),
                password: data.get('password'),
                phone: data.get('phone'),
                vehicleType: data.get('vehicleType'),
            },
        });
    };

    const summary = summaryQuery.data;
    const platformSettings = platformSettingsQuery.data;
    const offices = officesQuery.data ?? [];
    const agents = agentsQuery.data ?? [];
    const assignments = assignmentsQuery.data ?? [];

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-950">{text.title}</h1>
                    <p className="mt-1 text-slate-500">{text.subtitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={refreshAll} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    {isSystemAdmin && (
                        <button onClick={() => setOfficeModalOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90">
                            <Plus className="h-4 w-4" />
                            {text.addOffice}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setAgentMode('office');
                            setAgentModalOpen(true);
                        }}
                        disabled={offices.length === 0}
                        className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Bike className="h-4 w-4" />
                        {text.addAgent}
                    </button>
                    {isSystemAdmin && (
                        <button
                            onClick={() => {
                                setAgentMode('independent');
                                setAgentModalOpen(true);
                            }}
                            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <Plus className="h-4 w-4" />
                            {text.addIndependent}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StatCard title={text.offices} value={summary?.offices ?? 0} icon={Building2} tone="bg-indigo-500" />
                <StatCard title={text.available} value={`${summary?.availableAgents ?? 0}/${summary?.agents ?? 0}`} icon={Users} tone="bg-emerald-500" />
                <StatCard title={text.poolOrders} value={summary?.platformOpenAssignments ?? 0} icon={Route} tone="bg-amber-500" />
                <StatCard title={text.activeAssignments} value={summary?.acceptedAssignments ?? 0} icon={Truck} tone="bg-sky-500" />
            </div>

            {isSystemAdmin && (
                <form
                    key={platformSettings ? JSON.stringify(platformSettings) : 'platform-settings-loading'}
                    onSubmit={handlePlatformSettingsSubmit}
                    className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                            <HandCoins className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-950">{text.platformSettings}</h2>
                            <p className="text-sm text-slate-500">{text.independentCollectionDays}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <Input
                            name="independentPlatformCommissionPercent"
                            label={text.platformShare}
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={platformSettings?.independentPlatformCommissionPercent ?? 0}
                            required
                        />
                        <Input
                            name="independentCollectionCycleDays"
                            label={text.independentCollectionDays}
                            type="number"
                            min="1"
                            max="60"
                            defaultValue={platformSettings?.independentCollectionCycleDays ?? 7}
                            required
                        />
                        <MethodCheckboxes name="independentCollectionMethods" label={text.collectionMethods} selected={platformSettings?.independentCollectionMethods ?? methodOptions} />
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button type="submit" disabled={updatePlatformSettings.isPending} className="h-10 rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
                            {text.save}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-lg font-bold text-slate-950">{text.offices}</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {offices.length === 0 ? (
                            <p className="p-5 text-sm text-slate-500">{text.noOffices}</p>
                        ) : offices.map((office) => (
                            <div key={office.id} className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-slate-950">{office.name}</h3>
                                        <p className="mt-1 text-sm text-slate-500">{text.manager}: {office.managerName} ({office.managerEmail})</p>
                                        <p className="text-sm text-slate-500">{office.phone || '-'} {office.address ? `- ${office.address}` : ''}</p>
                                    </div>
                                    <span className={cn('rounded-full px-2 py-1 text-xs font-bold', office.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                                        {office.isActive ? text.active : text.inactive}
                                    </span>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-md bg-slate-50 p-3">
                                        <p className="text-slate-500">{text.commission}</p>
                                        <p className="font-bold text-slate-950">{office.defaultCommissionPercent}%</p>
                                    </div>
                                    <div className="rounded-md bg-slate-50 p-3">
                                        <p className="text-slate-500">{text.officeAgents}</p>
                                        <p className="font-bold text-slate-950">{office.availableAgentsCount}/{office.agentsCount}</p>
                                    </div>
                                    <div className="rounded-md bg-slate-50 p-3">
                                        <p className="text-slate-500">{text.agentCollectionDays}</p>
                                        <p className="font-bold text-slate-950">{office.agentCollectionCycleDays}</p>
                                    </div>
                                    <div className="rounded-md bg-slate-50 p-3">
                                        <p className="text-slate-500">{text.collectionMethods}</p>
                                        <p className="font-bold text-slate-950">{office.agentCollectionMethods.join(', ')}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-lg font-bold text-slate-950">{text.agents}</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {agents.length === 0 ? (
                            <p className="p-5 text-sm text-slate-500">{text.noAgents}</p>
                        ) : agents.map((agent) => (
                            <div key={agent.userId} className="flex items-center justify-between gap-4 p-5">
                                <div className="min-w-0">
                                    <h3 className="truncate font-bold text-slate-950">{agent.name}</h3>
                                    <p className="truncate text-sm text-slate-500">{agent.email} - {agent.deliveryOfficeName || agent.agentType}</p>
                                    <p className="text-xs text-slate-400">{agent.vehicleType || '-'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateAgent.mutate({ userId: agent.userId, payload: { isAvailable: !agent.isAvailable } })}
                                        className={cn('inline-flex h-9 items-center gap-1 rounded-md px-3 text-xs font-bold', agent.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}
                                    >
                                        {agent.isAvailable ? <CheckCircle2 className="h-4 w-4" /> : <CircleOff className="h-4 w-4" />}
                                        {agent.isAvailable ? text.online : text.offline}
                                    </button>
                                    <button
                                        onClick={() => updateAgent.mutate({ userId: agent.userId, payload: { isActive: !agent.isActive } })}
                                        className={cn('h-9 rounded-md px-3 text-xs font-bold', agent.isActive ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700')}
                                    >
                                        {agent.isActive ? text.active : text.inactive}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-lg font-bold text-slate-950">{text.assignments}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-5 py-3 text-start">{text.order}</th>
                                <th className="px-5 py-3 text-start">{text.merchant}</th>
                                <th className="px-5 py-3 text-start">{text.customer}</th>
                                <th className="px-5 py-3 text-start">{text.source}</th>
                                <th className="px-5 py-3 text-start">{text.status}</th>
                                <th className="px-5 py-3 text-start">{text.fee}</th>
                                <th className="px-5 py-3 text-start">{text.collectionAmount}</th>
                                <th className="px-5 py-3 text-start">{text.collectionDue}</th>
                                <th className="px-5 py-3 text-start">{text.earnings}</th>
                                <th className="px-5 py-3 text-start">{text.collection}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {assignments.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-5 py-6 text-center text-slate-500">{text.noAssignments}</td>
                                </tr>
                            ) : assignments.map((assignment) => (
                                <tr key={assignment.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-bold text-slate-900">#{assignment.orderNumber}</td>
                                    <td className="px-5 py-3 text-slate-600">{assignment.brandName}</td>
                                    <td className="px-5 py-3 text-slate-600">{assignment.customerName}</td>
                                    <td className="px-5 py-3 text-slate-600">{assignment.source}</td>
                                    <td className="px-5 py-3 text-slate-600">{assignment.status}</td>
                                    <td className="px-5 py-3 text-slate-900">{formatCurrency(assignment.deliveryFeeSnapshot, language)}</td>
                                    <td className="px-5 py-3 text-slate-900">{formatCurrency(assignment.collectionAmount, language)}</td>
                                    <td className="px-5 py-3 text-slate-600">{formatDate(assignment.collectionDueAt, language)}</td>
                                    <td className="px-5 py-3 text-slate-900">{formatCurrency(assignment.agentEarningAmount, language)}</td>
                                    <td className="px-5 py-3">
                                        {assignment.collectionStatus === 'Pending' ? (
                                            <button
                                                onClick={() => collectAssignment.mutate({ id: assignment.id, method: assignment.collectionMethod || assignment.collectionMethods[0] })}
                                                className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                                            >
                                                {text.markCollected}
                                            </button>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-500">
                                                {assignment.collectionStatus === 'Collected' ? text.collected : text.notRequired}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {officeModalOpen && (
                <Modal title={text.addOffice} onClose={() => setOfficeModalOpen(false)}>
                    <form onSubmit={handleOfficeSubmit} className="space-y-4">
                        <Input name="name" label={text.name} required />
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Input name="phone" label={text.phone} />
                            <Input name="defaultCommissionPercent" label={text.commission} type="number" min="0" max="100" defaultValue="0" required />
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Input name="agentCollectionCycleDays" label={text.agentCollectionDays} type="number" min="1" max="60" defaultValue="7" required />
                            <MethodCheckboxes name="agentCollectionMethods" label={text.collectionMethods} selected={methodOptions} />
                        </div>
                        <Input name="address" label={text.address} />
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Input name="managerName" label={text.managerName} required />
                            <Input name="managerEmail" label={text.managerEmail} type="email" required />
                        </div>
                        <Input name="managerPassword" label={text.password} type="password" minLength={6} required />
                        <ModalActions onCancel={() => setOfficeModalOpen(false)} submitLabel={text.save} cancelLabel={text.cancel} loading={createOffice.isPending} />
                    </form>
                </Modal>
            )}

            {agentModalOpen && (
                <Modal title={agentMode === 'independent' ? text.addIndependent : text.addAgent} onClose={() => setAgentModalOpen(false)}>
                    <form onSubmit={handleAgentSubmit} className="space-y-4">
                        {agentMode === 'office' && (
                            <div>
                                <label className="text-sm font-medium text-slate-700">{text.office}</label>
                                <select name="officeId" defaultValue={offices[0]?.id} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm">
                                    {offices.map((office) => <option key={office.id} value={office.id}>{office.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Input name="name" label={text.name} required />
                            <Input name="email" label={text.email} type="email" required />
                        </div>
                        <Input name="password" label={text.password} type="password" minLength={6} required />
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Input name="phone" label={text.phone} />
                            <Input name="vehicleType" label={text.vehicleType} />
                        </div>
                        <ModalActions onCancel={() => setAgentModalOpen(false)} submitLabel={text.save} cancelLabel={text.cancel} loading={createAgent.isPending} />
                    </form>
                </Modal>
            )}
        </div>
    );
};

const Modal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-950">{title}</h2>
                <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Close">
                    <X className="h-4 w-4" />
                </button>
            </div>
            {children}
        </div>
    </div>
);

const Input = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div>
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <input {...props} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
    </div>
);

const MethodCheckboxes = ({ name, label, selected }: { name: string; label: string; selected: string[] }) => {
    const selectedSet = new Set(selected.map((item) => item.toLowerCase()));

    return (
        <div>
            <p className="text-sm font-medium text-slate-700">{label}</p>
            <div className="mt-2 flex flex-wrap gap-2">
                {methodOptions.map((method) => (
                    <label key={method} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            name={name}
                            value={method}
                            defaultChecked={selectedSet.has(method.toLowerCase())}
                            className="accent-primary"
                        />
                        {method}
                    </label>
                ))}
            </div>
        </div>
    );
};

const ModalActions = ({ onCancel, submitLabel, cancelLabel, loading }: { onCancel: () => void; submitLabel: string; cancelLabel: string; loading?: boolean }) => (
    <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="h-10 rounded-md px-4 text-sm font-medium text-slate-600 hover:bg-slate-100">{cancelLabel}</button>
        <button type="submit" disabled={loading} className="h-10 rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">{submitLabel}</button>
    </div>
);
