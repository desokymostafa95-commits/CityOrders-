import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '@/api/client';

interface User {
    id: string;
    email: string;
    role: string[];
}

interface AuthContextType {
    user: User | null;
    login: (token: string) => Promise<void>;
    logout: () => void;
    refreshPermissions: () => Promise<void>;
    canAccessPage: (permission: string) => boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSystemAdmin: boolean;
    isLoading: boolean;
    isPermissionsLoading: boolean;
    permissions: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const nameIdClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const emailClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';

function decodeUser(token: string): User {
    const decoded: any = jwtDecode(token);
    const role = decoded[roleClaim] || decoded.role || [];

    return {
        id: decoded[nameIdClaim] || decoded.nameid || decoded.sub,
        email: decoded[emailClaim] || decoded.email || decoded.unique_name,
        role: Array.isArray(role) ? role : [role],
    };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isSystemAdmin, setIsSystemAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPermissionsLoading, setIsPermissionsLoading] = useState(false);

    const refreshPermissions = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            setPermissions([]);
            setIsSystemAdmin(false);
            return;
        }

        setIsPermissionsLoading(true);
        try {
            const response = await apiClient.get<{
                isSystemAdmin: boolean;
                permissions: string[];
            }>('adminusers/me/permissions');

            setIsSystemAdmin(response.data.isSystemAdmin);
            setPermissions(response.data.permissions || []);
        } catch (error) {
            console.error('Failed to load admin permissions', error);
            setPermissions([]);
            setIsSystemAdmin(false);
        } finally {
            setIsPermissionsLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('admin_token');
            if (token) {
                try {
                    setUser(decodeUser(token));
                    await refreshPermissions();
                } catch (error) {
                    console.error('Failed to decode token', error);
                    localStorage.removeItem('admin_token');
                }
            }
            setIsLoading(false);
        };

        void init();
    }, []);

    const login = async (token: string) => {
        localStorage.setItem('admin_token', token);
        setUser(decodeUser(token));
        await refreshPermissions();
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        setUser(null);
        setPermissions([]);
        setIsSystemAdmin(false);
        window.location.href = '/login';
    };

    const canAccessPage = (permission: string) => {
        return isSystemAdmin || permissions.includes('page:*') || permissions.includes(permission);
    };

    const isAdmin = !!user && (user.role.includes('Admin') || isSystemAdmin || permissions.length > 0);

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                refreshPermissions,
                canAccessPage,
                isAuthenticated: !!user,
                isAdmin,
                isSystemAdmin,
                isLoading,
                isPermissionsLoading,
                permissions,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
