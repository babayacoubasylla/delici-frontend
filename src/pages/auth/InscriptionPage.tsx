import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, User, MapPin, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const VILLES = [
    'Bouaké', 'Yamoussoukro', 'San Pedro', 'Daloa',
    'Gagnoa', 'Man', 'Korhogo', 'Soubré', 'Divo', 'Sinfra'
];

export default function InscriptionPage() {
    const navigate = useNavigate();
    const { inscription, loading, error, clearError } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({
        nom: '', prenom: '', telephone: '',
        password: '', ville: '', role: 'client'
    });

    const updateField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        const success = await inscription(form);
        if (success) {
            toast.success('Compte créé avec succès !');
            navigate('/');
        } else {
            toast.error(error || 'Erreur lors de l\'inscription');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
                        style={{ background: 'linear-gradient(135deg, #ff7300, #e65100)' }}>
                        <span className="text-3xl">🛵</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
                    <p className="text-gray-500 text-sm mt-1">Rejoignez DeliCI !</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Rôle */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Je suis</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'client', label: 'Client', icon: '🛍️' },
                                    { value: 'livreur', label: 'Livreur', icon: '🛵' },
                                    { value: 'commercant', label: 'Commercant', icon: '🏪' },
                                ].map((opt) => (
                                    <button key={opt.value} type="button"
                                        onClick={() => updateField('role', opt.value)}
                                        className="p-3 border-2 rounded-xl text-center transition-all"
                                        style={{
                                            borderColor: form.role === opt.value ? '#ff7300' : '#e5e7eb',
                                            background: form.role === opt.value ? '#fff8f0' : 'white'
                                        }}>
                                        <div className="text-xl mb-1">{opt.icon}</div>
                                        <div className="text-xs font-semibold text-gray-700">{opt.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Nom & Prénom */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" value={form.nom}
                                        onChange={(e) => updateField('nom', e.target.value)}
                                        className="input-field pl-10 text-sm" placeholder="Sylla" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom</label>
                                <input type="text" value={form.prenom}
                                    onChange={(e) => updateField('prenom', e.target.value)}
                                    className="input-field text-sm" placeholder="Baba" required />
                            </div>
                        </div>

                        {/* Téléphone */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="tel" value={form.telephone}
                                    onChange={(e) => updateField('telephone', e.target.value)}
                                    className="input-field pl-11" placeholder="0700000000" required />
                            </div>
                        </div>

                        {/* Ville */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ville</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select value={form.ville}
                                    onChange={(e) => updateField('ville', e.target.value)}
                                    className="input-field pl-11 appearance-none" required>
                                    <option value="">Sélectionnez votre ville</option>
                                    {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Mot de passe */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(e) => updateField('password', e.target.value)}
                                    className="input-field pl-11 pr-11" placeholder="Min. 6 caractères"
                                    minLength={6} required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Message livreur/commercant */}
                        {form.role !== 'client' && (
                            <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs px-4 py-3 rounded-xl">
                                ℹ️ Votre compte sera validé par notre équipe avant activation.
                            </div>
                        )}

                        {/* Erreur */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Bouton */}
                        <button type="submit" disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                            style={{ background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #ff7300, #e65100)' }}>
                            {loading
                                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : 'Créer mon compte'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-4">
                        Déjà un compte ?{' '}
                        <Link to="/login" className="font-semibold" style={{ color: '#ff7300' }}>
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}