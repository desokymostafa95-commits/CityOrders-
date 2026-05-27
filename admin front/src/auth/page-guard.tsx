import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './auth-context';
import { getFirstAllowedAdminPath } from '@/data/admin-page-permissions';

interface PageGuardProps {
    permission: string;
    children: React.ReactNode;
}

export const PageGuard: React.FC<PageGuardProps> = ({ permission, children }) => {
    const { canAccessPage, isSystemAdmin, permissions } = useAuth();

    if (!canAccessPage(permission)) {
        return <Navigate to={getFirstAllowedAdminPath(permissions, isSystemAdmin)} replace />;
    }

    return <>{children}</>;
};
