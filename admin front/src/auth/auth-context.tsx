import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: string;
    email: string;
    role: string[];
}

interface AuthContextType {
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                // Map common JWT claims or custom claims
                const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || [];
                setUser({
                    id: decoded.nameid || decoded.sub,
                    email: decoded.email || decoded.unique_name,
                    role: Array.isArray(role) ? role : [role],
                });
            } catch (error) {
                console.error('Failed to decode token', error);
                localStorage.removeItem('admin_token');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (token: string) => {
        localStorage.setItem('admin_token', token);
        const decoded: any = jwtDecode(token);
        const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || [];
        setUser({
            id: decoded.nameid || decoded.sub,
            email: decoded.email || decoded.unique_name,
            role: Array.isArray(role) ? role : [role],
        });
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        setUser(null);
        window.location.href = '/login';
    };

    const isAdmin = user?.role.includes('Admin') || false;

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isAdmin, isLoading }}>
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
