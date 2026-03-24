import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PAIEMENTS = [
    { id: 'especes', label: 'Espèces', sub: 'À la livraison', emoji: '💵' },
    { id: 'orange_money', label: 'Orange Money', sub: 'Bientôt', emoji: '🟠', disabled: true },
    { id: 'mtn_money', label: 'MTN Money', sub: 'Bientôt', emoji: '🟡', disabled: true },
    { id: 'wave', label: 'Wave', sub: 'Bientôt', emoji: '💙', disabled: true },
];

const Spinner = () => (
    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

export default function PanierPage() {
    const navigate = useNavigate();
    const [panier, setPanier] = useState<any[]>([]);
    const [commercant, setCommercant] = useState<any>(null);
    const [adresse, setAdresse] = useState({ quartier: '', description: '', point_repere: '' });
    const [paiement, setPaiement] = useState('especes');
    const [loading, setLoading] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsAdresse, setGpsAdresse] = useState('');

    useEffect(() => {
        const p = localStorage.getItem('delici_panier');
        const c = localStorage.getItem('delici_commercant');
        if (!p || !c) { navigate('/client'); return; }
        setPanier(JSON.parse(p));
        setCommercant(JSON.parse(c));
    }, []);

    const sousTotal = panier.reduce((acc, i) => acc + i.produit.prix * i.quantite, 0);
    const fraisLivraison = commercant?.frais_livraison || 500;
    const total = sousTotal + fraisLivraison;

    const detecterPosition = () => {
        if (!navigator.geolocation) {
            toast.error('GPS non disponible sur ce navigateur');
            return;
        }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
                    const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
                    const data = await res.json();
                    const quartier = data.address?.suburb || data.address?.neighbourhood || data.address?.village || data.address?.town || '';
                    const ville = data.address?.city || data.address?.town || '';
                    const rue = data.address?.road || '';
                    const adresseComplete = [rue, quartier, ville].filter(Boolean).join(', ');
                    setAdresse(prev => ({
                        ...prev,
                        quartier: quartier || adresseComplete.split(',')[0],
                        description: adresseComplete
                    }));
                    setGpsAdresse(adresseComplete);
                    toast.success('Position détectée ! ✅');
                } catch {
                    toast.error("Impossible de récupérer l'adresse");
                } finally {
                    setGpsLoading(false);
                }
            },
            (err) => {
                setGpsLoading(false);
                if (err.code === 1) toast.error('Accès GPS refusé. Activez la localisation.');
                else toast.error('Erreur GPS. Saisissez manuellement.');
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    const confirmerCommande = async () => {
        if (!adresse.quartier) {
            toast.error('Veuillez renseigner votre quartier ou utiliser le GPS');
            return;
        }
        try {
            setLoading(true);
            const res = await api.post('/commandes', {
                commercant_id: commercant._id,
                articles: panier.map(i => ({ produit_id: i.produit._id, quantite: i.quantite })),
                adresse_livraison: adresse,
                paiement_methode: paiement
            });
            localStorage.removeItem('delici_panier');
            localStorage.removeItem('delici_commercant');
            toast.success('Commande passée avec succès ! 🎉');
            navigate(`/client/commandes/${res.data.data.commande.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la commande');
        } finally {
            setLoading(false);
        }
    };

    if (!commercant) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10 border-b-4 border-orange-500">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-xl text-gray-700 font-bold">
                        ←
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Mon panier</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

                {/* Articles */}
                <div className="card">
                    <h2 className="font-bold text-gray-900 mb-4">🛒 Commande chez {commercant.nom_boutique}</h2>
                    <div className="space-y-3">
                        {panier.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                        style={{ background: '#ff7300' }}>{item.quantite}</span>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{item.produit.nom}</p>
                                        <p className="text-xs text-gray-500">{item.produit.prix.toLocaleString()} FCFA / unité</p>
                                    </div>
                                </div>
                                <p className="font-bold text-gray-900">{(item.produit.prix * item.quantite).toLocaleString()} FCFA</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Sous-total</span><span>{sousTotal.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Frais de livraison</span><span>{fraisLivraison.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                            <span>Total</span>
                            <span style={{ color: '#ff7300' }}>{total.toLocaleString()} FCFA</span>
                        </div>
                    </div>
                </div>

                {/* Adresse */}
                <div className="card">
                    <h2 className="font-bold text-gray-900 mb-4">📍 Adresse de livraison</h2>

                    {/* Bouton GPS */}
                    <button onClick={detecterPosition} disabled={gpsLoading}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl mb-4 font-semibold text-white transition-all disabled:opacity-70"
                        style={{
                            background: gpsAdresse
                                ? 'linear-gradient(135deg, #009639, #16a34a)'
                                : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            boxShadow: '0 4px 15px rgba(59,130,246,0.3)'
                        }}>
                        {gpsLoading
                            ? <><Spinner /> Détection en cours...</>
                            : gpsAdresse
                                ? <>✅ Position détectée — Changer</>
                                : <>📍 Utiliser ma position GPS</>
                        }
                    </button>

                    {gpsAdresse && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl px-4 py-3 mb-4">
                            <p className="text-sm font-semibold text-green-800">✅ Position détectée</p>
                            <p className="text-xs text-green-600 mt-0.5">{gpsAdresse}</p>
                        </div>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">ou saisissez manuellement</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Quartier *</label>
                            <input type="text" value={adresse.quartier}
                                onChange={e => setAdresse(prev => ({ ...prev, quartier: e.target.value }))}
                                className="input-field" placeholder="Ex: Résidentiel, Centre-ville..." />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                            <input type="text" value={adresse.description}
                                onChange={e => setAdresse(prev => ({ ...prev, description: e.target.value }))}
                                className="input-field" placeholder="Ex: Maison bleue, 2ème rue à gauche" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Point de repère</label>
                            <input type="text" value={adresse.point_repere}
                                onChange={e => setAdresse(prev => ({ ...prev, point_repere: e.target.value }))}
                                className="input-field" placeholder="Ex: En face de l'école, près de la mosquée" />
                        </div>
                    </div>
                </div>

                {/* Paiement */}
                <div className="card">
                    <h2 className="font-bold text-gray-900 mb-4">💳 Mode de paiement</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {PAIEMENTS.map(p => (
                            <button key={p.id} type="button" disabled={p.disabled}
                                onClick={() => !p.disabled && setPaiement(p.id)}
                                className="p-4 border-2 rounded-xl text-center transition-all relative"
                                style={{
                                    borderColor: paiement === p.id ? '#ff7300' : '#e5e7eb',
                                    background: paiement === p.id ? '#fff8f0' : (p.disabled ? '#f9fafb' : 'white'),
                                    opacity: p.disabled ? 0.5 : 1,
                                    cursor: p.disabled ? 'not-allowed' : 'pointer',
                                    transform: paiement === p.id ? 'scale(1.03)' : 'scale(1)'
                                }}>
                                {paiement === p.id && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                                        style={{ background: '#ff7300' }}>✓</div>
                                )}
                                <div className="text-2xl mb-1">{p.emoji}</div>
                                <p className="font-bold text-sm text-gray-900">{p.label}</p>
                                <p className="text-xs text-gray-500">{p.sub}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bouton confirmer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg z-20">
                <div className="max-w-2xl mx-auto">
                    <button onClick={confirmerCommande} disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-white font-bold text-lg transition-all disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, #009639, #16a34a)', boxShadow: '0 6px 20px rgba(0,150,57,0.35)' }}>
                        {loading
                            ? <><Spinner /> Traitement...</>
                            : <>✅ Confirmer — {total.toLocaleString()} FCFA</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}