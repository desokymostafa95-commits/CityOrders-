import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth-context';

export const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isAdmin, isLoading, isPermissionsLoading } = useAuth();

    if (isLoading || isPermissionsLoading) {
        return <div>Loading...</div>; // Replace with a proper loader later
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p>You do not have permission to access the admin dashboard.</p>
                <button
                    onClick={() => window.location.href = '/login'}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    return <Outlet />;
};
