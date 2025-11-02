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

// Import your new Supabase client
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

// --- (NEW) Import the session shell layout ---
// (Assuming you created the file in `src/layouts/ThreeTabSessionShell.tsx`)
import { ThreeTabSessionShell } from './layouts/ThreeTabSessionShell';

// --- REAL Auth Context ---
// This context will hold the real Supabase session
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

    // 2. Listen for auth state changes (login, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // 3. Clean up the listener on unmount
    return () => subscription.unsubscribe();
  }, []);

  // Show a loading spinner or blank page while session is being fetched
  if (loading) {
    // You can replace this with a more polished global loader
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
// This component now uses the real auth state
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  return <Outlet />; // Render the child route (e.g., ThreeTabSessionShell)
};

// --- Main Layout (AppShell) ---
// This provides the top navigation bar for all pages.
const Layout = () => {
  const { isAuthenticated, session } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // No navigation needed, the onAuthStateChange listener will
    // automatically update the state and re-render.
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
            
            {/* (UPDATED) These links now point to the pages within the shell */}
            {isAuthenticated && (
              <>
                <Link
                  to="/bookings"
                  className="text-gray-700 hover:text-blue-600"
                >
                  My Bookings
                </Link>
                <Link
                  to="/accommodations"
                  className="text-gray-700 hover:text-blue-600"
                >
                  My Stays
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-blue-600"
                >
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
                Login
              </Link>
            )}
          </div>
        </nav>
      </header>
      <main>
        {/* The child routes will render here */}
        <Outlet />
      </main>
    </div>
  );
};

// --- The Main App Component ---
// This sets up the auth provider and all the routes.
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* All pages are nested under the main Layout */}
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<BrowsePage />} />
            <Route path="hotel/:slug" element={<HotelDetailPage />} />

            {/* LoginPage now handles the real auth flow */}
            <Route path="login" element={<LoginPage />} />

            {/* SignupPage.tsx was not provided, so this route points to LoginPage */}
            <Route path="signup" element={<Navigate to="/login" replace />} />

            <Route path="booking/preview" element={<BookingPreviewPage />} />
            <Route
              path="booking/confirmation/:ref"
              element={<BookingConfirmationPage />}
            />

            {/* --- (UPDATED) Protected Routes --- */}
            {/* This block checks if the user is authenticated.
              If they are, it renders the <Outlet />, which is the
              <ThreeTabSessionShell />.
            */}
            <Route element={<ProtectedRoute />}>
              {/* This shell provides the tabbed navigation and an <Outlet />
                for its own child pages.
              */}
              <Route element={<ThreeTabSessionShell />}>
                {/* These routes render *inside* the ThreeTabSessionShell's Outlet.
                  e.g., Navigating to /profile renders:
                  <Layout> -> <ProtectedRoute> -> <ThreeTabSessionShell> -> <AccountPage>
                */}
                <Route path="profile" element={<AccountPage />} />
                <Route path="bookings" element={<MyBookingsPage />} />
                <Route
                  path="accommodations"
                  element={<MyAccommodationsPage />}
                />
              </Route>
            </Route>

            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;