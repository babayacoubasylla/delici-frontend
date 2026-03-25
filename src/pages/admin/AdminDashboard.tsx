import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, ShoppingBag, TrendingUp, MapPin, Check, X, Loader, Plus, Eye, EyeOff, Store } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

const VILLES = ['Bouaké', 'Yamoussoukro', 'San Pedro', 'Daloa', 'Gagnoa', 'Man', 'Korhogo', 'Soubré', 'Divo', 'Sinfra'];
const CATEGORIES = ['restaurant', 'marche', 'supermarche', 'pharmacie', 'boulangerie', 'autre'];
const ROLE_LABELS: Record<string, string> = {
    client: '🛍️ Client', livreur: '🛵 Livreur',
    commercant: '🏪 Commercant', gerant_zone: '🏢 Gérant', admin: '👑 Admin'
};
const STATUT_COLORS: Record<string, string> = {
    actif: 'badge-green', inactif: 'badge-gray', suspendu: 'badge-red', en_attente: 'badge-orange'
};
const TYPE_COMMERCE_LABELS: Record<string, string> = {
    restaurant_fastfood: '🍔 Restaurant',
    supermarché_épicerie: '🛒 Supermarché',
    marché_légumes: '🥬 Marché',
    boulangerie_pâtisserie: '🥖 Boulangerie',
    téléphonie_électronique: '📱 Électronique',
    vêtements_mode: '👕 Mode',
    coiffure_beauté: '💇 Coiffure/Beauté',
    pharmacie_parapharmacie: '💊 Pharmacie',
    services: '🔨 Services',
    autre: '🏪 Autre'
};

// Formulaire création utilisateur/commercant
const FormulaireAjout = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
    const [step, setStep] = useState<'role' | 'infos' | 'commerce'>('role');
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({
        nom: '', prenom: '', telephone: '', email: '', password: '', ville: '', role: '',
        // Commerce
        nom_boutique: '', type_commerce: '', categorie: '', description: '', quartier: '', telephone_commerce: '',
        frais_livraison: '500', temps_preparation: '20', commande_minimum: '1000',
    });

    const update = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

    const choisirRole = (r: string) => { setRole(r); update('role', r); setStep('infos'); };

    const creer = async () => {
        if (!form.nom || !form.telephone || !form.password || !form.ville) {
            toast.error('Remplissez tous les champs obligatoires'); return;
        }
        try {
            setLoading(true);
            // 1. Créer l'utilisateur
            const userRes = await api.post('/auth/inscription', {
                nom: form.nom, prenom: form.prenom, telephone: form.telephone,
                email: form.email, password: form.password, ville: form.ville, role: form.role
            });

            // 2. Si commercant, créer le commerce
            if (role === 'commercant' && form.nom_boutique) {
                const token = userRes.data.data.token;
                await api.post('/commercants/inscription', {
                    nom_boutique: form.nom_boutique,
                    type_commerce: form.type_commerce || 'autre',
                    categorie: form.categorie || 'autre',
                    description: form.description,
                    adresse: { quartier: form.quartier },
                    telephone: form.telephone_commerce || form.telephone,
                    frais_livraison: parseInt(form.frais_livraison),
                    temps_preparation_moyen: parseInt(form.temps_preparation),
                    commande_minimum: parseInt(form.commande_minimum),
                    ville: form.ville,
                }, { headers: { Authorization: `Bearer ${token}` } });
            }

            toast.success(`✅ ${ROLE_LABELS[role]} créé avec succès !`);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la création');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {step === 'role' ? 'Ajouter un partenaire' : step === 'infos' ? `Infos ${ROLE_LABELS[role]}` : 'Infos commerce'}
                    </h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-4">
                    {/* ÉTAPE 1 : Choisir le rôle */}
                    {step === 'role' && (
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { r: 'commercant', label: 'Commercant', sub: 'Restaurant, pharmacie, marché...', icon: '🏪' },
                                { r: 'livreur', label: 'Livreur', sub: 'Livreur à moto ou vélo', icon: '🛵' },
                                { r: 'gerant_zone', label: 'Gérant de zone', sub: 'Supervise une ville', icon: '🏢' },
                                { r: 'client', label: 'Client', sub: 'Compte client', icon: '🛍️' },
                            ].map(opt => (
                                <button key={opt.r} onClick={() => choisirRole(opt.r)}
                                    className="p-4 border-2 rounded-xl text-center hover:border-orange-500 hover:bg-orange-50 transition-all">
                                    <p className="text-3xl mb-2">{opt.icon}</p>
                                    <p className="font-bold text-gray-900 text-sm">{opt.label}</p>
                                    <p className="text-xs text-gray-500 mt-1">{opt.sub}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ÉTAPE 2 : Infos personnelles */}
                    {step === 'infos' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nom *</label>
                                    <input value={form.nom} onChange={e => update('nom', e.target.value)} className="input-field" placeholder="Koné" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Prénom</label>
                                    <input value={form.prenom} onChange={e => update('prenom', e.target.value)} className="input-field" placeholder="Mamadou" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone *</label>
                                <input value={form.telephone} onChange={e => update('telephone', e.target.value)} className="input-field" placeholder="0700000000" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                <input value={form.email} onChange={e => update('email', e.target.value)} className="input-field" placeholder="email@exemple.com" type="email" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Ville *</label>
                                <select value={form.ville} onChange={e => update('ville', e.target.value)} className="input-field">
                                    <option value="">Sélectionnez une ville</option>
                                    {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mot de passe *</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} value={form.password}
                                        onChange={e => update('password', e.target.value)}
                                        className="input-field pr-10" placeholder="Min. 6 caractères" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setStep('role')}
                                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold">
                                    ← Retour
                                </button>
                                {role === 'commercant' ? (
                                    <button onClick={() => setStep('commerce')}
                                        className="flex-1 py-3 rounded-xl text-white font-semibold"
                                        style={{ background: '#ff7300' }}>
                                        Suivant →
                                    </button>
                                ) : (
                                    <button onClick={creer} disabled={loading}
                                        className="flex-1 py-3 rounded-xl text-white font-semibold disabled:opacity-60"
                                        style={{ background: '#009639' }}>
                                        {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : '✅ Créer'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ÉTAPE 3 : Infos commerce (si commercant) */}
                    {step === 'commerce' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Nom du commerce *</label>
                                <input value={form.nom_boutique} onChange={e => update('nom_boutique', e.target.value)}
                                    className="input-field" placeholder="Maquis Chez Adjoua" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Type de commerce *</label>
                                <select value={form.type_commerce} onChange={e => update('type_commerce', e.target.value)} className="input-field">
                                    <option value="">Sélectionnez un type</option>
                                    <option value="restaurant_fastfood">🍔 Restaurant / Fast-food</option>
                                    <option value="supermarché_épicerie">🛒 Supermarché / Épicerie</option>
                                    <option value="marché_légumes">🥬 Marché / Légumes</option>
                                    <option value="boulangerie_pâtisserie">🥖 Boulangerie / Pâtisserie</option>
                                    <option value="téléphonie_électronique">📱 Téléphonie / Électronique</option>
                                    <option value="vêtements_mode">👕 Vêtements / Mode</option>
                                    <option value="coiffure_beauté">💇 Coiffure / Beauté</option>
                                    <option value="pharmacie_parapharmacie">💊 Pharmacie / Parapharmacie</option>
                                    <option value="services">🔨 Services</option>
                                    <option value="autre">🏪 Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                <textarea value={form.description} onChange={e => update('description', e.target.value)}
                                    className="input-field resize-none" rows={2} placeholder="Spécialités ivoiriennes..." />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Quartier</label>
                                <input value={form.quartier} onChange={e => update('quartier', e.target.value)}
                                    className="input-field" placeholder="Centre-ville, Résidentiel..." />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Frais livraison</label>
                                    <input type="number" value={form.frais_livraison} onChange={e => update('frais_livraison', e.target.value)}
                                        className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Temps prépa (min)</label>
                                    <input type="number" value={form.temps_preparation} onChange={e => update('temps_preparation', e.target.value)}
                                        className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Min commande</label>
                                    <input type="number" value={form.commande_minimum} onChange={e => update('commande_minimum', e.target.value)}
                                        className="input-field" />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setStep('infos')}
                                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold">
                                    ← Retour
                                </button>
                                <button onClick={creer} disabled={loading}
                                    className="flex-1 py-3 rounded-xl text-white font-semibold disabled:opacity-60"
                                    style={{ background: '#009639' }}>
                                    {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : '✅ Créer le commerce'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [onglet, setOnglet] = useState<'stats' | 'users' | 'commandes' | 'zones'>('stats');
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [commercants, setCommercants] = useState<any[]>([]);
    const [commandes, setCommandes] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtreRole, setFiltreRole] = useState('');
    const [filtreStatut, setFiltreStatut] = useState('');
    const [filtreVille, setFiltreVille] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showFormulaire, setShowFormulaire] = useState(false);

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (onglet === 'users') fetchUsers(); }, [filtreRole, filtreStatut]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsRes, zonesRes, commercantsRes] = await Promise.all([
                api.get('/stats/admin'),
                api.get('/zones'),
                api.get('/commercants/admin/tous')
            ]);
            setStats(statsRes.data.data.stats);
            setZones(zonesRes.data.data.zones);
            setCommercants(commercantsRes.data.data.commercants);
            await fetchUsers();
            await fetchCommandes();
        } catch (error) {
            console.error('Erreur chargement:', error);
            toast.error('Erreur de chargement');
        } finally { setLoading(false); }
    };

    const fetchUsers = async () => {
        try {
            const params: any = {};
            if (filtreRole) params.role = filtreRole;
            if (filtreStatut) params.statut = filtreStatut;
            const res = await api.get('/users', { params });
            setUsers(res.data.data.users);
        } catch (error) { console.error(error); }
    };

    const fetchCommandes = async () => {
        try {
            const params: any = {};
            if (filtreVille) params.ville = filtreVille;
            const res = await api.get('/commandes/admin/toutes', { params }).catch(() =>
                api.get('/commandes/commerce/liste'));
            setCommandes(res.data.data.commandes);
        } catch (error) { console.error(error); }
    };

    const changerStatutUser = async (userId: string, statut: string) => {
        setActionLoading(userId);
        try {
            await api.patch(`/users/${userId}/statut`, { statut });
            toast.success(`Utilisateur ${statut === 'actif' ? 'activé ✅' : 'suspendu ❌'}`);
            fetchUsers();
            fetchData();
        } catch (error) { toast.error('Erreur'); }
        finally { setActionLoading(null); }
    };

    // NOUVELLE FONCTION : Valider un commerçant
    const validerCommercant = async (commercantId: string) => {
        setActionLoading(commercantId);
        try {
            await api.patch(`/commercants/admin/${commercantId}/valider`);
            toast.success('✅ Commerçant validé avec succès !');
            fetchData(); // Recharge les données
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la validation');
        } finally { setActionLoading(null); }
    };

    // NOUVELLE FONCTION : Rejeter un commerçant
    const rejeterCommercant = async (commercantId: string) => {
        setActionLoading(commercantId);
        const raison = prompt('Raison du rejet :');
        if (!raison) return;
        try {
            await api.patch(`/commercants/admin/${commercantId}/rejeter`, { raison });
            toast.success('❌ Commerçant rejeté');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors du rejet');
        } finally { setActionLoading(null); }
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
            {showFormulaire && (
                <FormulaireAjout
                    onClose={() => setShowFormulaire(false)}
                    onSuccess={() => fetchData()}
                />
            )}

            <header className="bg-white shadow-sm sticky top-0 z-10 border-b-4 border-orange-500">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Administration 👑</p>
                        <h1 className="text-xl font-bold text-gray-900">DeliCI Admin</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowFormulaire(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
                            style={{ background: '#ff7300' }}>
                            <Plus className="w-4 h-4" /> Ajouter
                        </button>
                        <button onClick={() => { logout(); navigate('/login'); }} className="p-2 bg-gray-100 rounded-xl">
                            <LogOut className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                {/* Stats rapides */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {[
                            { label: 'Utilisateurs', value: stats.totalUsers, icon: <Users className="w-5 h-5" />, color: '#ff7300' },
                            { label: 'Commercants', value: stats.totalCommercants, icon: <Store className="w-5 h-5" />, color: '#009639' },
                            { label: 'Commandes', value: stats.totalCommandes, icon: <ShoppingBag className="w-5 h-5" />, color: '#3b82f6' },
                            { label: 'Livrées', value: stats.commandesLivrees, icon: <TrendingUp className="w-5 h-5" />, color: '#8b5cf6' },
                        ].map((s, i) => (
                            <div key={i} className="card p-4 text-center">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 text-white"
                                    style={{ background: s.color }}>{s.icon}</div>
                                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Comment ça marche */}
                <div className="card mb-6 border-l-4 border-orange-500">
                    <h3 className="font-bold text-gray-900 mb-3">📖 Comment fonctionne DeliCI</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p>1️⃣ <strong>Client</strong> commande → Commercant reçoit la commande</p>
                        <p>2️⃣ <strong>Commercant</strong> accepte → prépare → marque "Prête"</p>
                        <p>3️⃣ <strong>Système</strong> cherche automatiquement un livreur disponible dans la ville</p>
                        <p>4️⃣ Si trouvé → assigné automatiquement. Sinon → visible pour tous les livreurs</p>
                        <p>5️⃣ <strong>Livreur</strong> collecte → livre → client confirme</p>
                        <p className="mt-2 font-semibold text-orange-600">
                            👆 Bouton "Ajouter" en haut pour créer des commercants, livreurs ou gérants
                        </p>
                    </div>
                </div>

                {/* Onglets */}
                <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1 shadow-sm border border-gray-100 overflow-x-auto">
                    {[
                        { key: 'stats', label: '📊 Stats' },
                        { key: 'users', label: '👥 Utilisateurs' },
                        { key: 'commandes', label: '📦 Commandes' },
                        { key: 'zones', label: '🗺️ Zones' },
                    ].map((tab) => (
                        <button key={tab.key} onClick={() => setOnglet(tab.key as any)}
                            className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: onglet === tab.key ? '#ff7300' : 'transparent',
                                color: onglet === tab.key ? 'white' : '#6b7280'
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* STATS */}
                {onglet === 'stats' && (
                    <div className="space-y-4">
                        <div className="card">
                            <h3 className="font-bold text-gray-900 mb-4">📊 Vue globale</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Total utilisateurs', value: stats?.totalUsers || 0 },
                                    { label: 'Commercants actifs', value: stats?.totalCommercants || 0 },
                                    { label: 'Total commandes', value: stats?.totalCommandes || 0 },
                                    { label: 'Commandes livrées', value: stats?.commandesLivrees || 0 },
                                    { label: 'Taux de réussite', value: stats?.totalCommandes ? `${Math.round((stats.commandesLivrees / stats.totalCommandes) * 100)}%` : '0%' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-gray-600 text-sm">{label}</span>
                                        <span className="font-bold text-gray-900">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section des commerçants en attente */}
                        <div className="card">
                            <h3 className="font-bold text-gray-900 mb-4">⏳ Commerçants en attente de validation</h3>
                            {commercants.filter(c => !c.est_valide).length === 0 ? (
                                <p className="text-gray-500 text-sm">Aucun commerçant en attente</p>
                            ) : (
                                <div className="space-y-3">
                                    {commercants.filter(c => !c.est_valide).map((c: any) => (
                                        <div key={c._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
                                            <div>
                                                <p className="font-bold text-gray-900">{c.nom_boutique}</p>
                                                <p className="text-sm text-gray-600">{TYPE_COMMERCE_LABELS[c.type_commerce] || '🏪 Autre'}</p>
                                                <p className="text-xs text-gray-500">📞 {c.telephone} • 📍 {c.ville}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => validerCommercant(c._id)}
                                                    disabled={actionLoading === c._id}
                                                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-white text-xs font-bold bg-green-500 hover:bg-green-600"
                                                >
                                                    {actionLoading === c._id ? <Loader className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                    Valider
                                                </button>
                                                <button
                                                    onClick={() => rejeterCommercant(c._id)}
                                                    disabled={actionLoading === c._id}
                                                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-white text-xs font-bold bg-red-500 hover:bg-red-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                    Rejeter
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="card">
                            <h3 className="font-bold text-gray-900 mb-4">🗺️ Villes actives</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {zones.map((zone: any) => (
                                    <div key={zone._id} className="p-3 rounded-xl border-2 border-gray-100">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-bold text-gray-900 text-sm">{zone.nom}</p>
                                            <span className={`badge ${zone.active ? 'badge-green' : 'badge-red'}`}>
                                                {zone.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Gérant : {zone.gerant ? `${zone.gerant.prenom} ${zone.gerant.nom}` : '⚠️ Non assigné'}
                                        </p>
                                        <p className="text-xs text-gray-500">Base : {zone.frais_livraison_base} FCFA</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* UTILISATEURS */}
                {onglet === 'users' && (
                    <div className="space-y-4">
                        <div className="flex gap-2 flex-wrap items-center justify-between">
                            <div className="flex gap-2 flex-wrap">
                                <select value={filtreRole} onChange={e => setFiltreRole(e.target.value)}
                                    className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500">
                                    <option value="">Tous les rôles</option>
                                    <option value="client">Clients</option>
                                    <option value="livreur">Livreurs</option>
                                    <option value="commercant">Commercants</option>
                                    <option value="gerant_zone">Gérants</option>
                                </select>
                                <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
                                    className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500">
                                    <option value="">Tous les statuts</option>
                                    <option value="actif">Actifs</option>
                                    <option value="en_attente">En attente</option>
                                    <option value="suspendu">Suspendus</option>
                                </select>
                            </div>
                            <button onClick={() => setShowFormulaire(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
                                style={{ background: '#ff7300' }}>
                                <Plus className="w-4 h-4" /> Ajouter
                            </button>
                        </div>

                        <p className="text-sm text-gray-500">{users.length} utilisateur(s)</p>

                        <div className="space-y-3">
                            {users.map((u: any) => (
                                <div key={u._id} className="card">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-gray-900">{u.prenom} {u.nom}</p>
                                                <span className="badge badge-blue text-xs">{ROLE_LABELS[u.role] || u.role}</span>
                                                <span className={`badge ${STATUT_COLORS[u.statut] || 'badge-gray'}`}>{u.statut}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">📞 {u.telephone}</p>
                                            <p className="text-xs text-gray-400">📍 {u.ville}</p>
                                            {u.role === 'livreur' && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    🛵 {u.livreur_info?.total_livraisons || 0} livraisons • ⭐ {u.livreur_info?.note_moyenne || 0}/5 •
                                                    {u.livreur_info?.disponible ? ' 🟢 En ligne' : ' 🔴 Hors ligne'}
                                                </p>
                                            )}
                                            {u.role === 'commercant' && u.commercant && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    🏪 {u.commercant?.nom_boutique} • {u.commercant?.est_valide ? '✅ Validé' : '⏳ En attente'}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2 ml-3">
                                            {u.statut === 'en_attente' && (
                                                <button onClick={() => changerStatutUser(u._id, 'actif')}
                                                    disabled={actionLoading === u._id}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-bold"
                                                    style={{ background: '#009639' }}>
                                                    {actionLoading === u._id ? <Loader className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3" /> Valider</>}
                                                </button>
                                            )}
                                            {u.statut === 'actif' && u.role !== 'admin' && (
                                                <button onClick={() => changerStatutUser(u._id, 'suspendu')}
                                                    disabled={actionLoading === u._id}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-bold bg-red-500">
                                                    {actionLoading === u._id ? <Loader className="w-3 h-3 animate-spin" /> : <><X className="w-3 h-3" /> Suspendre</>}
                                                </button>
                                            )}
                                            {u.statut === 'suspendu' && (
                                                <button onClick={() => changerStatutUser(u._id, 'actif')}
                                                    disabled={actionLoading === u._id}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-bold"
                                                    style={{ background: '#009639' }}>
                                                    {actionLoading === u._id ? <Loader className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3" /> Réactiver</>}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* COMMANDES */}
                {onglet === 'commandes' && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <select value={filtreVille} onChange={e => { setFiltreVille(e.target.value); fetchCommandes(); }}
                                className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500">
                                <option value="">Toutes les villes</option>
                                {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <p className="text-sm text-gray-500">{commandes.length} commande(s)</p>
                        {commandes.length === 0 ? (
                            <div className="text-center py-12 card"><span className="text-5xl">📦</span><p className="text-gray-500 mt-3">Aucune commande</p></div>
                        ) : (
                            <div className="space-y-3">
                                {commandes.map((cmd: any) => (
                                    <div key={cmd._id} className="card">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-bold text-gray-900">{cmd.reference}</p>
                                                <p className="text-sm text-gray-500">{cmd.commercant?.nom_boutique} — {cmd.ville}</p>
                                                <p className="text-xs text-gray-400">Client : {cmd.client?.prenom} {cmd.client?.nom} • {cmd.client?.telephone}</p>
                                                {cmd.livreur && <p className="text-xs text-gray-400">Livreur : {cmd.livreur?.prenom} {cmd.livreur?.nom} • {cmd.livreur?.telephone}</p>}
                                            </div>
                                            <div className="text-right">
                                                <span className={`badge ${cmd.statut === 'livree' ? 'badge-green' : cmd.statut === 'annulee' ? 'badge-red' : 'badge-orange'}`}>
                                                    {cmd.statut}
                                                </span>
                                                <p className="text-sm font-bold mt-1" style={{ color: '#ff7300' }}>{cmd.montants?.total?.toLocaleString()} FCFA</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>📍 {cmd.adresse_livraison?.quartier}</span>
                                            <span>{new Date(cmd.createdAt).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ZONES */}
                {onglet === 'zones' && (
                    <div className="space-y-4">
                        <h2 className="font-bold text-gray-900">Gestion des zones</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {zones.map((zone: any) => (
                                <div key={zone._id} className="card border-l-4"
                                    style={{ borderColor: zone.active ? '#009639' : '#e5e7eb' }}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{zone.nom}</h3>
                                            <span className={`badge ${zone.active ? 'badge-green' : 'badge-gray'}`}>
                                                {zone.active ? '🟢 Active' : '⭕ Inactive'}
                                            </span>
                                        </div>
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Gérant</span>
                                            <span className="font-semibold">{zone.gerant ? `${zone.gerant.prenom} ${zone.gerant.nom}` : '⚠️ Non assigné'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Livraison de base</span>
                                            <span className="font-semibold">{zone.frais_livraison_base} FCFA</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Rayon</span>
                                            <span className="font-semibold">{zone.rayon_km} km</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}