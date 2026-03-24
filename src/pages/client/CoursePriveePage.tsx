import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Loader, Clock, Phone } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AdresseInput from '../../components/AdresseInput';

const STATUT_COLORS: Record<string, string> = {
    en_attente: 'badge-orange', acceptee: 'badge-blue',
    en_cours: 'badge-blue', terminee: 'badge-green', annulee: 'badge-red',
};
const STATUT_LABELS: Record<string, string> = {
    en_attente: "⏳ En attente d'un livreur", acceptee: '✅ Livreur assigné',
    en_cours: '🛵 En cours', terminee: '✅ Terminée', annulee: '❌ Annulée',
};

export default function CoursePriveePage() {
    const navigate = useNavigate();
    const [onglet, setOnglet] = useState<'nouvelle' | 'mes_courses'>('nouvelle');
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [gpsLoading, setGpsLoading] = useState<'depart' | 'arrivee' | null>(null);
    const [form, setForm] = useState({
        depart: { description: '', quartier: '' },
        arrivee: { description: '', quartier: '' },
        description_course: '',
        paiement_methode: 'especes',
        montant: '',
    });

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses/mes-courses');
            setCourses(res.data.data.courses);
        } catch (error) { console.error(error); }
    };

    const detecterPosition = async (type: 'depart' | 'arrivee') => {
        if (!navigator.geolocation) { toast.error('GPS non disponible'); return; }
        setGpsLoading(type);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
                        { headers: { 'Accept-Language': 'fr' } }
                    );
                    const data = await res.json();
                    const quartier = data.address?.suburb || data.address?.neighbourhood || data.address?.village || '';
                    const rue = data.address?.road || '';
                    const adresse = [rue, quartier].filter(Boolean).join(', ') || data.display_name?.split(',')[0];
                    setForm(prev => ({ ...prev, [type]: { description: adresse, quartier } }));
                    toast.success(`📍 Position ${type === 'depart' ? 'de départ' : "d'arrivée"} détectée !`);
                } catch (e) {
                    toast.error("Impossible de récupérer l'adresse");
                } finally { setGpsLoading(null); }
            },
            () => { setGpsLoading(null); toast.error('Accès GPS refusé'); },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    const creerCourse = async () => {
        if (!form.depart.description) { toast.error('Renseignez le point de départ'); return; }
        if (!form.arrivee.description) { toast.error("Renseignez le point d'arrivée"); return; }
        if (!form.description_course) { toast.error('Décrivez votre course'); return; }
        try {
            setLoading(true);
            await api.post('/courses', {
                depart: form.depart,
                arrivee: form.arrivee,
                description_course: form.description_course,
                paiement_methode: form.paiement_methode,
                montant: parseInt(form.montant) || 0,
            });
            toast.success("Course créée ! En attente d'un livreur 🛵");
            setForm({
                depart: { description: '', quartier: '' },
                arrivee: { description: '', quartier: '' },
                description_course: '', paiement_methode: 'especes', montant: '',
            });
            setOnglet('mes_courses');
            fetchCourses();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur');
        } finally { setLoading(false); }
    };

    const annulerCourse = async (courseId: string) => {
        try {
            await api.patch(`/courses/${courseId}/annuler`);
            toast.success('Course annulée');
            fetchCourses();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <header className="bg-white shadow-sm sticky top-0 z-10 border-b-4 border-orange-500">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate('/client')} className="p-2 bg-gray-100 rounded-xl">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Course privée</h1>
                        <p className="text-xs text-gray-500">Envoyez un colis ou faites une commission</p>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Onglets */}
                <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
                    {[
                        { key: 'nouvelle', label: '➕ Nouvelle course' },
                        { key: 'mes_courses', label: `📋 Mes courses (${courses.length})` },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setOnglet(tab.key as any)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: onglet === tab.key ? '#ff7300' : 'transparent',
                                color: onglet === tab.key ? 'white' : '#6b7280'
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* NOUVELLE COURSE */}
                {onglet === 'nouvelle' && (
                    <div className="space-y-4">
                        <div className="rounded-2xl p-4 text-white"
                            style={{ background: 'linear-gradient(135deg, #ff7300, #e65100)' }}>
                            <h2 className="font-bold text-lg mb-1">🛵 Course à la demande</h2>
                            <p className="text-sm opacity-90">Un livreur disponible acceptera votre course et vous contactera.</p>
                        </div>

                        {/* Départ */}
                        <div className="card">
                            <AdresseInput
                                label="Point de départ"
                                couleur="#22c55e"
                                valeur={form.depart.description}
                                onChange={(desc, quartier) => setForm(prev => ({ ...prev, depart: { description: desc, quartier } }))}
                                placeholder="Tapez: Marché, Mairie, Rue..."
                            />
                            <button onClick={() => detecterPosition('depart')} disabled={gpsLoading === 'depart'}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl mt-3 text-sm font-semibold text-white"
                                style={{ background: '#3b82f6' }}>
                                {gpsLoading === 'depart'
                                    ? <><Loader className="w-4 h-4 animate-spin" /> Détection...</>
                                    : <><Navigation className="w-4 h-4" /> Utiliser ma position GPS</>}
                            </button>
                        </div>

                        {/* Flèche */}
                        <div className="flex justify-center">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-500">↓</div>
                        </div>

                        {/* Arrivée */}
                        <div className="card">
                            <AdresseInput
                                label="Point d'arrivée"
                                couleur="#ef4444"
                                valeur={form.arrivee.description}
                                onChange={(desc, quartier) => setForm(prev => ({ ...prev, arrivee: { description: desc, quartier } }))}
                                placeholder="Tapez: Hôpital, École, Résidentiel..."
                            />
                            <button onClick={() => detecterPosition('arrivee')} disabled={gpsLoading === 'arrivee'}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl mt-3 text-sm font-semibold text-white"
                                style={{ background: '#3b82f6' }}>
                                {gpsLoading === 'arrivee'
                                    ? <><Loader className="w-4 h-4 animate-spin" /> Détection...</>
                                    : <><Navigation className="w-4 h-4" /> Utiliser ma position GPS</>}
                            </button>
                        </div>

                        {/* Description */}
                        <div className="card">
                            <h3 className="font-bold text-gray-900 mb-3">📋 Description de la course</h3>
                            <textarea value={form.description_course}
                                onChange={e => setForm(prev => ({ ...prev, description_course: e.target.value }))}
                                className="input-field resize-none" rows={3}
                                placeholder="Ex: Livrer un colis chez ma mère, Acheter du pain à la boulangerie..." />
                        </div>

                        {/* Montant */}
                        <div className="card">
                            <h3 className="font-bold text-gray-900 mb-3">💵 Montant proposé</h3>
                            <div className="relative">
                                <input type="number" value={form.montant}
                                    onChange={e => setForm(prev => ({ ...prev, montant: e.target.value }))}
                                    className="input-field pr-16" placeholder="Ex: 500, 1000, 2000..." />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">FCFA</span>
                            </div>
                            <div className="flex gap-2 mt-3 flex-wrap">
                                {[500, 1000, 1500, 2000].map(m => (
                                    <button key={m} onClick={() => setForm(prev => ({ ...prev, montant: m.toString() }))}
                                        className="px-3 py-1.5 rounded-xl border-2 text-sm font-semibold transition-all"
                                        style={{
                                            borderColor: form.montant === m.toString() ? '#ff7300' : '#e5e7eb',
                                            color: form.montant === m.toString() ? '#ff7300' : '#6b7280',
                                            background: form.montant === m.toString() ? '#fff8f0' : 'white'
                                        }}>
                                        {m.toLocaleString()} FCFA
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={creerCourse} disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold text-lg disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg, #ff7300, #e65100)', boxShadow: '0 6px 20px rgba(255,115,0,0.35)' }}>
                            {loading ? <><Loader className="w-5 h-5 animate-spin" /> Création...</> : '🛵 Lancer la course'}
                        </button>
                    </div>
                )}

                {/* MES COURSES */}
                {onglet === 'mes_courses' && (
                    <div className="space-y-3">
                        {courses.length === 0 ? (
                            <div className="text-center py-16 card">
                                <span className="text-5xl">🛵</span>
                                <p className="text-gray-500 mt-3 font-semibold">Aucune course</p>
                                <button onClick={() => setOnglet('nouvelle')}
                                    className="mt-4 px-6 py-2 rounded-xl text-white font-semibold"
                                    style={{ background: '#ff7300' }}>
                                    Créer une course
                                </button>
                            </div>
                        ) : (
                            courses.map((course: any) => (
                                <div key={course._id} className="card">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-gray-900">{course.reference}</p>
                                            <p className="text-sm text-gray-600 mt-0.5">{course.description_course}</p>
                                        </div>
                                        <span className={`badge ${STATUT_COLORS[course.statut] || 'badge-gray'}`}>
                                            {STATUT_LABELS[course.statut] || course.statut}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                            <span className="text-gray-700 truncate">{course.depart?.description}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                            <span className="text-gray-700 truncate">{course.arrivee?.description}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(course.createdAt).toLocaleDateString('fr-FR')}
                                            </span>
                                            <span className="font-bold" style={{ color: '#ff7300' }}>
                                                {course.paiement?.montant?.toLocaleString() || 0} FCFA
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            {course.livreur && (
                                                <a href={`tel:${course.livreur.telephone}`}
                                                    className="p-2 rounded-xl text-white" style={{ background: '#009639' }}>
                                                    <Phone className="w-4 h-4" />
                                                </a>
                                            )}
                                            {['en_attente', 'acceptee'].includes(course.statut) && (
                                                <button onClick={() => annulerCourse(course._id)}
                                                    className="px-3 py-1.5 rounded-xl text-white text-xs font-bold bg-red-500">
                                                    Annuler
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {course.livreur && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">👤</div>
                                            <div>
                                                <p className="text-sm font-bold">{course.livreur.prenom} {course.livreur.nom}</p>
                                                <p className="text-xs text-gray-500">⭐ {course.livreur.livreur_info?.note_moyenne}/5</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}