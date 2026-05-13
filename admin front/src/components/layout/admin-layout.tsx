import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';

export const AdminLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <main className="pl-64">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
