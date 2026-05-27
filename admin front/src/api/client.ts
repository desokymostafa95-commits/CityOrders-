import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5014/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (import.meta.env.DEV) {
        console.debug(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => {
        if (import.meta.env.DEV) {
            console.debug(`[API Response] ${response.status} ${response.config.url}`);
        }
        return response;
    },
    (error) => {
        console.error(`[API Error] ${error.config?.url}:`, error.message, error.response?.data || '');
        if (error.response?.status === 401) {
            localStorage.removeItem('admin_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
