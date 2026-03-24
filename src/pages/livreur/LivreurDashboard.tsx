import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MapPin, ToggleLeft, ToggleRight, Loader, Map, Phone, Clock, Star } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUT_LABELS: Record<string, string> = {
    livreur_assigne: '✅ Assigné', en_collecte: '🏃 En collecte',
    en_livraison: '🛵 En livraison', livree: '✅ Livrée',
    acceptee: '✅ Acceptée', en_cours: '🛵 En cours', terminee: '✅ Terminée',
};

export default function LivreurDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [onglet, setOnglet] = useState<'missions' | 'courses' | 'historique' | 'stats'>('missions');
    const [missions, setMissions] = useState<any[]>([]);
    const [coursesDispos, setCoursesDispos] = useState<any[]>([]);
    const [mesLivraisons, setMesLivraisons] = useState<any[]>([]);
    const [mesCourses, setMesCourses] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [disponible, setDisponible] = useState(user?.livreur_info?.disponible || false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 20000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Récupérer les missions disponibles
            try {
                const missionsRes = await api.get('/commandes/livreur/missions');
                setMissions(missionsRes.data.data?.commandes || []);
            } catch (error) {
                console.error('Erreur chargement missions:', error);
                setMissions([]);
            }

            // 2. Récupérer les courses disponibles
            try {
                const coursesRes = await api.get('/courses/disponibles');
                setCoursesDispos(coursesRes.data.data?.courses || []);
            } catch (error) {
                console.error('Erreur chargement courses:', error);
                setCoursesDispos([]);
            }

            // 3. Récupérer mes missions en cours - Utiliser la route /livreur/en-cours
            try {
                const missionsEnCoursRes = await api.get('/commandes/livreur/en-cours');
                setMesLivraisons(missionsEnCoursRes.data.data?.commandes || []);
            } catch (error: any) {
                if (error.response?.status === 404) {
                    console.log('Aucune mission en cours');
                } else {
                    console.error('Erreur chargement missions en cours:', error);
                }
                setMesLivraisons([]);
            }

            // 4. Récupérer mes courses en cours
            try {
                const coursesListRes = await api.get('/courses/mes-courses');
                setMesCourses(coursesListRes.data.data?.courses || []);
            } catch (error: any) {
                if (error.response?.status === 403 || error.response?.status === 401) {
                    console.warn('Non autorisé à voir les courses');
                } else {
                    console.error('Erreur chargement courses:', error);
                }
                setMesCourses([]);
            }

            setStats({
                total_livraisons: user?.livreur_info?.total_livraisons || 0,
                gains_total: user?.livreur_info?.gains_total || 0,
                note_moyenne: user?.livreur_info?.note_moyenne || 0,
            });
            
        } catch (error: any) {
            console.error('Erreur chargement principal:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error('Session expirée, veuillez vous reconnecter');
                logout();
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleDisponibilite = async () => {
        try {
            await api.patch('/livreurs/disponibilite', { disponible: !disponible });
            setDisponible(!disponible);
            toast.success(!disponible ? '🟢 Vous êtes en ligne !' : '🔴 Vous êtes hors ligne');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors du changement de statut');
        }
    };

    const accepterMission = async (commandeId: string) => {
        // Vérifier si une mission est déjà en cours
        if (missionEnCours) {
            toast.error('Vous avez déjà une mission en cours. Terminez-la avant d\'en accepter une nouvelle.');
            return;
        }

        setActionLoading(commandeId);
        try {
            const response = await api.patch(`/commandes/livreur/${commandeId}/accepter`);
            if (response.status === 200) {
                toast.success('Mission acceptée ! 🛵');
                fetchData();
            }
        } catch (error: any) {
            console.error('Erreur acceptation mission:', error.response?.data);
            const errorMessage = error.response?.data?.message || 'Erreur lors de l\'acceptation';
            toast.error(errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    const changerStatutCommande = async (commandeId: string, statut: string) => {
        setActionLoading(commandeId);
        try {
            const res = await api.patch(`/commandes/livreur/${commandeId}/statut`, { statut });
            if (res.data.data?.google_maps_url) {
                window.open(res.data.data.google_maps_url, '_blank');
                toast.success('📍 Google Maps ouvert !');
            }
            toast.success(statut === 'livree' ? '🎉 Livraison terminée !' : `${STATUT_LABELS[statut]}`);
            fetchData();
        } catch (error: any) {
            console.error('Erreur changement statut:', error.response?.data);
            toast.error(error.response?.data?.message || 'Erreur');
        } finally {
            setActionLoading(null);
        }
    };

    const ouvrirMaps = (adresse: string, ville: string) => {
        const query = encodeURIComponent(`${adresse} ${ville}`);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    const accepterCourse = async (courseId: string) => {
        if (courseEnCours) {
            toast.error('Vous avez déjà une course en cours. Terminez-la avant d\'en accepter une nouvelle.');
            return;
        }

        setActionLoading(courseId);
        try {
            await api.patch(`/courses/${courseId}/accepter`);
            toast.success('Course acceptée ! 🛵');
            fetchData();
        } catch (error: any) {
            console.error('Erreur acceptation course:', error.response?.data);
            toast.error(error.response?.data?.message || 'Erreur');
        } finally {
            setActionLoading(null);
        }
    };

    const changerStatutCourse = async (courseId: string, statut: string) => {
        setActionLoading(courseId);
        try {
            await api.patch(`/courses/${courseId}/statut`, { statut });
            toast.success(statut === 'en_cours' ? '🛵 Course démarrée !' : '✅ Course terminée !');
            fetchData();
        } catch (error: any) {
            console.error('Erreur changement statut course:', error.response?.data);
            toast.error(error.response?.data?.message || 'Erreur');
        } finally {
            setActionLoading(null);
        }
    };

    const missionEnCours = mesLivraisons.find((c: any) =>
        ['livreur_assigne', 'en_collecte', 'en_livraison'].includes(c.statut));
    const courseEnCours = mesCourses.find((c: any) =>
        ['acceptee', 'en_cours'].includes(c.statut));

    // Bloc contact client/commercant
    const BlocContact = ({ titre, nom, telephone, adresse, ville, couleur }: any) => (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div>
                <p className="text-xs text-gray-400">{titre}</p>
                <p className="text-sm font-bold text-gray-900">{nom || 'Non spécifié'}</p>
                {adresse && <p className="text-xs text-gray-500">{adresse}</p>}
            </div>
            <div className="flex gap-2">
                {adresse && ville && (
                    <button onClick={() => ouvrirMaps(adresse, ville)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-white text-xs font-bold"
                        style={{ background: '#4285f4' }}>
                        <Map className="w-3 h-3" /> Maps
                    </button>
                )}
                {telephone && (
                    <a href={`tel:${telephone}`}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-white text-xs font-bold"
                        style={{ background: couleur || '#009639' }}>
                        <Phone className="w-3 h-3" /> Appeler
                    </a>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10 border-b-4 border-orange-500">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Livreur 🛵</p>
                            <h1 className="text-xl font-bold text-gray-900">{user?.prenom} {user?.nom}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <MapPin className="w-3 h-3 text-orange-500" />
                                <span className="text-xs text-gray-500">{user?.ville}</span>
                                <span className="text-xs">⭐ {user?.livreur_info?.note_moyenne || 0}/5</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={toggleDisponibilite}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all"
                                style={{
                                    borderColor: disponible ? '#009639' : '#e5e7eb',
                                    color: disponible ? '#009639' : '#6b7280',
                                    background: disponible ? '#f0faf4' : 'white'
                                }}>
                                {disponible ? <><ToggleRight className="w-5 h-5" /> En ligne</> : <><ToggleLeft className="w-5 h-5" /> Hors ligne</>}
                            </button>
                            <button onClick={() => { logout(); navigate('/login'); }} className="p-2 bg-gray-100 rounded-xl">
                                <LogOut className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6">

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { label: 'Livraisons', value: stats?.total_livraisons || 0, icon: '📦', color: '#ff7300' },
                        { label: 'Gains (FCFA)', value: (stats?.gains_total || 0).toLocaleString(), icon: '💰', color: '#009639' },
                        { label: 'Note', value: `${stats?.note_moyenne || 0}/5 ⭐`, icon: '⭐', color: '#3b82f6' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                            <p className="text-2xl mb-1">{s.icon}</p>
                            <p className="text-lg font-bold text-gray-900">{s.value}</p>
                            <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Mission / Course en cours */}
                {(missionEnCours || courseEnCours) && (
                    <div className="bg-white rounded-2xl p-5 mb-6 border-2 border-orange-300 shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #fff8f0, #ffedd5)' }}>
                        <h3 className="font-bold text-orange-700 mb-4">🔴 Mission en cours</h3>

                        {missionEnCours && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="font-bold text-gray-900">{missionEnCours.reference}</p>
                                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                                        {STATUT_LABELS[missionEnCours.statut]}
                                    </span>
                                </div>

                                {/* Contacts */}
                                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                                    <BlocContact
                                        titre="🏪 Commercant (collecte)"
                                        nom={missionEnCours.commercant?.nom_boutique}
                                        telephone={missionEnCours.commercant?.telephone}
                                        adresse={missionEnCours.commercant?.adresse?.quartier}
                                        ville={missionEnCours.commercant?.ville}
                                        couleur="#ff7300"
                                    />
                                    <BlocContact
                                        titre="👤 Client (livraison)"
                                        nom={`${missionEnCours.client?.prenom || ''} ${missionEnCours.client?.nom || ''}`}
                                        telephone={missionEnCours.client?.telephone}
                                        adresse={`${missionEnCours.adresse_livraison?.quartier || ''}`}
                                        ville={missionEnCours.ville}
                                        couleur="#009639"
                                    />
                                </div>

                                {/* Montant à percevoir */}
                                <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-3 flex justify-between">
                                    <p className="text-sm text-green-700 font-medium">💰 Votre gain sur cette livraison</p>
                                    <p className="text-sm font-bold text-green-700">
                                        {((missionEnCours.montants?.frais_livraison || 0) * 0.8).toLocaleString()} FCFA
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {missionEnCours.statut === 'livreur_assigne' && (
                                        <button onClick={() => changerStatutCommande(missionEnCours._id, 'en_collecte')}
                                            disabled={actionLoading === missionEnCours._id}
                                            className="flex-1 py-3 rounded-xl text-white text-sm font-bold bg-blue-500">
                                            {actionLoading === missionEnCours._id ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : '🏃 Je vais chercher la commande'}
                                        </button>
                                    )}
                                    {missionEnCours.statut === 'en_collecte' && (
                                        <button onClick={() => changerStatutCommande(missionEnCours._id, 'en_livraison')}
                                            disabled={actionLoading === missionEnCours._id}
                                            className="flex-1 py-3 rounded-xl text-white text-sm font-bold bg-orange-500">
                                            {actionLoading === missionEnCours._id ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : '🛵 Je pars livrer'}
                                        </button>
                                    )}
                                    {missionEnCours.statut === 'en_livraison' && (
                                        <button onClick={() => changerStatutCommande(missionEnCours._id, 'livree')}
                                            disabled={actionLoading === missionEnCours._id}
                                            className="flex-1 py-3 rounded-xl text-white text-sm font-bold bg-green-500">
                                            {actionLoading === missionEnCours._id ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : '✅ Commande livrée !'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {courseEnCours && (
                            <div className={missionEnCours ? 'mt-4 pt-4 border-t border-orange-200' : ''}>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="font-bold text-gray-900">{courseEnCours.reference}</p>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                        {STATUT_LABELS[courseEnCours.statut]}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{courseEnCours.description_course}</p>

                                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                                    <BlocContact
                                        titre="👤 Client"
                                        nom={`${courseEnCours.client?.prenom || ''} ${courseEnCours.client?.nom || ''}`}
                                        telephone={courseEnCours.client?.telephone}
                                        adresse={courseEnCours.depart?.description}
                                        ville={user?.ville}
                                        couleur="#009639"
                                    />
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-3 flex justify-between">
                                    <p className="text-sm text-green-700 font-medium">💰 Montant de la course</p>
                                    <p className="text-sm font-bold text-green-700">{courseEnCours.paiement?.montant?.toLocaleString() || 0} FCFA</p>
                                </div>

                                <div className="flex gap-2">
                                    {courseEnCours.statut === 'acceptee' && (
                                        <button onClick={() => changerStatutCourse(courseEnCours._id, 'en_cours')}
                                            disabled={actionLoading === courseEnCours._id}
                                            className="flex-1 py-3 rounded-xl text-white text-sm font-bold bg-orange-500">
                                            🛵 Démarrer la course
                                        </button>
                                    )}
                                    {courseEnCours.statut === 'en_cours' && (
                                        <button onClick={() => changerStatutCourse(courseEnCours._id, 'terminee')}
                                            disabled={actionLoading === courseEnCours._id}
                                            className="flex-1 py-3 rounded-xl text-white text-sm font-bold bg-green-500">
                                            ✅ Course terminée
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Onglets */}
                <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1 shadow-sm border border-gray-100 overflow-x-auto">
                    {[
                        { key: 'missions', label: '📦 Missions', count: missions.length },
                        { key: 'courses', label: '🛵 Courses', count: coursesDispos.length },
                        { key: 'historique', label: '📋 Historique' },
                        { key: 'stats', label: '📊 Stats' },
                    ].map((tab) => (
                        <button key={tab.key} onClick={() => setOnglet(tab.key as any)}
                            className="flex-shrink-0 flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                            style={{
                                background: onglet === tab.key ? '#ff7300' : 'transparent',
                                color: onglet === tab.key ? 'white' : '#6b7280'
                            }}>
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="w-4 h-4 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* MISSIONS DISPONIBLES */}
                {onglet === 'missions' && (
                    <div className="space-y-3">
                        <h2 className="font-bold text-gray-900">
                            Commandes prêtes <span className="text-sm font-normal text-gray-500">({missions.length})</span>
                        </h2>
                        {!disponible && (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-3 rounded-xl">
                                ⚠️ Passez en ligne pour accepter des missions
                            </div>
                        )}
                        {missionEnCours && (
                            <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded-xl">
                                ℹ️ Vous avez déjà une mission en cours. Terminez-la avant d'en accepter une nouvelle.
                            </div>
                        )}
                        {missions.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                                <span className="text-5xl">📭</span>
                                <p className="text-gray-500 mt-3">Aucune mission disponible</p>
                            </div>
                        ) : (
                            missions.map((cmd: any) => (
                                <div key={cmd._id} className="bg-white rounded-2xl p-4 shadow-sm border-l-4" style={{ borderColor: '#ff7300' }}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-bold text-gray-900">{cmd.reference}</p>
                                            <p className="text-sm text-gray-500">{cmd.commercant?.nom_boutique}</p>
                                        </div>
                                        <span className="font-bold text-lg text-green-600">
                                            +{((cmd.montants?.frais_livraison || 0) * 0.8).toLocaleString()} FCFA
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                                        <p>🏪 Collecte : {cmd.commercant?.adresse?.quartier}, {cmd.commercant?.ville}</p>
                                        <p><MapPin className="w-3 h-3 inline mr-1 text-orange-500" />Livraison : {cmd.adresse_livraison?.quartier}</p>
                                        <p><Clock className="w-3 h-3 inline mr-1 text-gray-400" />
                                            Il y a {Math.round((Date.now() - new Date(cmd.createdAt).getTime()) / 60000)} min
                                        </p>
                                    </div>
                                    <button onClick={() => accepterMission(cmd._id)}
                                        disabled={actionLoading === cmd._id || !!missionEnCours}
                                        className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 bg-gradient-to-r from-orange-500 to-orange-600">
                                        {actionLoading === cmd._id ? <Loader className="w-5 h-5 animate-spin mx-auto" />
                                            : missionEnCours ? 'Terminez votre mission en cours' : '🛵 Accepter cette mission'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* COURSES PRIVÉES */}
                {onglet === 'courses' && (
                    <div className="space-y-3">
                        <h2 className="font-bold text-gray-900">
                            Courses privées <span className="text-sm font-normal text-gray-500">({coursesDispos.length})</span>
                        </h2>
                        {courseEnCours && (
                            <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded-xl">
                                ℹ️ Vous avez déjà une course en cours. Terminez-la avant d'en accepter une nouvelle.
                            </div>
                        )}
                        {coursesDispos.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                                <span className="text-5xl">🛵</span>
                                <p className="text-gray-500 mt-3">Aucune course disponible</p>
                            </div>
                        ) : (
                            coursesDispos.map((course: any) => (
                                <div key={course._id} className="bg-white rounded-2xl p-4 shadow-sm border-l-4" style={{ borderColor: '#3b82f6' }}>
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="font-bold text-gray-900">{course.reference}</p>
                                        <span className="font-bold text-green-600">
                                            +{course.paiement?.montant?.toLocaleString() || 0} FCFA
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{course.description_course}</p>
                                    <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                            <span>{course.depart?.description}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                            <span>{course.arrivee?.description}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => accepterCourse(course._id)}
                                            disabled={actionLoading === course._id || !!courseEnCours}
                                            className="flex-1 py-3 rounded-xl text-white font-bold disabled:opacity-50 bg-gradient-to-r from-blue-500 to-blue-600">
                                            {actionLoading === course._id ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : '🛵 Accepter'}
                                        </button>
                                        <a href={`tel:${course.client?.telephone}`}
                                            className="p-3 rounded-xl text-white flex items-center bg-green-500">
                                            <Phone className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* HISTORIQUE */}
                {onglet === 'historique' && (
                    <div className="space-y-3">
                        <h2 className="font-bold text-gray-900">Mes livraisons</h2>
                        {mesLivraisons.filter(c => c.statut === 'livree').length === 0 && mesCourses.filter(c => c.statut === 'terminee').length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                                <span className="text-5xl">📋</span>
                                <p className="text-gray-500 mt-3">Aucune livraison effectuée</p>
                            </div>
                        ) : (
                            <>
                                {mesLivraisons.filter((cmd: any) => cmd.statut === 'livree').map((cmd: any) => (
                                    <div key={cmd._id} className="bg-white rounded-2xl p-4 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-900">{cmd.reference}</p>
                                                <p className="text-sm text-gray-500">{cmd.commercant?.nom_boutique}</p>
                                                <p className="text-xs text-gray-400">{new Date(cmd.createdAt).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                    {STATUT_LABELS[cmd.statut] || cmd.statut}
                                                </span>
                                                <p className="text-sm font-bold mt-1 text-green-600">
                                                    +{((cmd.montants?.frais_livraison || 0) * 0.8).toLocaleString()} FCFA
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {mesCourses.filter((course: any) => course.statut === 'terminee').map((course: any) => (
                                    <div key={course._id} className="bg-white rounded-2xl p-4 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-900">{course.reference}</p>
                                                <p className="text-sm text-gray-500 truncate max-w-xs">{course.description_course}</p>
                                                <p className="text-xs text-gray-400">{new Date(course.createdAt).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                    {STATUT_LABELS[course.statut] || course.statut}
                                                </span>
                                                <p className="text-sm font-bold mt-1 text-green-600">
                                                    +{course.paiement?.montant?.toLocaleString() || 0} FCFA
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* STATS */}
                {onglet === 'stats' && (
                    <div className="space-y-4">
                        <h2 className="font-bold text-gray-900">Mes statistiques</h2>
                        <div className="bg-white rounded-2xl p-5 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4">📊 Résumé</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Total livraisons', value: stats?.total_livraisons || 0 },
                                    { label: 'Gains totaux', value: `${(stats?.gains_total || 0).toLocaleString()} FCFA` },
                                    { label: 'Note moyenne', value: `⭐ ${stats?.note_moyenne || 0}/5` },
                                    { label: 'Véhicule', value: user?.livreur_info?.vehicule || 'moto' },
                                    { label: 'Ville', value: user?.ville },
                                    { label: 'Statut', value: disponible ? '🟢 En ligne' : '🔴 Hors ligne' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-gray-600 text-sm">{label}</span>
                                        <span className="font-bold text-gray-900">{value}</span>
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