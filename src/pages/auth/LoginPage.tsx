import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, loading, error, clearError } = useAuthStore();
    const [telephone, setTelephone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        const success = await login(telephone, password);
        if (success) {
            toast.success('Bienvenue sur DeliCI !');
            navigate('/');
        } else {
            toast.error(error || 'Erreur de connexion');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
                        style={{ background: 'linear-gradient(135deg, #ff7300, #e65100)' }}>
                        <span className="text-4xl">🛵</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">DeliCI</h1>
                    <p className="text-gray-500 mt-1">Livraison rapide en Côte d'Ivoire</p>
                </div>

                {/* Formulaire */}
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Connexion</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Téléphone */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Numéro de téléphone
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    value={telephone}
                                    onChange={(e) => setTelephone(e.target.value)}
                                    className="input-field pl-11"
                                    placeholder="0700000000"
                                    required
                                />
                            </div>
                        </div>

                        {/* Mot de passe */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-11 pr-11"
                                    placeholder="Votre mot de passe"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Erreur */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Bouton */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                            style={{ background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #ff7300, #e65100)' }}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : 'Se connecter'}
                        </button>
                    </form>

                    {/* Lien inscription */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        Pas encore de compte ?{' '}
                        <Link to="/inscription" className="font-semibold" style={{ color: '#ff7300' }}>
                            S'inscrire
                        </Link>
                    </p>
                </div>

                {/* Drapeau ivoirien */}
                <div className="flex justify-center mt-6 gap-1">
                    <div className="w-8 h-3 rounded-l-sm" style={{ background: '#ff7300' }} />
                    <div className="w-8 h-3 bg-white border border-gray-200" />
                    <div className="w-8 h-3 rounded-r-sm" style={{ background: '#009639' }} />
                </div>
            </div>
        </div>
    );
}