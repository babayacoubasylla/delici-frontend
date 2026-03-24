import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Phone, Star } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ETAPES = [
    { statut: 'en_attente', label: 'Commande reçue', emoji: '📋' },
    { statut: 'acceptee', label: 'Acceptée par le commerce', emoji: '✅' },
    { statut: 'en_preparation', label: 'En préparation', emoji: '👨‍🍳' },
    { statut: 'prete', label: 'Prête', emoji: '📦' },
    { statut: 'livreur_assigne', label: 'Livreur assigné', emoji: '🛵' },
    { statut: 'en_livraison', label: 'En route vers vous', emoji: '🚀' },
    { statut: 'livree', label: 'Livrée !', emoji: '🎉' },
];

const ORDRE_STATUTS = ['en_attente', 'acceptee', 'en_preparation', 'prete', 'livreur_assigne', 'en_livraison', 'livree'];

export default function SuiviCommandePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [commande, setCommande] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState(0);
    const [showNote, setShowNote] = useState(false);

    useEffect(() => {
        fetchCommande();
        const interval = setInterval(fetchCommande, 15000); // Refresh toutes les 15s
        return () => clearInterval(interval);
    }, [id]);

    const fetchCommande = async () => {
        try {
            const res = await api.get(`/commandes/suivi/${id}`);
            setCommande(res.data.data.commande);
            if (res.data.data.commande.statut === 'livree' && !res.data.data.commande.note_client) {
                setShowNote(true);
            }
        } catch (error) {
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const envoyerNote = async () => {
        try {
            await api.post(`/commandes/${id}/noter`, {
                note_commercant: note,
                note_livreur: note,
                commentaire: ''
            });
            toast.success('Merci pour votre note ! ⭐');
            setShowNote(false);
            fetchCommande();
        } catch (error) {
            toast.error('Erreur lors de l\'envoi de la note');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!commande) return null;

    const indexActuel = ORDRE_STATUTS.indexOf(commande.statut);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm sticky top-0 z-10 border-b-4 border-orange-500">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate('/client/commandes')} className="p-2 bg-gray-100 rounded-xl">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Suivi commande</h1>
                        <p className="text-sm text-gray-500">{commande.reference}</p>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

                {/* Statut actuel */}
                <div className="card text-center"
                    style={{ background: commande.statut === 'livree' ? 'linear-gradient(135deg, #009639, #16a34a)' : 'linear-gradient(135deg, #ff7300, #e65100)' }}>
                    <p className="text-4xl mb-2">{ETAPES.find(e => e.statut === commande.statut)?.emoji || '📋'}</p>
                    <p className="text-xl font-bold text-white">{ETAPES.find(e => e.statut === commande.statut)?.label}</p>
                    {commande.statut !== 'livree' && commande.statut !== 'annulee' && (
                        <p className="text-white text-opacity-80 text-sm mt-1">⏱️ Temps estimé : {commande.temps_estime?.total} min</p>
                    )}
                </div>

                {/* Barre de progression */}
                {commande.statut !== 'annulee' && (
                    <div className="card">
                        <h3 className="font-bold text-gray-900 mb-4">Progression</h3>
                        <div className="space-y-3">
                            {ETAPES.map((etape, i) => {
                                const fait = i <= indexActuel;
                                const actuel = i === indexActuel;
                                return (
                                    <div key={etape.statut} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${actuel ? 'ring-4 ring-orange-200' : ''}`}
                                            style={{
                                                background: fait ? '#ff7300' : '#e5e7eb',
                                                color: fait ? 'white' : '#9ca3af'
                                            }}>
                                            {fait ? '✓' : i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-semibold ${fait ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {etape.emoji} {etape.label}
                                            </p>
                                        </div>
                                        {actuel && (
                                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Infos livreur */}
                {commande.livreur && (
                    <div className="card">
                        <h3 className="font-bold text-gray-900 mb-3">🛵 Votre livreur</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-xl">👤</div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900">{commande.livreur.prenom} {commande.livreur.nom}</p>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    {commande.livreur.livreur_info?.note_moyenne}/5
                                </div>
                            </div>
                            <a href={`tel:${commande.livreur.telephone}`}
                                className="p-3 rounded-xl text-white flex items-center gap-2 text-sm font-semibold"
                                style={{ background: '#009639' }}>
                                <Phone className="w-4 h-4" /> Appeler
                            </a>
                        </div>
                    </div>
                )}

                {/* Détails commande */}
                <div className="card">
                    <h3 className="font-bold text-gray-900 mb-3">📋 Détails</h3>
                    <div className="space-y-2">
                        {commande.articles?.map((art: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-700">{art.nom} x{art.quantite}</span>
                                <span className="font-semibold">{art.sous_total?.toLocaleString()} FCFA</span>
                            </div>
                        ))}
                        <div className="flex justify-between font-bold pt-2 border-t border-gray-100">
                            <span>Total</span>
                            <span style={{ color: '#ff7300' }}>{commande.montants?.total?.toLocaleString()} FCFA</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {commande.adresse_livraison?.quartier} — {commande.adresse_livraison?.description}
                    </div>
                </div>

                {/* Notation */}
                {showNote && (
                    <div className="card border-2 border-orange-200">
                        <h3 className="font-bold text-gray-900 mb-3 text-center">⭐ Notez votre expérience</h3>
                        <div className="flex justify-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button key={n} onClick={() => setNote(n)}
                                    className="text-3xl transition-all hover:scale-110">
                                    {n <= note ? '⭐' : '☆'}
                                </button>
                            ))}
                        </div>
                        {note > 0 && (
                            <button onClick={envoyerNote}
                                className="w-full py-3 rounded-xl text-white font-bold"
                                style={{ background: '#ff7300' }}>
                                Envoyer ma note
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}