import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useSocket } from './hooks/useSocket';
import MobileLayout from './components/Layout/MobileLayout';
import BoutonAssistance from './components/BoutonAssistance';

// Auth
import LoginPage from './pages/auth/LoginPage';
import InscriptionPage from './pages/auth/InscriptionPage';

// Client
import ClientDashboard from './pages/client/ClientDashboard';
import CommercePage from './pages/client/CommercePage';
import PanierPage from './pages/client/PanierPage';
import MesCommandesPage from './pages/client/MesCommandesPage';
import SuiviCommandePage from './pages/client/SuiviCommandePage';
import CoursePriveePage from './pages/client/CoursePriveePage';

// Commercant
import CommercantDashboard from './pages/commercant/CommercantDashboard';

// Livreur
import LivreurDashboard from './pages/livreur/LivreurDashboard';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';

// Aide
import AidePage from './pages/aide/AidePage';

const ProtectedRoute = ({ children, roles }: { children: JSX.Element; roles?: string[] }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const HomeRedirect = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'client': return <Navigate to="/client" replace />;
    case 'commercant': return <Navigate to="/commercant" replace />;
    case 'livreur': return <Navigate to="/livreur" replace />;
    case 'admin': return <Navigate to="/admin" replace />;
    case 'gerant_zone': return <Navigate to="/admin" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  useSocket();
  return <>{children}</>;
};

function App() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { background: '#1f2937', color: '#fff', borderRadius: '12px', padding: '12px 16px' },
          success: { iconTheme: { primary: '#009639', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ff7300', secondary: '#fff' } },
        }}
      />

      {/* Socket.io + Bouton assistance actifs si connecté */}
      {user && (
        <SocketProvider>
          <BoutonAssistance />
        </SocketProvider>
      )}

      <MobileLayout>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/inscription" element={<InscriptionPage />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Client */}
          <Route path="/client" element={<ProtectedRoute roles={['client']}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/client/commerce/:id" element={<ProtectedRoute roles={['client']}><CommercePage /></ProtectedRoute>} />
          <Route path="/client/panier" element={<ProtectedRoute roles={['client']}><PanierPage /></ProtectedRoute>} />
          <Route path="/client/commandes" element={<ProtectedRoute roles={['client']}><MesCommandesPage /></ProtectedRoute>} />
          <Route path="/client/commandes/:id" element={<ProtectedRoute roles={['client']}><SuiviCommandePage /></ProtectedRoute>} />
          <Route path="/client/courses" element={<ProtectedRoute roles={['client']}><CoursePriveePage /></ProtectedRoute>} />

          {/* Commercant */}
          <Route path="/commercant" element={<ProtectedRoute roles={['commercant']}><CommercantDashboard /></ProtectedRoute>} />

          {/* Livreur */}
          <Route path="/livreur" element={<ProtectedRoute roles={['livreur']}><LivreurDashboard /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin', 'gerant_zone']}><AdminDashboard /></ProtectedRoute>} />

          {/* Aide */}
          <Route path="/aide" element={<ProtectedRoute><AidePage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MobileLayout>
    </BrowserRouter>
  );
}

export default App;