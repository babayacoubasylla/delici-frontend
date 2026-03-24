import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

const NUMERO = '2250101322783';
const NUMERO_AFFICHE = '01 01 32 27 83';

const FAQ = [
  {
    q: "Comment passer une commande ?",
    a: "Choisissez un commerce, ajoutez des produits au panier, renseignez votre adresse (ou utilisez le GPS), puis confirmez. Un livreur sera assigné automatiquement."
  },
  {
    q: "Comment suivre ma commande ?",
    a: "Allez dans 'Mes commandes' pour voir le statut en temps réel. Vous recevez des notifications à chaque étape."
  },
  {
    q: "Comment fonctionne la course privée ?",
    a: "Cliquez sur 🛵 dans le menu, indiquez le point de départ et d'arrivée, décrivez votre course et proposez un montant. Un livreur disponible l'acceptera."
  },
  {
    q: "Quels sont les modes de paiement ?",
    a: "Actuellement nous acceptons les paiements en espèces à la livraison. Orange Money, MTN Money et Wave seront disponibles prochainement."
  },
  {
    q: "Comment devenir livreur DeliCI ?",
    a: "Inscrivez-vous avec le rôle 'Livreur'. Votre compte sera validé par notre équipe sous 24h. Vous pourrez ensuite accepter des missions."
  },
  {
    q: "Comment ajouter mon commerce sur DeliCI ?",
    a: "Inscrivez-vous avec le rôle 'Commercant'. Notre équipe validera votre commerce et vous contactera pour finaliser l'inscription."
  },
  {
    q: "Ma commande est annulée, que faire ?",
    a: "Contactez notre support via WhatsApp ou par téléphone. Nous vous aiderons à résoudre le problème rapidement."
  },
  {
    q: "Dans quelles villes DeliCI est disponible ?",
    a: "DeliCI opère à Bouaké, Yamoussoukro, Daloa, Gagnoa, San Pedro, Man, Korhogo, Soubré, Divo et Sinfra."
  },
];

export default function AidePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [ouvert, setOuvert] = useState<number | null>(null);

  const retour = () => {
    switch (user?.role) {
      case 'client': navigate('/client'); break;
      case 'commercant': navigate('/commercant'); break;
      case 'livreur': navigate('/livreur'); break;
      case 'admin': navigate('/admin'); break;
      default: navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b-4 border-orange-500">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={retour} className="p-2 bg-gray-100 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Aide & Support</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Bannière */}
        <div className="rounded-2xl p-6 text-white text-center"
          style={{ background: 'linear-gradient(135deg, #ff7300, #e65100)' }}>
          <p className="text-4xl mb-3">🛵</p>
          <h2 className="text-2xl font-bold mb-2">Support DeliCI</h2>
          <p className="opacity-90 text-sm">Notre équipe est disponible 7j/7 de 7h à 22h pour vous aider</p>
        </div>

        {/* Contacts */}
        <div className="card space-y-3">
          <h3 className="font-bold text-gray-900 text-lg">📞 Nous contacter</h3>

          <div className="bg-gray-50 rounded-xl px-4 py-3 text-center mb-2">
            <p className="text-xs text-gray-500 mb-1">Numéro d'assistance DeliCI</p>
            <p className="text-2xl font-bold text-gray-900">{NUMERO_AFFICHE}</p>
            <p className="text-xs text-gray-400 mt-1">Côte d'Ivoire</p>
          </div>

          <a href={`https://wa.me/${NUMERO}?text=Bonjour DeliCI, j'ai besoin d'aide 🙏`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl text-white font-bold transition-all hover:scale-[1.02]"
            style={{ background: '#25D366' }}>
            <MessageCircle className="w-6 h-6" />
            Contacter sur WhatsApp
          </a>

          <a href={`tel:+2250101322783`}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl text-white font-bold transition-all hover:scale-[1.02]"
            style={{ background: '#ff7300' }}>
            <Phone className="w-6 h-6" />
            Appeler le support
          </a>
        </div>

        {/* FAQ */}
        <div className="card">
          <h3 className="font-bold text-gray-900 text-lg mb-4">❓ Questions fréquentes</h3>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOuvert(ouvert === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                  <p className="font-semibold text-gray-900 text-sm pr-3">{item.q}</p>
                  {ouvert === i
                    ? <ChevronUp className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {ouvert === i && (
                  <div className="px-4 pb-4 bg-orange-50">
                    <p className="text-sm text-gray-600">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Infos app */}
        <div className="card text-center">
          <p className="text-3xl mb-2">🛵</p>
          <p className="font-bold text-gray-900">DeliCI</p>
          <p className="text-sm text-gray-500">Livraison rapide en Côte d'Ivoire</p>
          <p className="text-xs text-gray-400 mt-2">Version 1.0.0</p>
          <p className="text-xs text-gray-400">© 2024 DeliCI — Tous droits réservés</p>
        </div>
      </div>
    </div>
  );
}