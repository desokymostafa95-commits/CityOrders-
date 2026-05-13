import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, saveAuth, clearAuth } from './storage';
import { router } from 'expo-router';

interface AuthContextType {
    token: string | null;
    roles: string[];
    isLoading: boolean;
    signIn: (token: string, roles: string[]) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAuth();
    }, []);

    async function loadAuth() {
        try {
            const { token: storedToken, roles: storedRoles } = await getAuth();
            setToken(storedToken);
            setRoles(storedRoles);
        } catch (e) {
            console.error('Failed to load auth', e);
        } finally {
            setIsLoading(false);
        }
    }

    async function signIn(newToken: string, newRoles: string[]) {
        setToken(newToken);
        setRoles(newRoles);
        await saveAuth(newToken, newRoles);
    }

    async function signOut() {
        setToken(null);
        setRoles([]);
        await clearAuth();
        router.replace('/login');
    }

    return (
        <AuthContext.Provider value={{ token, roles, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
