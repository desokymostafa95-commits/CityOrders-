import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'merchant_auth_token';
const ROLES_KEY = 'merchant_user_roles';

export async function saveAuth(token: string, roles: string[]) {
    if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
        return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(ROLES_KEY, JSON.stringify(roles));
}

export async function getAuth() {
    if (Platform.OS === 'web') {
        const token = localStorage.getItem(TOKEN_KEY);
        const rolesStr = localStorage.getItem(ROLES_KEY);
        return {
            token,
            roles: rolesStr ? JSON.parse(rolesStr) as string[] : []
        };
    }
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const rolesStr = await SecureStore.getItemAsync(ROLES_KEY);
    return {
        token,
        roles: rolesStr ? JSON.parse(rolesStr) as string[] : []
    };
}

export async function clearAuth() {
    if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ROLES_KEY);
        return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(ROLES_KEY);
}
