import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, User, Map, Menu, X, Package, Truck, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getNavItems = () => {
    switch (user?.role) {
      case 'client':
        return [
          { icon: Home, label: 'Accueil', path: '/client' },
          { icon: ShoppingBag, label: 'Commandes', path: '/client/commandes' },
          { icon: Map, label: 'Courses', path: '/client/courses' },
          { icon: User, label: 'Profil', path: '/client/profil' },
        ];
      case 'livreur':
        return [
          { icon: Home, label: 'Missions', path: '/livreur' },
          { icon: Map, label: 'Courses', path: '/livreur?tab=courses' },
          { icon: Package, label: 'Historique', path: '/livreur?tab=historique' },
          { icon: BarChart3, label: 'Stats', path: '/livreur?tab=stats' },
        ];
      case 'commercant':
        return [
          { icon: Home, label: 'Dashboard', path: '/commercant' },
          { icon: ShoppingBag, label: 'Commandes', path: '/commercant/commandes' },
          { icon: Package, label: 'Produits', path: '/commercant/produits' },
          { icon: User, label: 'Profil', path: '/commercant/profil' },
        ];
      case 'admin':
      case 'gerant_zone':
        return [
          { icon: Home, label: 'Dashboard', path: '/admin' },
          { icon: ShoppingBag, label: 'Commandes', path: '/admin/commandes' },
          { icon: User, label: 'Utilisateurs', path: '/admin/users' },
          { icon: BarChart3, label: 'Stats', path: '/admin/stats' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  // Vérifier si un chemin est actif (gère les query params)
  const isActive = (path: string) => {
    if (path.includes('?')) {
      const [basePath, query] = path.split('?');
      return location.pathname === basePath && location.search === `?${query}`;
    }
    return location.pathname === path;
  };

  // Si c'est un écran desktop, afficher le layout normal sans bottom bar
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header mobile */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">DeliCI</h1>
              <p className="text-xs text-gray-500">{user?.ville || 'Côte d\'Ivoire'}</p>
            </div>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
          </button>
        </div>

        {/* Menu mobile déroulant */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-10 animate-slideDown">
            <div className="p-4">
              {/* Profil utilisateur */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-500 font-bold text-lg">
                    {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{user?.prenom} {user?.nom}</p>
                  <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                  <p className="text-xs text-gray-400">{user?.telephone}</p>
                </div>
              </div>

              {/* Navigation */}
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                    isActive(item.path)
                      ? 'bg-orange-50 text-orange-500'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}

              {/* Déconnexion */}
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 mt-2 transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Contenu principal */}
      <main className="pb-4">
        {children}
      </main>

      {/* Navigation inférieure (bottom bar) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20 safe-bottom">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-2 px-4 transition-all duration-200 ${
                  active ? 'text-orange-500' : 'text-gray-500'
                }`}
              >
                <item.icon className={`w-6 h-6 ${active ? 'stroke-2' : 'stroke-1'}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}