import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { useTranslation } from '@/context/LanguageContext';

export const AdminLayout: React.FC = () => {
    const { language } = useTranslation();

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <main className={language === 'ar' ? 'pr-64' : 'pl-64'}>
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
