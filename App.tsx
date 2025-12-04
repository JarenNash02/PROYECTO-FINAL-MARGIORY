
import React, { useState, useEffect, useContext, createContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { ScheduleView } from './components/ScheduleView';
import { AdminDashboard } from './components/AdminDashboard';
import { ScheduleGenerator } from './components/ScheduleGenerator';
import { CoursesManager } from './components/CoursesManager';
import { generateMockSchedule, loadScheduleFromFirebase, saveScheduleToFirebase } from './services/scheduleService';
import { User, ScheduleBlock } from './types';
import { auth, db } from './services/firebase'; // Import db
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; // Import onSnapshot instead of getDoc

// Auth Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

// Firebase Auth Provider
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous firestore listener if exists
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (firebaseUser) {
        // We have an auth user, now let's listen to their profile in Firestore real-time
        const userRef = doc(db, "users", firebaseUser.uid);
        
        unsubscribeFirestore = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            // Data found, update state
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: userData.displayName || firebaseUser.displayName || 'Usuario',
              role: userData.role || 'user',
              career: userData.career,
              semester: userData.semester
            });
          } else {
            // Document doesn't exist (yet). 
            // This happens immediately after registration before the doc is written.
            // We set a temporary state, but because we are listening, 
            // it will auto-update the millisecond the doc is created.
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Cargando...',
              role: 'user', // Default safe role until data arrives
              career: 'APSTI',
              semester: 1
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setLoading(false);
        });

      } else {
        // Logged out
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
    // State will be handled by onAuthStateChanged
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ children, requireAdmin }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-brand-700 font-medium">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Main App Component
const AppContent: React.FC = () => {
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const initData = async () => {
      // 1. Try to load from Firebase
      const firebaseData = await loadScheduleFromFirebase();
      if (firebaseData && firebaseData.length > 0) {
        setSchedule(firebaseData);
      } else {
        // 2. Fallback to Mock Data
        const mockData = generateMockSchedule(); 
        setSchedule(mockData);
      }
    };

    if (user) {
      initData();
    }
  }, [user]);

  const handleScheduleUpdate = async (newSchedule: ScheduleBlock[]) => {
    // Optimistic update
    setSchedule(newSchedule);
    
    // Save to Firebase
    try {
      await saveScheduleToFirebase(newSchedule);
    } catch (err) {
      console.error("Failed to save schedule to Firebase", err);
      alert("Error al guardar en la nube. Verifique su conexión.");
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Student/General Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout title="Mi Horario Académico">
            <ScheduleView schedule={schedule} user={user!} />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <Layout title="Dashboard Administrativo">
            <AdminDashboard schedule={schedule} />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/careers" element={
        <ProtectedRoute requireAdmin>
          <Layout title="Gestión de Cursos y Carreras">
            <CoursesManager />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/generate" element={
        <ProtectedRoute requireAdmin>
          <Layout title="Generación de Horarios">
            <ScheduleGenerator onScheduleGenerated={handleScheduleUpdate} />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
}
