import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Star, ShoppingCart, Plus, Minus, MapPin } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Produit {
    _id: string;
    nom: string;
    description: string;
    prix: number;
    categorie: string;
    disponible: boolean;
    photo?: string;
}

interface PanierItem {
    produit: Produit;
    quantite: number;
}

export default function CommercePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [commercant, setCommercant] = useState<any>(null);
    const [produits, setProduits] = useState<Produit[]>([]);
    const [loading, setLoading] = useState(true);
    const [panier, setPanier] = useState<PanierItem[]>([]);
    const [categorieActive, setCategorieActive] = useState('');
    const [showPanier, setShowPanier] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [commerceRes, produitsRes] = await Promise.all([
                api.get(`/commercants/${id}`),
                api.get(`/produits/commercant/${id}`)
            ]);
            setCommercant(commerceRes.data.data.commercant);
            setProduits(produitsRes.data.data.produits);
        } catch (error) {
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const categories = [...new Set(produits.map(p => p.categorie))];

    const produitsFiltres = produits.filter(p =>
        p.disponible && (categorieActive === '' || p.categorie === categorieActive)
    );

    const ajouterAuPanier = (produit: Produit) => {
        setPanier(prev => {
            const existant = prev.find(i => i.produit._id === produit._id);
            if (existant) {
                return prev.map(i => i.produit._id === produit._id
                    ? { ...i, quantite: i.quantite + 1 } : i);
            }
            return [...prev, { produit, quantite: 1 }];
        });
        toast.success(`${produit.nom} ajouté !`, { duration: 1000 });
    };

    const retirerDuPanier = (produitId: string) => {
        setPanier(prev => {
            const existant = prev.find(i => i.produit._id === produitId);
            if (existant && existant.quantite > 1) {
                return prev.map(i => i.produit._id === produitId
                    ? { ...i, quantite: i.quantite - 1 } : i);
            }
            return prev.filter(i => i.produit._id !== produitId);
        });
    };

    const getQuantite = (produitId: string) => {
        return panier.find(i => i.produit._id === produitId)?.quantite || 0;
    };

    const totalPanier = panier.reduce((acc, i) => acc + i.produit.prix * i.quantite, 0);
    const nbArticles = panier.reduce((acc, i) => acc + i.quantite, 0);

    const allerAuPanier = () => {
        if (panier.length === 0) {
            toast.error('Votre panier est vide');
            return;
        }
        if (commercant && totalPanier < commercant.commande_minimum) {
            toast.error(`Minimum de commande : ${commercant.commande_minimum} FCFA`);
            return;
        }
        // Stocker le panier et le commercant dans localStorage
        localStorage.setItem('delici_panier', JSON.stringify(panier));
        localStorage.setItem('delici_commercant', JSON.stringify(commercant));
        navigate('/client/panier');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!commercant) return null;

    const EMOJI_CATEGORIES: Record<string, string> = {
        restaurant: '🍽️', marche: '🥦', supermarche: '🛒',
        pharmacie: '💊', boulangerie: '🥖', autre: '🏪'
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate('/client')}
                        className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-gray-900 truncate">{commercant.nom_boutique}</h1>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                {commercant.note_moyenne}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {commercant.temps_preparation_moyen} min
                            </span>
                            <span className={`badge ${commercant.est_ouvert ? 'badge-green' : 'badge-red'}`}>
                                {commercant.est_ouvert ? 'Ouvert' : 'Fermé'}
                            </span>
                        </div>
                    </div>
                    {nbArticles > 0 && (
                        <button onClick={() => setShowPanier(!showPanier)}
                            className="relative p-2 rounded-xl text-white"
                            style={{ background: '#ff7300' }}>
                            <ShoppingCart className="w-6 h-6" />
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-xs flex items-center justify-center font-bold">
                                {nbArticles}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-4">
                {/* Infos commerce */}
                <div className="card mb-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-orange-100 flex items-center justify-center text-3xl flex-shrink-0">
                        {EMOJI_CATEGORIES[commercant.categorie] || '🏪'}
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">{commercant.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{commercant.adresse?.quartier}, {commercant.ville}</span>
                            <span>•</span>
                            <span>Livraison {commercant.frais_livraison} FCFA</span>
                            <span>•</span>
                            <span>Min. {commercant.commande_minimum?.toLocaleString()} FCFA</span>
                        </div>
                    </div>
                </div>

                {/* Catégories */}
                {categories.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                        <button onClick={() => setCategorieActive('')}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${categorieActive === '' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 bg-white text-gray-600'}`}>
                            Tout
                        </button>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setCategorieActive(cat)}
                                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${categorieActive === cat ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 bg-white text-gray-600'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Produits */}
                {!commercant.est_ouvert && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 text-center">
                        🔴 Ce commerce est actuellement fermé — vous ne pouvez pas commander
                    </div>
                )}

                <div className="space-y-3">
                    {produitsFiltres.length === 0 ? (
                        <div className="text-center py-12 card">
                            <span className="text-4xl">🍽️</span>
                            <p className="text-gray-500 mt-3">Aucun produit disponible</p>
                        </div>
                    ) : (
                        produitsFiltres.map((produit) => {
                            const qte = getQuantite(produit._id);
                            return (
                                <div key={produit._id} className="card flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-xl bg-orange-50 flex items-center justify-center text-3xl flex-shrink-0">
                                        🍽️
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900">{produit.nom}</p>
                                        <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{produit.description}</p>
                                        <p className="font-bold mt-1" style={{ color: '#ff7300' }}>
                                            {produit.prix.toLocaleString()} FCFA
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {commercant.est_ouvert && (
                                            qte === 0 ? (
                                                <button onClick={() => ajouterAuPanier(produit)}
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
                                                    style={{ background: '#ff7300' }}>
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => retirerDuPanier(produit._id)}
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                                                        style={{ background: '#e65100' }}>
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-6 text-center font-bold text-gray-900">{qte}</span>
                                                    <button onClick={() => ajouterAuPanier(produit)}
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                                                        style={{ background: '#ff7300' }}>
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Bouton panier fixe en bas */}
            {panier.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg z-20">
                    <div className="max-w-2xl mx-auto">
                        <button onClick={allerAuPanier}
                            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:scale-[1.02] active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #ff7300, #e65100)', boxShadow: '0 6px 20px rgba(255,115,0,0.35)' }}>
                            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-xl text-sm">
                                {nbArticles} article{nbArticles > 1 ? 's' : ''}
                            </span>
                            <span>Voir mon panier</span>
                            <span>{totalPanier.toLocaleString()} FCFA</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}