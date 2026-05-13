import axios from 'axios';
import { getAuth, clearAuth } from '../auth/storage';
import { router } from 'expo-router';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5014/api';

console.log('App Initialized. API_BASE_URL:', API_BASE_URL);

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(async (config) => {
    const { token } = await getAuth();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const isLoginRequest = error.config?.url?.includes('/Auth/login');
        if (error.response?.status === 401 && !isLoginRequest) {
            await clearAuth();
            router.replace('/login');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
