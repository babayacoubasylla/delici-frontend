import { useState } from 'react';
import { X, Phone, MessageCircle, HelpCircle } from 'lucide-react';

const NUMERO = '2250101322783'; // Format international CI
const NUMERO_AFFICHE = '01 01 32 27 83';

export default function BoutonAssistance() {
    const [ouvert, setOuvert] = useState(false);

    return (
        <>
            {/* Bouton flottant */}
            <button
                onClick={() => setOuvert(!ouvert)}
                className="fixed bottom-6 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-full text-white font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
                style={{
                    background: ouvert ? '#6b7280' : 'linear-gradient(135deg, #009639, #16a34a)',
                    boxShadow: '0 8px 25px rgba(0,150,57,0.4)'
                }}>
                {ouvert
                    ? <X className="w-5 h-5" />
                    : <>
                        <HelpCircle className="w-5 h-5" />
                        <span className="text-sm">Aide</span>
                    </>}
            </button>

            {/* Popup d'assistance */}
            {ouvert && (
                <div className="fixed bottom-20 right-4 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 text-white" style={{ background: 'linear-gradient(135deg, #ff7300, #e65100)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-xl">
                                🛵
                            </div>
                            <div>
                                <p className="font-bold text-sm">Support DeliCI</p>
                                <p className="text-xs opacity-90">Nous sommes disponibles 7j/7</p>
                            </div>
                        </div>
                    </div>

                    {/* Contenu */}
                    <div className="p-4 space-y-3">
                        <p className="text-sm text-gray-600 text-center">
                            Un problème ? Notre équipe vous répond rapidement !
                        </p>

                        {/* Numéro affiché */}
                        <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                            <p className="text-xs text-gray-500 mb-1">Numéro d'assistance</p>
                            <p className="text-xl font-bold text-gray-900">{NUMERO_AFFICHE}</p>
                        </div>

                        {/* Bouton WhatsApp */}
                        <a
                            href={`https://wa.me/${NUMERO}?text=Bonjour DeliCI, j'ai besoin d'aide 🙏`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
                            style={{ background: '#25D366' }}>
                            <MessageCircle className="w-5 h-5" />
                            WhatsApp
                        </a>

                        {/* Bouton Appel */}
                        <a
                            href={`tel:+225${NUMERO_AFFICHE.replace(/\s/g, '')}`}
                            className="flex items-center justify-center gap-3 w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
                            style={{ background: '#ff7300' }}>
                            <Phone className="w-5 h-5" />
                            Appeler maintenant
                        </a>

                        <p className="text-xs text-gray-400 text-center">
                            Lun - Dim : 7h00 - 22h00
                        </p>
                    </div>
                </div>
            )}

            {/* Overlay pour fermer */}
            {ouvert && (
                <div className="fixed inset-0 z-40" onClick={() => setOuvert(false)} />
            )}
        </>
    );
}