import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';

let socketInstance: Socket | null = null;

const getSocketURL = () => {
    // En production : utiliser l'URL Railway depuis .env
    if (import.meta.env.PROD) {
        return import.meta.env.VITE_SOCKET_URL || window.location.origin;
    }
    // En développement
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    return `${protocol}//${hostname}:5000`;
};

export const useSocket = () => {
    const { user } = useAuthStore();
    const socketRef = useRef<Socket | null>(null);

    const connecter = useCallback(() => {
        if (!user) return;
        if (socketInstance?.connected) {
            socketRef.current = socketInstance;
            return;
        }

        const socketURL = getSocketURL();

        const socket = io(socketURL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            timeout: 10000,
        });

        socket.on('connect', () => {
            socket.emit('identifier', user._id);
            socket.emit('rejoindre_room', `livreurs_${user.ville}`);
            socket.emit('rejoindre_room', `commercants_${user.ville}`);
            socket.emit('rejoindre_room', user.role);
        });

        socket.on('identifie', (data) => {
            console.log('✅ Socket identifié:', data.message);
        });

        socket.on('nouvelle_commande', (data) => {
            toast(data.message, {
                icon: '🔔', duration: 8000,
                style: { background: '#1f2937', color: '#fff', borderRadius: '12px' },
            });
            playNotificationSound();
        });

        socket.on('nouvelle_mission', (data) => {
            toast(data.message, {
                icon: '🛵', duration: 8000,
                style: { background: '#ff7300', color: '#fff', borderRadius: '12px' },
            });
            playNotificationSound();
        });

        socket.on('mission_disponible', (data) => {
            if (user.role === 'livreur') {
                toast(data.message, {
                    icon: '📦', duration: 6000,
                    style: { background: '#3b82f6', color: '#fff', borderRadius: '12px' },
                });
                playNotificationSound('soft');
            }
        });

        socket.on('statut_commande', (data) => {
            toast(data.titre, {
                icon: data.statut === 'livree' ? '🎉' : data.statut === 'annulee' ? '❌' : '📍',
                duration: 6000,
                style: {
                    background: data.statut === 'livree' ? '#009639'
                        : data.statut === 'annulee' ? '#ef4444' : '#1f2937',
                    color: '#fff', borderRadius: '12px',
                },
            });
            if (data.statut === 'livree') playNotificationSound('success');
            else playNotificationSound('soft');
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Socket déconnecté:', reason);
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Erreur socket:', error.message);
        });

        socketInstance = socket;
        socketRef.current = socket;
    }, [user]);

    const deconnecter = useCallback(() => {
        if (socketInstance) {
            socketInstance.disconnect();
            socketInstance = null;
        }
    }, []);

    useEffect(() => {
        connecter();
    }, [user?._id]);

    return { socket: socketRef.current, connecter, deconnecter };
};

const playNotificationSound = (type: 'default' | 'soft' | 'success' = 'default') => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        if (type === 'success') {
            oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
        } else if (type === 'soft') {
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(520, audioCtx.currentTime + 0.1);
        } else {
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
        }
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) { }
};