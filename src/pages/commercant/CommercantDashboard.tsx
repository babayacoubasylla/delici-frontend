import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, ShoppingBag, TrendingUp, Clock, ToggleLeft, ToggleRight, Plus, X, Loader, Edit } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES_COMMERCE = [
    { id: 'restaurant', label: 'Restaurant / Maquis', icon: '🍽️' },
    { id: 'pharmacie', label: 'Pharmacie', icon: '💊' },
    { id: 'supermarche', label: 'Supermarché / Épicerie', icon: '🛒' },
    { id: 'boulangerie', label: 'Boulangerie / Pâtisserie', icon: '🥖' },
    { id: 'marche', label: 'Marché / Légumes', icon: '🥦' },
    { id: 'telephonie', label: 'Téléphonie / Électronique', icon: '📱' },
    { id: 'beaute', label: 'Coiffure / Beauté', icon: '💇' },
    { id: 'autre', label: 'Autre', icon: '🏪' },
];

const CATEGORIES_PRODUITS: Record<string, string[]> = {
    restaurant: ['Plats locaux', 'Grillades', 'Soupes', 'Boissons', 'Desserts', 'Autre'],
    pharmacie: ['Médicaments', 'Vitamines', 'Hygiène', 'Matériel médical', 'Cosmétiques', 'Autre'],
    supermarche: ['Alimentation', 'Boissons', 'Hygiène', 'Entretien', 'Épicerie', 'Autre'],
    boulangerie: ['Pain', 'Viennoiseries', 'Pâtisseries', 'Gâteaux', 'Boissons', 'Autre'],
    marche: ['Légumes', 'Fruits', 'Épices', 'Condiments', 'Céréales', 'Autre'],
    telephonie: ['Téléphones', 'Accessoires', 'Crédit', 'Réparation', 'Électronique', 'Autre'],
    beaute: ['Coiffure', 'Soins visage', 'Soins corps', 'Parfums', 'Maquillage', 'Autre'],
    autre: ['Produits', 'Services', 'Autre'],
};

const STATUT_COLORS: Record<string, string> = {
    en_attente: 'badge-orange', acceptee: 'badge-blue',
    en_preparation: 'badge-blue', prete: 'badge-green',
    livreur_assigne: 'badge-blue', en_livraison: 'badge-blue',
    livree: 'badge-green', annulee: 'badge-red',
};

const STATUT_LABELS: Record<string, string> = {
    en_attente: '⏳ En attente', acceptee: '✅ Acceptée',
    en_preparation: '👨‍🍳 En préparation', prete: '📦 Prête',
    livreur_assigne: '🛵 Livreur assigné', en_livraison: '🛵 En livraison',
    livree: '✅ Livrée', annulee: '❌ Annulée',
};

// Formulaire ajout/modif produit
const FormulaireProduit = ({ commerce, produit, onClose, onSuccess }: any) => {
    const categories = CATEGORIES_PRODUITS[commerce?.categorie] || CATEGORIES_PRODUITS.autre;
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        nom: produit?.nom || '',
        description: produit?.description || '',
        prix: produit?.prix || '',
        categorie: produit?.categorie || categories[0],
        disponible: produit?.disponible ?? true,
    });

    const update = (field: string, val: any) => setForm(prev => ({ ...prev, [field]: val }));

    const sauvegarder = async () => {
        if (!form.nom || !form.prix) { toast.error('Nom et prix obligatoires'); return; }
        try {
            setLoading(true);
            if (produit) {
                await api.patch(`/produits/${produit._id}`, form);
                toast.success('Produit modifié !');
            } else {
                await api.post('/produits', { ...form, commercant_id: commerce._id });
                toast.success('Produit ajouté !');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">{produit ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nom du produit *</label>
                        <input value={form.nom} onChange={e => update('nom', e.target.value)}
                            className="input-field" placeholder="Ex: Attiéké poisson, Paracétamol..." />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                        <textarea value={form.description} onChange={e => update('description', e.target.value)}
                            className="input-field resize-none" rows={2}
                            placeholder="Décrivez le produit..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Prix (FCFA) *</label>
                            <input type="number" value={form.prix} onChange={e => update('prix', e.target.value)}
                                className="input-field" placeholder="1500" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Catégorie</label>
                            <select value={form.categorie} onChange={e => update('categorie', e.target.value)}
                                className="input-field">
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-semibold text-gray-700">Disponible</span>
                        <button onClick={() => update('disponible', !form.disponible)}
                            className="flex items-center gap-2 text-sm font-semibold"
                            style={{ color: form.disponible ? '#009639' : '#6b7280' }}>
                            {form.disponible ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                            {form.disponible ? 'Oui' : 'Non'}
                        </button>
                    </div>
                    <button onClick={sauvegarder} disabled={loading}
                        className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, #ff7300, #e65100)' }}>
                        {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : produit ? '✅ Modifier' : '➕ Ajouter'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function CommercantDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [commerce, setCommerce] = useState<any>(null);
    const [commandes, setCommandes] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [produits, setProduits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [onglet, setOnglet] = useState<'commandes' | 'produits' | 'stats'>('commandes');
    const [togglingOuverture, setTogglingOuverture] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showFormProduit, setShowFormProduit] = useState(false);
    const [produitEdite, setProduitEdite] = useState<any>(null);
    const [showCreerCommerce, setShowCreerCommerce] = useState(false);
    const [erreurValidation, setErreurValidation] = useState(false);
    const [formCommerce, setFormCommerce] = useState({
        nom_boutique: '', categorie: 'restaurant', description: '',
        quartier: '', telephone: '', frais_livraison: '500',
        temps_preparation_moyen: '20', commande_minimum: '1000',
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setErreurValidation(false);

            // ✅ Route correcte : /commercants/mon-commerce/details
            const commerceRes = await api.get('/commercants/mon-commerce/details').catch((err) => {
                if (err.response?.status === 404) setShowCreerCommerce(true);
                return null;
            });

            if (!commerceRes) return;

            const commercant = commerceRes.data.data.commercant;
            setCommerce(commercant);

            // Stats depuis les champs du commerce (pas de route /stats/commercant)
            setStats({
                total_commandes: commercant.total_commandes ?? 0,
                livrees: commercant.total_commandes ?? 0,
                chiffre_affaires: commercant.chiffre_affaires ?? 0,
            });

            // ✅ Route correcte : /commandes/commerce/liste
            const commandesRes = await api.get('/commandes/commerce/liste').catch(() => ({
                data: { data: { commandes: [] } }
            }));
            setCommandes(commandesRes.data.data.commandes ?? []);

            // Produits
            const produitsRes = await api.get(`/produits/commercant/${commercant._id}`).catch(() => ({
                data: { data: { produits: [] } }
            }));
            setProduits(produitsRes.data.data.produits ?? []);

        } catch (error: any) {
            console.error('Erreur fetchData:', error);
        } finally {
            setLoading(false);
        }
    };

    const creerCommerce = async () => {
        if (!formCommerce.nom_boutique) { toast.error('Nom obligatoire'); return; }
        try {
            await api.post('/commercants/mon-commerce/creer', {
                ...formCommerce,
                adresse: { quartier: formCommerce.quartier },
                telephone: formCommerce.telephone || user?.telephone,
                frais_livraison: parseInt(formCommerce.frais_livraison),
                temps_preparation_moyen: parseInt(formCommerce.temps_preparation_moyen),
                commande_minimum: parseInt(formCommerce.commande_minimum),
                ville: user?.ville,
            });
            toast.success('Commerce créé ! 🎉 En attente de validation admin.');
            setShowCreerCommerce(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur');
        }
    };

    const toggleOuverture = async () => {
        try {
            setTogglingOuverture(true);
            const res = await api.patch('/commercants/mon-commerce/ouverture');
            setCommerce((prev: any) => ({ ...prev, est_ouvert: res.data.data.est_ouvert }));
            toast.success(res.data.message);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Erreur';
            // ✅ Message clair si le commerce n'est pas encore validé
            if (error.response?.status === 403) {
                toast.error('⚠️ Votre commerce doit être validé par un admin avant ouverture.');
            } else {
                toast.error(msg);
            }
        } finally {
            setTogglingOuverture(false);
        }
    };

    const changerStatut = async (commandeId: string, statut: string) => {
        setActionLoading(commandeId);
        try {
            const res = await api.patch(`/commandes/commerce/${commandeId}/statut`, { statut });
            toast.success(res.data.message);
            fetchData();
        } catch (error) {
            toast.error('Erreur');
        } finally { setActionLoading(null); }
    };

    const supprimerProduit = async (produitId: string) => {
        try {
            await api.delete(`/produits/${produitId}`);
            toast.success('Produit supprimé');
            fetchData();
        } catch (error) {
            toast.error('Erreur');
        }
    };

    const categorieCommerce = CATEGORIES_COMMERCE.find(c => c.id === commerce?.categorie);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    // ✅ Commerce en attente de validation admin
    if (commerce && commerce.statut === 'en_attente') return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-sm">
                <p className="text-5xl mb-4">⏳</p>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Commerce en attente de validation</h1>
                <p className="text-gray-500 text-sm mb-6">
                    Votre commerce <strong>{commerce.nom_boutique}</strong> a été créé avec succès.
                    Un administrateur doit le valider avant que vous puissiez ouvrir.
                </p>
                <button onClick={() => { logout(); navigate('/login'); }}
                    className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-100 rounded-xl text-gray-600 text-sm font-semibold">
                    <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
            </div>
        </div>
    );

    // Formulaire création commerce
    if (showCreerCommerce) return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-lg mx-auto pt-8">
                <div className="text-center mb-6">
                    <p className="text-4xl mb-3">🏪</p>
                    <h1 className="text-2xl font-bold text-gray-900">Créez votre commerce</h1>
                    <p className="text-gray-500 text-sm mt-1">Rejoignez DeliCI et commencez à vendre !</p>
                </div>
                <div className="card space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nom du commerce *</label>
                        <input value={formCommerce.nom_boutique}
                            onChange={e => setFormCommerce(p => ({ ...p, nom_boutique: e.target.value }))}
                            className="input-field" placeholder="Maquis Chez Adjoua..." />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Type de commerce *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES_COMMERCE.map(cat => (
                                <button key={cat.id} onClick={() => setFormCommerce(p => ({ ...p, categorie: cat.id }))}
                                    className="p-3 border-2 rounded-xl text-left transition-all"
                                    style={{
                                        borderColor: formCommerce.categorie === cat.id ? '#ff7300' : '#e5e7eb',
                                        background: formCommerce.categorie === cat.id ? '#fff8f0' : 'white'
                                    }}>
                                    <span className="text-xl">{cat.icon}</span>
                                    <p className="text-xs font-semibold text-gray-700 mt-1">{cat.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                        <textarea value={formCommerce.description}
                            onChange={e => setFormCommerce(p => ({ ...p, description: e.target.value }))}
                            className="input-field resize-none" rows={2} placeholder="Décrivez votre commerce..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Quartier</label>
                            <input value={formCommerce.quartier}
                                onChange={e => setFormCommerce(p => ({ ...p, quartier: e.target.value }))}
                                className="input-field" placeholder="Centre-ville..." />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone</label>
                            <input value={formCommerce.telephone}
                                onChange={e => setFormCommerce(p => ({ ...p, telephone: e.target.value }))}
                                className="input-field" placeholder="0700000000" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Frais livraison</label>
                            <input type="number" value={formCommerce.frais_livraison}
                                onChange={e => setFormCommerce(p => ({ ...p, frais_livraison: e.target.value }))}
                                className="input-field text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Temps prépa</label>
                            <input type="number" value={formCommerce.temps_preparation_moyen}
                                onChange={e => setFormCommerce(p => ({ ...p, temps_preparation_moyen: e.target.value }))}
                                className="input-field text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Min commande</label>
                            <input type="number" value={formCommerce.commande_minimum}
                                onChange={e => setFormCommerce(p => ({ ...p, commande_minimum: e.target.value }))}
                                className="input-field text-sm" />
                        </div>
                    </div>
                    <button onClick={creerCommerce}
                        className="w-full py-4 rounded-xl text-white font-bold text-lg"
                        style={{ background: 'linear-gradient(135deg, #ff7300, #e65100)' }}>
                        🚀 Créer mon commerce
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {(showFormProduit || produitEdite) && (
                <FormulaireProduit
                    commerce={commerce}
                    produit={produitEdite}
                    onClose={() => { setShowFormProduit(false); setProduitEdite(null); }}
                    onSuccess={fetchData}
                />
            )}

            <header className="bg-white shadow-sm sticky top-0 z-10 border-b-4 border-orange-500">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Mon commerce {categorieCommerce?.icon}</p>
                            <h1 className="text-xl font-bold text-gray-900">{commerce?.nom_boutique}</h1>
                            <span className={`badge ${commerce?.est_ouvert ? 'badge-green' : 'badge-red'} mt-1`}>
                                {commerce?.est_ouvert ? '🟢 Ouvert' : '🔴 Fermé'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* ✅ Bouton désactivé si non validé */}
                            <button
                                onClick={toggleOuverture}
                                disabled={togglingOuverture || commerce?.statut !== 'actif' || !commerce?.est_valide}
                                title={commerce?.statut !== 'actif' ? 'En attente de validation admin' : ''}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{
                                    borderColor: commerce?.est_ouvert ? '#009639' : '#ff7300',
                                    color: commerce?.est_ouvert ? '#009639' : '#ff7300'
                                }}>
                                {togglingOuverture
                                    ? <Loader className="w-5 h-5 animate-spin" />
                                    : commerce?.est_ouvert
                                        ? <><ToggleRight className="w-5 h-5" /> Fermer</>
                                        : <><ToggleLeft className="w-5 h-5" /> Ouvrir</>}
                            </button>
                            <button onClick={() => { logout(); navigate('/login'); }} className="p-2 bg-gray-100 rounded-xl">
                                <LogOut className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* ✅ Bandeau si commerce non validé */}
                    {commerce && !commerce.est_valide && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700 font-medium">
                            ⏳ Votre commerce est en attente de validation par un administrateur.
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-6">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[
                            { label: 'Commandes', value: stats.total_commandes ?? 0, icon: <ShoppingBag className="w-5 h-5" />, color: '#ff7300' },
                            { label: 'Livrées', value: stats.livrees ?? 0, icon: <Package className="w-5 h-5" />, color: '#009639' },
                            { label: 'CA (FCFA)', value: (stats.chiffre_affaires ?? 0).toLocaleString(), icon: <TrendingUp className="w-5 h-5" />, color: '#3b82f6' },
                        ].map((s, i) => (
                            <div key={i} className="card p-4 text-center">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 text-white"
                                    style={{ background: s.color }}>{s.icon}</div>
                                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Onglets */}
                <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
                    {[
                        { key: 'commandes', label: 'Commandes', icon: <ShoppingBag className="w-4 h-4" /> },
                        { key: 'produits', label: 'Produits', icon: <Package className="w-4 h-4" /> },
                        { key: 'stats', label: 'Statistiques', icon: <TrendingUp className="w-4 h-4" /> },
                    ].map((tab) => (
                        <button key={tab.key} onClick={() => setOnglet(tab.key as any)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: onglet === tab.key ? '#ff7300' : 'transparent',
                                color: onglet === tab.key ? 'white' : '#6b7280'
                            }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* COMMANDES */}
                {onglet === 'commandes' && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-bold text-gray-900">
                            Commandes <span className="text-sm font-normal text-gray-500">({commandes.length})</span>
                        </h2>
                        {commandes.length === 0 ? (
                            <div className="text-center py-12 card">
                                <span className="text-5xl">📋</span>
                                <p className="text-gray-500 mt-3">Aucune commande pour le moment</p>
                            </div>
                        ) : (
                            commandes.map((cmd: any) => (
                                <div key={cmd._id} className="card">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-gray-900">{cmd.reference}</p>
                                            <p className="text-sm text-gray-500">{cmd.client?.prenom} {cmd.client?.nom} — {cmd.client?.telephone}</p>
                                        </div>
                                        <span className={`badge ${STATUT_COLORS[cmd.statut] || 'badge-gray'}`}>
                                            {STATUT_LABELS[cmd.statut] || cmd.statut}
                                        </span>
                                    </div>
                                    <div className="space-y-1 mb-3">
                                        {cmd.articles?.map((art: any, i: number) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span className="text-gray-700">{art.nom} x{art.quantite}</span>
                                                <span className="font-semibold">{art.sous_total?.toLocaleString()} FCFA</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between font-bold pt-2 border-t border-gray-100">
                                            <span>Total</span>
                                            <span style={{ color: '#ff7300' }}>{cmd.montants?.total?.toLocaleString()} FCFA</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                        <Clock className="w-3 h-3" />
                                        {new Date(cmd.createdAt).toLocaleString('fr-FR')}
                                        <span className="ml-2">📍 {cmd.adresse_livraison?.quartier}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {cmd.statut === 'en_attente' && (
                                            <>
                                                <button onClick={() => changerStatut(cmd._id, 'acceptee')}
                                                    disabled={actionLoading === cmd._id}
                                                    className="flex-1 py-2 rounded-xl text-white text-sm font-bold"
                                                    style={{ background: '#009639' }}>
                                                    {actionLoading === cmd._id ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : '✅ Accepter'}
                                                </button>
                                                <button onClick={() => changerStatut(cmd._id, 'annulee')}
                                                    className="py-2 px-4 rounded-xl text-white text-sm font-bold bg-red-500">❌</button>
                                            </>
                                        )}
                                        {cmd.statut === 'acceptee' && (
                                            <button onClick={() => changerStatut(cmd._id, 'en_preparation')}
                                                disabled={actionLoading === cmd._id}
                                                className="flex-1 py-2 rounded-xl text-white text-sm font-bold"
                                                style={{ background: '#3b82f6' }}>
                                                👨‍🍳 Commencer la préparation
                                            </button>
                                        )}
                                        {cmd.statut === 'en_preparation' && (
                                            <button onClick={() => changerStatut(cmd._id, 'prete')}
                                                disabled={actionLoading === cmd._id}
                                                className="flex-1 py-2 rounded-xl text-white text-sm font-bold"
                                                style={{ background: '#ff7300' }}>
                                                {actionLoading === cmd._id ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : '📦 Marquer comme prête'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* PRODUITS */}
                {onglet === 'produits' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">
                                Mes produits <span className="text-sm font-normal text-gray-500">({produits.length})</span>
                            </h2>
                            <button onClick={() => setShowFormProduit(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
                                style={{ background: '#ff7300' }}>
                                <Plus className="w-4 h-4" /> Ajouter
                            </button>
                        </div>
                        {produits.length === 0 ? (
                            <div className="text-center py-12 card">
                                <span className="text-5xl">{categorieCommerce?.icon || '🍽️'}</span>
                                <p className="text-gray-500 mt-3">Aucun produit dans votre catalogue</p>
                                <button onClick={() => setShowFormProduit(true)}
                                    className="mt-4 px-6 py-2 rounded-xl text-white font-semibold"
                                    style={{ background: '#ff7300' }}>
                                    ➕ Ajouter un produit
                                </button>
                            </div>
                        ) : (
                            produits.map((p: any) => (
                                <div key={p._id} className="card flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center text-2xl flex-shrink-0">
                                        {categorieCommerce?.icon || '🍽️'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900">{p.nom}</p>
                                        <p className="text-sm text-gray-500 truncate">{p.description}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-sm font-bold" style={{ color: '#ff7300' }}>{p.prix?.toLocaleString()} FCFA</p>
                                            <span className="text-xs text-gray-400">• {p.categorie}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`badge ${p.disponible ? 'badge-green' : 'badge-red'}`}>
                                            {p.disponible ? 'Dispo' : 'Indispo'}
                                        </span>
                                        <div className="flex gap-1">
                                            <button onClick={() => setProduitEdite(p)}
                                                className="p-1.5 bg-blue-50 rounded-lg text-blue-500 hover:bg-blue-100">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => supprimerProduit(p._id)}
                                                className="p-1.5 bg-red-50 rounded-lg text-red-50 hover:bg-red-100">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* STATS */}
                {onglet === 'stats' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">Mes statistiques</h2>
                        <div className="card">
                            <h3 className="font-bold text-gray-900 mb-4">📊 Résumé</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Total commandes', value: stats?.total_commandes ?? 0 },
                                    { label: 'Commandes livrées', value: stats?.livrees ?? 0 },
                                    { label: "Chiffre d'affaires", value: `${(stats?.chiffre_affaires ?? 0).toLocaleString()} FCFA` },
                                    { label: 'Note moyenne', value: `⭐ ${commerce?.note_moyenne}/5 (${commerce?.total_avis} avis)` },
                                    { label: 'Frais de livraison', value: `${commerce?.frais_livraison} FCFA` },
                                    { label: 'Commande minimum', value: `${commerce?.commande_minimum?.toLocaleString()} FCFA` },
                                    { label: 'Temps de préparation', value: `${commerce?.temps_preparation_moyen} min` },
                                    { label: 'Catégorie', value: categorieCommerce?.label },
                                    { label: 'Ville', value: commerce?.ville },
                                    { label: 'Quartier', value: commerce?.adresse?.quartier },
                                    { label: 'Statut', value: commerce?.statut === 'actif' ? '✅ Validé' : '⏳ En attente' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-gray-600 text-sm">{label}</span>
                                        <span className="font-bold text-gray-900 text-sm">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}