import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Clock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUT_COLORS: Record<string, string> = {
    en_attente: 'badge-orange', acceptee: 'badge-blue',
    en_preparation: 'badge-blue', prete: 'badge-green',
    livreur_assigne: 'badge-blue', en_collecte: 'badge-blue',
    en_livraison: 'badge-blue', livree: 'badge-green', annulee: 'badge-red',
};

const STATUT_LABELS: Record<string, string> = {
    en_attente: '⏳ En attente', acceptee: '✅ Acceptée',
    en_preparation: '👨‍🍳 En préparation', prete: '📦 Prête',
    livreur_assigne: '🛵 Livreur assigné', en_collecte: '🏃 En collecte',
    en_livraison: '🛵 En livraison', livree: '✅ Livrée', annulee: '❌ Annulée',
};

export default function MesCommandesPage() {
    const navigate = useNavigate();
    const [commandes, setCommandes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtre, setFiltre] = useState('');

    useEffect(() => { fetchCommandes(); }, [filtre]);

    const fetchCommandes = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filtre) params.statut = filtre;
            const res = await api.get('/commandes/mes-commandes', { params });
            setCommandes(res.data.data.commandes);
        } catch (error) {
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm sticky top-0 z-10 border-b-4 border-orange-500">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate('/client')} className="p-2 bg-gray-100 rounded-xl">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Mes commandes</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Filtres */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                    {[
                        { key: '', label: 'Toutes' },
                        { key: 'en_livraison', label: '🛵 En cours' },
                        { key: 'livree', label: '✅ Livrées' },
                        { key: 'annulee', label: '❌ Annulées' },
                    ].map(f => (
                        <button key={f.key} onClick={() => setFiltre(f.key)}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${filtre === f.key ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 bg-white text-gray-600'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-24 bg-gray-200" />)}
                    </div>
                ) : commandes.length === 0 ? (
                    <div className="text-center py-16 card">
                        <span className="text-5xl">📋</span>
                        <p className="text-gray-500 mt-3 font-semibold">Aucune commande</p>
                        <button onClick={() => navigate('/client')}
                            className="mt-4 px-6 py-2 rounded-xl text-white font-semibold"
                            style={{ background: '#ff7300' }}>
                            Commander maintenant
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {commandes.map((cmd: any) => (
                            <button key={cmd._id} onClick={() => navigate(`/client/commandes/${cmd._id}`)}
                                className="card w-full text-left hover:shadow-md transition-all hover:scale-[1.01]">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="font-bold text-gray-900">{cmd.reference}</p>
                                        <p className="text-sm text-gray-500">{cmd.commercant?.nom_boutique}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`badge ${STATUT_COLORS[cmd.statut] || 'badge-gray'}`}>
                                            {STATUT_LABELS[cmd.statut] || cmd.statut}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(cmd.createdAt).toLocaleDateString('fr-FR')}
                                    </span>
                                    <span className="font-bold" style={{ color: '#ff7300' }}>
                                        {cmd.montants?.total?.toLocaleString()} FCFA
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}