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

// --- (NEW) Import new pages ---

import { CreatePasswordPage } from './pages/CreatePasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Import the session shell layout
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

// --- Main Layout (AppShell) ---
const Layout = () => {
  const { isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div>
      <header className="bg-white shadow-sm p-4 border-b border-gray-200 sticky top-0 z-30">
        <nav className="container mx-auto max-w-7xl flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            ProBooker
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link to="/" className="text-gray-700 hover:text-blue-600">
              Browse
            </Link>
            
            {isAuthenticated && (
              <>
                <Link to="/bookings" className="text-gray-700 hover:text-blue-600">
                  My Bookings
                </Link>
                <Link to="/accommodations" className="text-gray-700 hover:text-blue-600">
                  My Stays
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-blue-600">
                  My Account
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-semibold"
              >
                Log Out
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold"
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        </nav>
      </header>
      <main>
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
            
            {/* (NEW) Public route for password reset (OTP flow) */}
            <Route path="reset-password" element={<ResetPasswordPage />} />

            {/* --- Protected Routes --- */}
            <Route element={<ProtectedRoute />}>
              
              {/* (NEW) Route for setting password after magic link signup */}
              {/* It must be protected because the user is logged in via the link */}
              <Route path="create-password" element={<CreatePasswordPage />} />

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