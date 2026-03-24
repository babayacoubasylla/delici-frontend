import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, LogOut, MapPin, ChevronRight, Clock, Star } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { id: 'marche', label: 'Marché', icon: '🥦' },
    { id: 'supermarche', label: 'Supermarché', icon: '🛒' },
    { id: 'pharmacie', label: 'Pharmacie', icon: '💊' },
    { id: 'boulangerie', label: 'Boulangerie', icon: '🥖' },
];

export default function ClientDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [commercants, setCommercants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categorie, setCategorie] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => { fetchCommercants(); }, [categorie]);

    const fetchCommercants = async () => {
        try {
            setLoading(true);
            const params: any = { ville: user?.ville };
            if (categorie) params.categorie = categorie;
            const res = await api.get('/commercants', { params });
            setCommercants(res.data.data.commercants);
        } catch (error) {
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const commercantsFiltres = commercants.filter((c: any) =>
        c.nom_boutique.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-500">Bonjour 👋</p>
                            <h1 className="text-xl font-bold text-gray-900">{user?.prenom} {user?.nom}</h1>
                            <div className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 text-orange-500" />
                                <span className="text-xs text-gray-500">{user?.ville}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Bouton course privée */}
                            <button onClick={() => navigate('/client/courses')}
                                className="p-2 bg-blue-50 rounded-xl" title="Course privée">
                                <span className="text-xl">🛵</span>
                            </button>
                            {/* Bouton mes commandes */}
                            <button onClick={() => navigate('/client/commandes')}
                                className="p-2 bg-orange-50 rounded-xl">
                                <ShoppingBag className="w-6 h-6 text-orange-500" />
                            </button>
                            {/* Déconnexion */}
                            <button onClick={handleLogout} className="p-2 bg-gray-100 rounded-xl">
                                <LogOut className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Recherche */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un restaurant, marché..."
                            className="input-field pl-11" />
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6">

                {/* Bannière promo */}
                <div className="rounded-2xl p-5 mb-6 text-white relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #ff7300, #e65100)' }}>
                    <div className="relative z-10">
                        <p className="text-sm opacity-90 mb-1">🎉 Bienvenue sur DeliCI</p>
                        <h2 className="text-xl font-bold mb-1">Livraison rapide à {user?.ville} !</h2>
                        <p className="text-sm opacity-80">Commandez auprès des meilleurs commercants</p>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-20">🛵</div>
                </div>

                {/* Bannière course privée */}
                <button onClick={() => navigate('/client/courses')}
                    className="w-full rounded-2xl p-4 mb-6 text-white flex items-center justify-between"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                    <div className="text-left">
                        <p className="font-bold text-lg">🛵 Course privée</p>
                        <p className="text-sm opacity-90">Envoyez un colis ou faites une commission</p>
                    </div>
                    <ChevronRight className="w-6 h-6 opacity-80" />
                </button>

                {/* Catégories */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Catégories</h2>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        <button onClick={() => setCategorie('')}
                            className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all ${categorie === '' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'}`}>
                            <span className="text-2xl">🌟</span>
                            <span className="text-xs font-semibold text-gray-700">Tous</span>
                        </button>
                        {CATEGORIES.map((cat) => (
                            <button key={cat.id} onClick={() => setCategorie(cat.id)}
                                className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all ${categorie === cat.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'}`}>
                                <span className="text-2xl">{cat.icon}</span>
                                <span className="text-xs font-semibold text-gray-700">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Liste commercants */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">
                        {categorie ? CATEGORIES.find(c => c.id === categorie)?.label : 'Tous les commercants'}
                        <span className="text-sm font-normal text-gray-500 ml-2">({commercantsFiltres.length})</span>
                    </h2>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="card animate-pulse">
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 bg-gray-200 rounded-xl" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-2/3" />
                                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                                            <div className="h-3 bg-gray-200 rounded w-1/3" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : commercantsFiltres.length === 0 ? (
                        <div className="text-center py-12 card">
                            <span className="text-5xl">🏪</span>
                            <p className="text-gray-500 mt-3">Aucun commerce disponible</p>
                            <p className="text-sm text-gray-400 mt-1">Revenez bientôt !</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {commercantsFiltres.map((c: any) => (
                                <button key={c._id}
                                    onClick={() => navigate(`/client/commerce/${c._id}`)}
                                    className="card w-full text-left hover:shadow-md transition-all hover:scale-[1.01]">
                                    <div className="flex items-start gap-4">
                                        <div className="w-20 h-20 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 text-3xl">
                                            {CATEGORIES.find(cat => cat.id === c.categorie)?.icon || '🏪'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <h3 className="font-bold text-gray-900 truncate">{c.nom_boutique}</h3>
                                                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                                            </div>
                                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                                                {c.description || c.adresse?.quartier}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                <span className={`badge ${c.est_ouvert ? 'badge-green' : 'badge-red'}`}>
                                                    {c.est_ouvert ? '🟢 Ouvert' : '🔴 Fermé'}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                    {c.note_moyenne}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Clock className="w-3 h-3" />
                                                    {c.temps_preparation_moyen} min
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {c.frais_livraison} FCFA livraison
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}