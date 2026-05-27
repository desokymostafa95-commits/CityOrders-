import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    CreditCard,
    Package,
    BadgeCheck,
    Users,
    LogOut,
    Activity,
    Wallet,
    Tags,
    ShieldCheck,
    Megaphone,
    MessageCircle,
    Globe,
    KeyRound,
    Truck
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/auth/auth-context';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';

type NavItem = {
    icon: LucideIcon;
    labelKey: string;
    path: string;
    permission?: string;
};

const navItems: NavItem[] = [
    { icon: LayoutDashboard, labelKey: 'sidebar.dashboard', path: '/dashboard', permission: 'page:dashboard' },
    { icon: BadgeCheck, labelKey: 'sidebar.merchant_approvals', path: '/merchant-approvals', permission: 'page:merchant-approvals' },
    { icon: Package, labelKey: 'sidebar.subscription_plans', path: '/subscription-plans', permission: 'page:subscription-plans' },
    { icon: CreditCard, labelKey: 'sidebar.subscriptions', path: '/subscriptions', permission: 'page:subscriptions' },
    { icon: Users, labelKey: 'sidebar.payment_requests', path: '/subscription-payment-requests', permission: 'page:subscription-payment-requests' },
    { icon: Activity, labelKey: 'sidebar.audit_log', path: '/audit-log', permission: 'page:audit-log' },
    { icon: Wallet, labelKey: 'sidebar.payment_methods', path: '/payment-methods', permission: 'page:payment-methods' },
    { icon: Tags, labelKey: 'sidebar.categories', path: '/categories', permission: 'page:categories' },
    { icon: Users, labelKey: 'sidebar.staff', path: '/staff', permission: 'page:staff' },
    { icon: ShieldCheck, labelKey: 'sidebar.roles_permissions', path: '/roles-permissions', permission: 'page:roles-permissions' },
    { icon: Tags, labelKey: 'sidebar.promos', path: '/promos', permission: 'page:promos' },
    { icon: Megaphone, labelKey: 'sidebar.announcements', path: '/announcements', permission: 'page:announcements' },
    { icon: Settings, labelKey: 'sidebar.settings', path: '/settings', permission: 'page:settings' },
    { icon: KeyRound, labelKey: 'sidebar.security', path: '/security', permission: 'page:security' },
    { icon: MessageCircle, labelKey: 'sidebar.chats', path: '/chats', permission: 'page:chats' },
    { icon: Truck, labelKey: 'sidebar.delivery_network', path: '/delivery-network', permission: 'page:delivery-network' },
];

export const Sidebar: React.FC = () => {
    const { logout, canAccessPage } = useAuth();
    const { language, setLanguage, t } = useTranslation();
    const visibleNavItems = navItems.filter((item) => item.permission ? canAccessPage(item.permission) : true);

    return (
        <aside className={cn(
            "w-64 bg-slate-900 text-white h-screen fixed top-0 flex flex-col z-20",
            language === 'ar' ? "right-0 border-l border-slate-800" : "left-0 border-r border-slate-800"
        )}>
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight">{t('sidebar.title')}</h1>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {visibleNavItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                            language === 'ar' ? "flex-row-reverse justify-end" : "",
                            isActive
                                ? "bg-primary text-white"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <item.icon className={cn("h-5 w-5", language === 'ar' ? "ml-3" : "mr-3")} />
                        <span>{t(item.labelKey)}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-2">
                    <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        Language / اللغة
                    </span>
                    <div className="flex bg-slate-800 rounded p-0.5">
                        <button
                            onClick={() => setLanguage('ar')}
                            className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-semibold transition-colors",
                                language === 'ar' ? "bg-slate-950 text-white" : "hover:text-white text-slate-400"
                            )}
                        >
                            العربية
                        </button>
                        <button
                            onClick={() => setLanguage('en')}
                            className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-semibold transition-colors",
                                language === 'en' ? "bg-slate-950 text-white" : "hover:text-white text-slate-400"
                            )}
                        >
                            EN
                        </button>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className={cn(
                        "flex w-full items-center px-4 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-red-900/50 hover:text-white transition-colors",
                        language === 'ar' ? "flex-row-reverse justify-end" : ""
                    )}
                >
                    <LogOut className={cn("h-5 w-5", language === 'ar' ? "ml-3" : "mr-3")} />
                    <span>{t('sidebar.logout')}</span>
                </button>
            </div>
        </aside>
    );
};
