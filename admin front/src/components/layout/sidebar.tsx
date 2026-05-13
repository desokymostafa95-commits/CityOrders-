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
    Megaphone
} from 'lucide-react';
import { useAuth } from '@/auth/auth-context';
import { cn } from '@/lib/utils';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: BadgeCheck, label: 'Merchant Approvals', path: '/merchant-approvals' },
    { icon: Package, label: 'Subscription Plans', path: '/subscription-plans' },
    { icon: CreditCard, label: 'Subscriptions', path: '/subscriptions' },
    { icon: Users, label: 'Payment Requests', path: '/subscription-payment-requests' },
    { icon: Activity, label: 'Audit Log', path: '/audit-log' },
    { icon: Wallet, label: 'Payment Methods', path: '/payment-methods' },
    { icon: Tags, label: 'Master Categories', path: '/categories' },
    { icon: Users, label: 'Admin Staff', path: '/staff' },
    { icon: Tags, label: 'Promo Codes', path: '/promos' },
    { icon: Megaphone, label: 'Global Chat', path: '/announcements' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar: React.FC = () => {
    const { logout } = useAuth();

    return (
        <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight">CityOrders Admin</h1>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                            isActive
                                ? "bg-primary text-white"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={logout}
                    className="flex w-full items-center px-4 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-red-900/50 hover:text-white transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
};
