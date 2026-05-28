import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { deliveryAgentsApi, DeliveryAgent } from '@/api/deliveryAgentsApi';
import { toast } from 'sonner';
import { Users, Bike, Wallet, Search, CheckCircle2, ChevronRight, X, Calendar, UserCheck } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export const DeliveryAgentsPage: React.FC = () => {
    const { language } = useTranslation();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAgent, setSelectedAgent] = useState<DeliveryAgent | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Fetch agents
    const { data: agents, isLoading } = useQuery({
        queryKey: ['delivery-agents-list'],
        queryFn: () => deliveryAgentsApi.getAgents()
    });

    // Fetch assignments for the selected agent
    const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
        queryKey: ['agent-assignments', selectedAgent?.userId],
        queryFn: () => apiClient.get(`admin/delivery/assignments?agentUserId=${selectedAgent?.userId}&collectionStatus=Pending`).then(res => res.data),
        enabled: !!selectedAgent
    });

    // Settle single assignment collection mutation
    const collectMutation = useMutation({
        mutationFn: ({ id, method }: { id: number; method?: string }) => 
            apiClient.post(`admin/delivery/assignments/${id}/collect`, { method }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delivery-agents-list'] });
            queryClient.invalidateQueries({ queryKey: ['agent-assignments', selectedAgent?.userId] });
            toast.success(language === 'ar' ? 'تم تسجيل تحصيل المبلغ بنجاح' : 'Cash collected successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data || (language === 'ar' ? 'حدث خطأ ما' : 'An error occurred'));
        }
    });

    const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

    const filteredAgents = agents?.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agent.phone && agent.phone.includes(searchTerm))
    );

    // Statistics
    const totalDues = agents?.reduce((sum, agent) => sum + agent.owedAmount, 0) || 0;
    const activeAgentsCount = agents?.filter(agent => agent.isActive).length || 0;
    const availableAgentsCount = agents?.filter(agent => agent.isActive && agent.isAvailable).length || 0;

    if (isLoading) return <div className="p-8 text-center text-slate-500">{t('جاري التحميل...', 'Loading delivery agents...')}</div>;

    return (
        <div className="space-y-8 animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-3xl font-bold">{t('الطيارين والمديونيات', 'Pilots & Dues')}</h1>
                <p className="text-slate-500 mt-1">
                    {t('متابعة مديونيات الطيارين، المبالغ المحصلة من العملاء، وتفاصيل العمليات الخاصة بكل طيار.', 'Monitor delivery agent cash collections, outstanding balances, and pilot details.')}
                </p>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Dues Card */}
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                    <div className="absolute right-4 bottom-4 opacity-15">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-wider opacity-80">{t('إجمالي المديونيات المعلقة', 'Total Outstanding Dues')}</p>
                    <h3 className="text-4xl font-extrabold mt-3">{totalDues.toLocaleString()} {t('ج.م', 'EGP')}</h3>
                    <p className="text-xs opacity-75 mt-2">{t('مبالغ نقدية COD بحوزة الطيارين تحتاج للتسوية', 'COD cash collections held by agents pending settlement')}</p>
                </div>

                {/* Active Pilots Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute right-4 bottom-4 text-slate-100">
                        <Users className="w-20 h-20" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('إجمالي الطيارين النشطين', 'Total Active Pilots')}</p>
                    <h3 className="text-4xl font-extrabold text-slate-900 mt-3">{activeAgentsCount}</h3>
                    <p className="text-xs text-slate-500 mt-2">{t('إجمالي الطيارين المسجلين في الشبكة حالياً', 'Total delivery profiles currently active')}</p>
                </div>

                {/* Available Pilots Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute right-4 bottom-4 text-slate-100">
                        <Bike className="w-20 h-20" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('الطيارين المتاحين للعمل الآن', 'Available Pilots Now')}</p>
                    <h3 className="text-4xl font-extrabold text-emerald-600 mt-3">{availableAgentsCount}</h3>
                    <p className="text-xs text-slate-500 mt-2">{t('الطيارين الفاتحين للتطبيق ومستعدين لاستلام طلبات', 'Agents online and ready to accept orders')}</p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t('البحث باسم الطيار، البريد الإلكتروني، أو الهاتف...', 'Search by pilot name, email, or phone...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-slate-800 text-sm"
                    />
                </div>
            </div>

            {/* Main Pilots Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-start">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('الطيار', 'Pilot')}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('النوع', 'Type')}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('الهاتف', 'Phone')}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('المركبة', 'Vehicle')}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('الحالة', 'Status')}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('المديونية', 'Owed Amount')}</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">{t('الإجراءات', 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredAgents?.map((agent: DeliveryAgent) => (
                            <tr key={agent.userId} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700">
                                            {agent.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{agent.name}</h4>
                                            <p className="text-xs text-slate-500">{agent.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-start">
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                                        agent.agentType === 'Independent' 
                                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    )}>
                                        {agent.agentType === 'Independent' ? t('حر مستقل', 'Independent') : t('تابع لمكتب', 'Office Agent')}
                                    </span>
                                    {agent.agentType !== 'Independent' && agent.deliveryOfficeName && (
                                        <p className="text-[11px] font-medium text-slate-500 mt-1">{agent.deliveryOfficeName}</p>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-start">{agent.phone || t('-', 'No phone')}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-start">
                                    <div className="flex items-center gap-1.5">
                                        <Bike className="w-4 h-4 text-slate-400" />
                                        <span>{agent.vehicleType || t('-', 'No vehicle')}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-start">
                                    <div className="flex flex-col gap-1">
                                        <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                            agent.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                                        }`}>
                                            {agent.isActive ? t('حساب نشط', 'Account Active') : t('حساب معطل', 'Account Disabled')}
                                        </span>
                                        {agent.isActive && (
                                            <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                agent.isAvailable ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'
                                            }`}>
                                                {agent.isAvailable ? t('متصل متاح', 'Online / Available') : t('غير متاح', 'Offline')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-start">
                                    <span className={cn(
                                        "font-bold px-2 py-1 rounded text-sm",
                                        agent.owedAmount > 0 ? "text-amber-700 bg-amber-50" : "text-slate-500 bg-slate-50"
                                    )}>
                                        {agent.owedAmount} {t('ج.م', 'EGP')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => { setSelectedAgent(agent); setIsDrawerOpen(true); }}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                                    >
                                        {t('عرض العهدة التفصيلية', 'View Details')}
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pilot Details Drawer */}
            {isDrawerOpen && selectedAgent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-end backdrop-blur-xs transition-opacity duration-300">
                    <div className="bg-white w-full max-w-2xl h-screen shadow-2xl flex flex-col p-6 animate-slide-left relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        {/* Drawer Header */}
                        <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{selectedAgent.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">{selectedAgent.email}</p>
                                {selectedAgent.deliveryOfficeName && (
                                    <p className="text-xs text-indigo-600 font-semibold mt-1">
                                        {t('مكتب التوصيل: ', 'Delivery Office: ')} {selectedAgent.deliveryOfficeName}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => { setIsDrawerOpen(false); setSelectedAgent(null); }}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto py-6 space-y-6">
                            {/* Summary Box */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-slate-500 font-semibold uppercase">{t('إجمالي المستحق للتسوية', 'Outstanding Cash Dues')}</p>
                                    <h4 className="text-2xl font-extrabold text-amber-700 mt-1">{selectedAgent.owedAmount} {t('ج.م', 'EGP')}</h4>
                                </div>
                                <div className="text-slate-400">
                                    <Wallet className="w-10 h-10" />
                                </div>
                            </div>

                            {/* Pending Assignments List */}
                            <div>
                                <h4 className="font-bold text-slate-800 mb-4">{t('الطلبات المعلقة للتحصيل', 'Pending Collections List')}</h4>
                                {isLoadingAssignments ? (
                                    <p className="text-slate-500 text-sm text-center py-4">{t('جاري تحميل الطلبات...', 'Loading assignments...')}</p>
                                ) : assignments?.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                                        <p className="text-slate-600 font-semibold text-sm">{t('لا توجد مديونيات معلقة للتحصيل على هذا الطيار!', 'No outstanding dues for this pilot!')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {assignments?.map((assignment: any) => (
                                            <div key={assignment.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center hover:border-slate-300 transition-all bg-white shadow-2xs">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900">#{assignment.orderNumber}</span>
                                                        <span className="text-xs text-slate-500">• {assignment.brandName}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>{t('تاريخ الطلب: ', 'Order Date: ')} {new Date(assignment.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                                                    </div>
                                                    <div className="text-xs font-semibold text-slate-700">
                                                        {t('المبلغ المطلوب تحصيله: ', 'Collection Amount: ')} <span className="text-amber-700 font-extrabold">{assignment.collectionAmount} {t('ج.م', 'EGP')}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(t('هل تريد تسجيل هذا الطلب كـ تم التحصيل وتصفية حسابه؟', 'Are you sure you want to mark this collection as settled?'))) {
                                                            collectMutation.mutate({ id: assignment.id });
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition-colors"
                                                >
                                                    {t('تسوية يدوية', 'Reconcile Manually')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
