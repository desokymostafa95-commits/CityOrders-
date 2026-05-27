import axios from 'axios';
import { getAuth, clearAuth } from '../auth/storage';
import { router } from 'expo-router';
import { Platform } from 'react-native';

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5014/api';
const API_BASE_URL = Platform.OS === 'android'
    ? configuredApiBaseUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2')
    : configuredApiBaseUrl;

if (__DEV__) {
    console.debug('API_BASE_URL:', API_BASE_URL);
}

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
