import { create } from 'zustand';
import api from '../services/api';

interface User {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
    email?: string;
    role: 'client' | 'livreur' | 'commercant' | 'gerant_zone' | 'admin';
    ville: string;
    statut: string;
    photo?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    login: (telephone: string, password: string) => Promise<boolean>;
    inscription: (data: any) => Promise<boolean>;
    logout: () => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: JSON.parse(localStorage.getItem('delici_user') || 'null'),
    token: localStorage.getItem('delici_token'),
    loading: false,
    error: null,

    login: async (telephone, password) => {
        set({ loading: true, error: null });
        try {
            const res = await api.post('/auth/connexion', { telephone, password });
            const { token, user } = res.data.data;
            localStorage.setItem('delici_token', token);
            localStorage.setItem('delici_user', JSON.stringify(user));
            set({ user, token, loading: false });
            return true;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erreur de connexion';
            set({ error: message, loading: false });
            return false;
        }
    },

    inscription: async (data) => {
        set({ loading: true, error: null });
        try {
            const res = await api.post('/auth/inscription', data);
            const { token, user } = res.data.data;
            localStorage.setItem('delici_token', token);
            localStorage.setItem('delici_user', JSON.stringify(user));
            set({ user, token, loading: false });
            return true;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erreur lors de l\'inscription';
            set({ error: message, loading: false });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('delici_token');
        localStorage.removeItem('delici_user');
        set({ user: null, token: null });
    },

    clearError: () => set({ error: null }),
}));