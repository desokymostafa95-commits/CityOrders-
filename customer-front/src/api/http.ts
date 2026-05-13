import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5014/api';

console.log('API Base URL:', API_URL);

// Helper functions to handle token storage across platforms
export const getToken = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
        return localStorage.getItem('customerToken');
    }
    return SecureStore.getItemAsync('customerToken');
};

export const setToken = async (token: string): Promise<void> => {
    if (Platform.OS === 'web') {
        localStorage.setItem('customerToken', token);
    } else {
        await SecureStore.setItemAsync('customerToken', token);
    }
};

export const removeToken = async (): Promise<void> => {
    if (Platform.OS === 'web') {
        localStorage.removeItem('customerToken');
    } else {
        await SecureStore.deleteItemAsync('customerToken');
    }
};

const http = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

http.interceptors.request.use(async (config) => {
    try {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        console.warn('Error getting token:', e);
    }
    return config;
});

http.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await removeToken();
            router.replace('/(auth)/login');
        }
        return Promise.reject(error);
    }
);

export const resolveImageUrl = (path?: string) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    const base = API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
    return `${base}/${path.replace(/^\//, '')}`;
};

export default http;
