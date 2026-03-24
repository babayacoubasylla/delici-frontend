import axios from 'axios';

const getBaseURL = () => {
    // En production : utiliser l'URL Railway
    if (import.meta.env.PROD) {
        return import.meta.env.VITE_API_URL || '/api';
    }
    // En développement : proxy Vite
    return '/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur requête
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('delici_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Intercepteur réponse
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('delici_token');
            localStorage.removeItem('delici_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;