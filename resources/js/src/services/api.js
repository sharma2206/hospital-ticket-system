import axios from 'axios';
import toast from 'react-hot-toast';

const getBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/public')) {
        return window.location.pathname.substring(0, window.location.pathname.indexOf('/public') + 7) + '/api';
    }
    return '/api';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Response interceptor — handle 401 and show errors
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            window.location.href = '/login';
        }
        const message = error.response?.data?.message || error.response?.data?.error || 'An error occurred';
        if (error.response?.status !== 422) { // Don't toast validation errors
            toast.error(message);
        }
        return Promise.reject(error);
    }
);

export default api;
