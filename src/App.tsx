// src/App.tsx

import { createContext, useContext, useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Outlet,
  Navigate,
} from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';

// (NEW) Import icons for the new header
import { Briefcase, User, ChevronDown, LogOut, Home } from 'lucide-react';

// (NEW) Import Framer Motion for animations
import { motion, AnimatePresence } from 'framer-motion';

// Import Supabase client
import { supabase } from './lib/supabaseClient';

// Import all the pages
import { BrowsePage } from './pages/BrowsePage';
import { HotelDetailPage } from './pages/HotelDetailPage';
import { LoginPage } from './pages/LoginPage';
import { BookingPreviewPage } from './pages/BookingPreviewPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { AccountPage } from './pages/AccountPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { MyAccommodationsPage } from './pages/MyAccomodationsPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ThreeTabSessionShell } from './layouts/ThreeTabSessionShell';

// --- REAL Auth Context ---
type AuthContextType = {
  session: Session | null;
  isAuthenticated: boolean;
};
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-lg font-semibold text-gray-700">Loading session...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, isAuthenticated: !!session }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Protected Route ---
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// --- (NEW) User Dropdown Menu ---
const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const auth = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
  };

  if (!auth.isAuthenticated) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full py-1 pl-2 pr-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {/* You can add user.avatar_url here later */}
          <User size={18} className="text-gray-500" />
        </div>
        <span className="hidden md:inline">My Account</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            <div className="p-2">
              <p className="text-xs text-gray-500 px-3 pt-1 pb-2">
                {auth.session?.user?.email}
              </p>
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              >
                <User size={16} />
                Profile
              </Link>
              <Link
                to="/bookings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              >
                <Briefcase size={16} />
                My Bookings
              </Link>
              <Link
                to="/accommodations"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              >
                <Home size={16} />
                My Stays
              </Link>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- (MODIFIED) Main Layout (AppShell) ---
const Layout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <header className="sticky top-0 z-40 w-full bg-white/90 shadow-sm border-b border-gray-200 backdrop-blur-sm">
        <nav className="container mx-auto max-w-7xl flex justify-between items-center h-16 p-4">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            ProBooker
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 hidden sm:block"
            >
              Browse
            </Link>

            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        </nav>
      </header>
      <main>
        {/* The rest of your app renders here */}
        <Outlet />
      </main>
    </div>
  );
};

// --- The Main App Component ---
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* --- Public Routes --- */}
            <Route index element={<BrowsePage />} />
            <Route path="hotel/:slug" element={<HotelDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<Navigate to="/login" replace />} />
            
            <Route path="reset-password" element={<ResetPasswordPage />} />

            {/* --- Protected Routes --- */}
            <Route element={<ProtectedRoute />}>
              
              <Route path="booking/preview" element={<BookingPreviewPage />} />
              <Route path="booking/confirmation/:ref" element={<BookingConfirmationPage />} />

              {/* Session Shell (Tabs) */}
              <Route element={<ThreeTabSessionShell />}>
                <Route path="profile" element={<AccountPage />} />
                <Route path="bookings" element={<MyBookingsPage />} />
                <Route path="accommodations" element={<MyAccommodationsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;