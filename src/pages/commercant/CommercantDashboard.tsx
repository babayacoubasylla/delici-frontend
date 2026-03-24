import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, ShoppingBag, TrendingUp, Clock, ToggleLeft, ToggleRight, Plus, X, Camera, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUT_COLORS: Record<string, string> = {
    en_attente: 'badge-orange', acceptee: 'badge-blue', en_preparation: 'badge-blue',
    prete: 'badge-green', livreur_assigne: 'badge-blue', en_collecte: 'badge-blue',
    en_livraison: 'badge-blue', livree: 'badge-green', annulee: 'badge-red',
};

const STATUT_LABELS: Record<string, string> = {
    en_attente: '⏳ En attente', acceptee: '✅ Acceptée', en_preparation: '👨‍🍳 En préparation',
    prete: '📦 Prête', livreur_assigne: '🛵 Livreur assigné', en_collecte: '🏃 En collecte',
    en_livraison: '🛵 En livraison', livree: '✅ Livrée', annulee: '❌ Annulée',
};

interface FormProduit {
    nom: string; description: string; prix: string;
    categorie: string; temps_preparation: string; photo: File | null; photoPreview: string;
}

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
    const [showFormProduit, setShowFormProduit] = useState(false);
    const [editingProduit, setEditingProduit] = useState<any>(null);
    const [savingProduit, setSavingProduit] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState<FormProduit>({
        nom: '', description: '', prix: '', categorie: '', temps_preparation: '15', photo: null, photoPreview: ''
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [commerceRes, commandesRes, statsRes] = await Promise.all([
                api.get('/commercants/mon-commerce/details'),
                api.get('/commandes/commerce/liste'),
                api.get('/stats/commercant'),
            ]);
            const c = commerceRes.data.data.commercant;
            setCommerce(c);
            setCommandes(commandesRes.data.data.commandes);
            setStats(statsRes.data.data.stats);
            const produitsRes = await api.get(`/produits/commercant/${c._id}`);
            setProduits(produitsRes.data.data.produits);
        } catch (error: any) {
            if (error.response?.status !== 404) toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const toggleOuverture = async () => {
        try {
            setTogglingOuverture(true);
            const res = await api.patch('/commercants/mon-commerce/ouverture');
            setCommerce((prev: any) => ({ ...prev, est_ouvert: !prev.est_ouvert }));
            toast.success(res.data.message);
        } catch { toast.error('Erreur'); }
        finally { setTogglingOuverture(false); }
    };

    const changerStatut = async (commandeId: string, statut: string) => {
        try {
            await api.patch(`/commandes/commerce/${commandeId}/statut`, { statut });
            toast.success(`Commande mise à jour`);
            fetchData();
        } catch { toast.error('Erreur'); }
    };

    const toggleDisponibilite = async (produitId: string) => {
        try {
            await api.patch(`/produits/${produitId}/disponibilite`);
            fetchData();
        } catch { toast.error('Erreur'); }
    };

    const ouvrirFormAjout = () => {
        setEditingProduit(null);
        setForm({ nom: '', description: '', prix: '', categorie: '', temps_preparation: '15', photo: null, photoPreview: '' });
        setShowFormProduit(true);
    };

    const ouvrirFormEdit = (p: any) => {
        setEditingProduit(p);
        setForm({ nom: p.nom, description: p.description || '', prix: String(p.prix), categorie: p.categorie, temps_preparation: String(p.temps_preparation || 15), photo: null, photoPreview: p.photo || '' });
        setShowFormProduit(true);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Photo trop lourde (max 5MB)'); return; }
        const preview = URL.createObjectURL(file);
        setForm(prev => ({ ...prev, photo: file, photoPreview: preview }));
    };

    const sauvegarderProduit = async () => {
        if (!form.nom || !form.prix || !form.categorie) {
            toast.error('Nom, prix et catégorie sont obligatoires');
            return;
        }
        setSavingProduit(true);
        try {
            const formData = new FormData();
            formData.append('nom', form.nom);
            formData.append('description', form.description);
            formData.append('prix', form.prix);
            formData.append('categorie', form.categorie);
            formData.append('temps_preparation', form.temps_preparation);
            if (form.photo) formData.append('photo', form.photo);

            if (editingProduit) {
                await api.patch(`/produits/${editingProduit._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Produit mis à jour !');
            } else {
                await api.post('/produits', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Produit ajouté !');
            }
            setShowFormProduit(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSavingProduit(false);
        }
    };

    const supprimerProduit = async (produitId: string) => {
        if (!confirm('Supprimer ce produit ?')) return;
        try {
            await api.delete(`/produits/${produitId}`);
            toast.success('Produit supprimé');
            fetchData();
        } catch { toast.error('Erreur'); }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10 border-b-4 border-orange-500">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Mon commerce 🏪</p>
                            <h1 className="text-xl font-bold text-gray-900">{commerce?.nom_boutique || 'Tableau de bord'}</h1>
                            {commerce && (
                                <span className={`badge ${commerce.est_ouvert ? 'badge-green' : 'badge-red'} mt-1`}>
                                    {commerce.est_ouvert ? '🟢 Ouvert' : '🔴 Fermé'}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {commerce && (
                                <button onClick={toggleOuverture} disabled={togglingOuverture}
                                    className="flex items-center gap-1 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all"
                                    style={{ borderColor: commerce.est_ouvert ? '#009639' : '#ff7300', color: commerce.est_ouvert ? '#009639' : '#ff7300' }}>
                                    {commerce.est_ouvert ? <><ToggleRight className="w-5 h-5" /> Fermer</> : <><ToggleLeft className="w-5 h-5" /> Ouvrir</>}
                                </button>
                            )}
                            <button onClick={() => { logout(); navigate('/login'); }} className="p-2 bg-gray-100 rounded-xl">
                                <LogOut className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-6">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[
                            { label: 'Commandes', value: stats.total_commandes, icon: <ShoppingBag className="w-5 h-5" />, color: '#ff7300' },
                            { label: 'Livrées', value: stats.livrees, icon: <Package className="w-5 h-5" />, color: '#009639' },
                            { label: 'CA FCFA', value: (stats.chiffre_affaires || 0).toLocaleString(), icon: <TrendingUp className="w-5 h-5" />, color: '#3b82f6' },
                        ].map((s, i) => (
                            <div key={i} className="card p-4 text-center">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 text-white" style={{ background: s.color }}>{s.icon}</div>
                                <p className="text-lg font-bold text-gray-900">{s.value ?? 0}</p>
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
                        { key: 'stats', label: 'Stats', icon: <TrendingUp className="w-4 h-4" /> },
                    ].map((tab) => (
                        <button key={tab.key} onClick={() => setOnglet(tab.key as any)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{ background: onglet === tab.key ? '#ff7300' : 'transparent', color: onglet === tab.key ? 'white' : '#6b7280' }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* COMMANDES */}
                {onglet === 'commandes' && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-bold text-gray-900">Commandes <span className="text-sm font-normal text-gray-500">({commandes.length})</span></h2>
                        {commandes.length === 0 ? (
                            <div className="text-center py-12 card"><span className="text-5xl">📋</span><p className="text-gray-500 mt-3">Aucune commande</p></div>
                        ) : commandes.map((cmd: any) => (
                            <div key={cmd._id} className="card">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-gray-900">{cmd.reference}</p>
                                        <p className="text-sm text-gray-500">{cmd.client?.prenom} {cmd.client?.nom}</p>
                                    </div>
                                    <span className={`badge ${STATUT_COLORS[cmd.statut] || 'badge-gray'}`}>{STATUT_LABELS[cmd.statut] || cmd.statut}</span>
                                </div>
                                <div className="space-y-1 mb-3">
                                    {cmd.articles?.map((art: any, i: number) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-gray-700">{art.nom} x{art.quantite}</span>
                                            <span className="font-semibold">{art.sous_total?.toLocaleString()} FCFA</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                                        <span className="font-bold">Total</span>
                                        <span className="font-bold" style={{ color: '#ff7300' }}>{cmd.montants?.total?.toLocaleString()} FCFA</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                    <Clock className="w-3 h-3" />{new Date(cmd.createdAt).toLocaleString('fr-FR')}
                                    <span className="ml-2">📍 {cmd.adresse_livraison?.quartier}</span>
                                </div>
                                <div className="flex gap-2">
                                    {cmd.statut === 'en_attente' && (
                                        <>
                                            <button onClick={() => changerStatut(cmd._id, 'acceptee')} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#009639' }}>✅ Accepter</button>
                                            <button onClick={() => changerStatut(cmd._id, 'annulee')} className="py-2 px-4 rounded-xl text-sm font-semibold text-white bg-red-500">❌</button>
                                        </>
                                    )}
                                    {cmd.statut === 'acceptee' && (
                                        <button onClick={() => changerStatut(cmd._id, 'en_preparation')} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#3b82f6' }}>👨‍🍳 Commencer préparation</button>
                                    )}
                                    {cmd.statut === 'en_preparation' && (
                                        <button onClick={() => changerStatut(cmd._id, 'prete')} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#ff7300' }}>📦 Marquer prête</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* PRODUITS */}
                {onglet === 'produits' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Produits <span className="text-sm font-normal text-gray-500">({produits.length})</span></h2>
                            <button onClick={ouvrirFormAjout}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                                style={{ background: 'linear-gradient(135deg, #ff7300, #e65100)' }}>
                                <Plus className="w-4 h-4" /> Ajouter
                            </button>
                        </div>

                        {/* Formulaire ajout/edit */}
                        {showFormProduit && (
                            <div className="card border-2 border-orange-200 bg-orange-50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-900">{editingProduit ? '✏️ Modifier le produit' : '➕ Nouveau produit'}</h3>
                                    <button onClick={() => setShowFormProduit(false)}><X className="w-5 h-5 text-gray-500" /></button>
                                </div>

                                {/* Photo */}
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">📸 Photo du plat</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative w-full h-44 rounded-xl border-2 border-dashed border-orange-300 cursor-pointer overflow-hidden flex items-center justify-center"
                                        style={{ background: form.photoPreview ? 'transparent' : '#fff8f0' }}>
                                        {form.photoPreview ? (
                                            <>
                                                <img src={form.photoPreview} alt="preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <Camera className="w-8 h-8 text-white" />
                                                    <span className="text-white font-semibold ml-2">Changer la photo</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <Camera className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                                                <p className="text-sm font-semibold text-orange-500">Ajouter une photo</p>
                                                <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WEBP — max 5MB</p>
                                            </div>
                                        )}
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nom du plat *</label>
                                        <input type="text" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                                            className="input-field" placeholder="Ex: Attiéké Poisson" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                            className="input-field resize-none" rows={2} placeholder="Décrivez votre plat..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Prix (FCFA) *</label>
                                            <input type="number" value={form.prix} onChange={e => setForm(p => ({ ...p, prix: e.target.value }))}
                                                className="input-field" placeholder="1500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Prépa. (min)</label>
                                            <input type="number" value={form.temps_preparation} onChange={e => setForm(p => ({ ...p, temps_preparation: e.target.value }))}
                                                className="input-field" placeholder="15" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Catégorie *</label>
                                        <input type="text" value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))}
                                            className="input-field" placeholder="Ex: Plats locaux, Boissons, Desserts..." />
                                    </div>
                                    <button onClick={sauvegarderProduit} disabled={savingProduit}
                                        className="w-full py-3 rounded-xl text-white font-bold transition-all hover:scale-105"
                                        style={{ background: savingProduit ? '#e5e7eb' : 'linear-gradient(135deg, #ff7300, #e65100)' }}>
                                        {savingProduit
                                            ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sauvegarde...</span>
                                            : editingProduit ? '✅ Mettre à jour' : '✅ Ajouter le produit'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Liste des produits avec photos */}
                        {produits.length === 0 && !showFormProduit ? (
                            <div className="text-center py-12 card">
                                <span className="text-5xl">🍽️</span>
                                <p className="text-gray-500 mt-3">Aucun produit dans votre menu</p>
                                <button onClick={ouvrirFormAjout} className="mt-4 btn-primary">+ Ajouter votre premier plat</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {produits.map((p: any) => (
                                    <div key={p._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        {/* Photo du plat */}
                                        <div className="relative w-full h-32 bg-orange-50">
                                            {p.photo ? (
                                                <img src={p.photo} alt={p.nom} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                                            )}
                                            <div className="absolute top-2 right-2">
                                                <span className={`badge ${p.disponible ? 'badge-green' : 'badge-red'} text-xs`}>
                                                    {p.disponible ? '✅' : '❌'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <p className="font-bold text-gray-900 text-sm truncate">{p.nom}</p>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{p.description}</p>
                                            <p className="font-bold mt-1 text-sm" style={{ color: '#ff7300' }}>{p.prix?.toLocaleString()} FCFA</p>
                                            <div className="flex gap-1 mt-2">
                                                <button onClick={() => ouvrirFormEdit(p)}
                                                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white"
                                                    style={{ background: '#3b82f6' }}>✏️ Modifier</button>
                                                <button onClick={() => toggleDisponibilite(p._id)}
                                                    className="py-1.5 px-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                                                    {p.disponible ? '⏸' : '▶'}
                                                </button>
                                                <button onClick={() => supprimerProduit(p._id)}
                                                    className="py-1.5 px-2 rounded-lg text-xs text-red-500 hover:bg-red-50">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* STATS */}
                {onglet === 'stats' && commerce && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">Statistiques</h2>
                        <div className="card">
                            <h3 className="font-bold text-gray-900 mb-4">📊 Résumé</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Total commandes', value: stats?.total_commandes ?? 0 },
                                    { label: 'Commandes livrées', value: stats?.livrees ?? 0 },
                                    { label: "Chiffre d'affaires", value: `${(stats?.chiffre_affaires ?? 0).toLocaleString()} FCFA` },
                                    { label: 'Note moyenne', value: `⭐ ${commerce.note_moyenne}/5 (${commerce.total_avis} avis)` },
                                    { label: 'Frais livraison', value: `${commerce.frais_livraison} FCFA` },
                                    { label: 'Commande minimum', value: `${commerce.commande_minimum?.toLocaleString()} FCFA` },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                                        <span className="text-gray-600 text-sm">{label}</span>
                                        <span className="font-bold text-gray-900 text-sm">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card">
                            <h3 className="font-bold text-gray-900 mb-3">🏪 Infos commerce</h3>
                            <div className="space-y-2 text-sm">
                                {[
                                    { label: 'Catégorie', value: commerce.categorie },
                                    { label: 'Ville', value: commerce.ville },
                                    { label: 'Quartier', value: commerce.adresse?.quartier },
                                    { label: 'Téléphone', value: commerce.telephone },
                                    { label: 'Temps prépa.', value: `${commerce.temps_preparation_moyen} min` },
                                ].map(({ label, value }) => (
                                    <p key={label}><span className="text-gray-500">{label} :</span><span className="font-semibold ml-2">{value}</span></p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}