import { createContext, useContext, useState } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Link, 
  Outlet, 
  Navigate 
} from 'react-router-dom';

// Import all the pages (Removed .tsx extensions to help with module resolution)
import { BrowsePage } from './pages/BrowsePage';
import { HotelDetailPage } from './pages/HotelDetailPage';
import { LoginPage } from './pages/LoginPage';
import { BookingPreviewPage } from './pages/BookingPreviewPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { AccountPage } from './pages/AccountPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
// Using the filename as provided (with one 'm')
import { MyAccommodationsPage } from './pages/MyAccomodationsPage';

// --- Mock Auth Context ---
// This simulates the user's login state as specified in the JSON.
// In a real app, this would be powered by Supabase.
type AuthContextType = {
  isAuthenticated: boolean;
  login: (callback: () => void) => void;
  logout: (callback: () => void) => void;
};
const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  return useContext(AuthContext);
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (callback: () => void) => {
    setIsAuthenticated(true);
    callback(); // Navigate after setting state
  };

  const logout = (callback: () => void) => {
    setIsAuthenticated(false);
    callback();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Protected Route ---
// This component protects routes as specified in the JSON.
const ProtectedRoute = () => {
  const auth = useAuth();
  if (!auth?.isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  return <Outlet />; // Render the child route (e.g., AccountPage)
};

// --- Main Layout (AppShell) ---
// This provides the top navigation bar for all pages.
const Layout = () => {
  const auth = useAuth();
  return (
    <div>
      <header className="bg-white shadow-sm p-4 border-b border-gray-200 sticky top-0 z-30">
        <nav className="container mx-auto max-w-7xl flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">ProBooker</Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link to="/" className="text-gray-700 hover:text-blue-600">Browse</Link>
            <Link to="/bookings" className="text-gray-700 hover:text-blue-600">My Bookings</Link>
            <Link to="/accommodations" className="text-gray-700 hover:text-blue-600">My Stays</Link>
            <Link to="/profile" className="text-gray-700 hover:text-blue-600">My Account</Link>
            {auth?.isAuthenticated ? (
              <button 
                onClick={() => auth.logout(() => console.log('Logged out'))} 
                className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-semibold"
              >
                Log Out
              </button>
            ) : (
              <Link to="/login" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold">
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
            
            {/* This is a simplified login page.
              In a real app, you'd pass the `login` function from useAuth()
              down to the LoginPage to be called on success.
            */}
            <Route path="login" element={<LoginPage />} />
            
            {/* SignupPage.tsx was not provided, so this route points to LoginPage */}
            <Route path="signup" element={<Navigate to="/login" replace />} />
            
            <Route path="booking/preview" element={<BookingPreviewPage />} />
            <Route path="booking/confirmation/:ref" element={<BookingConfirmationPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="profile" element={<AccountPage />} />
              <Route path="bookings" element={<MyBookingsPage />} />
              <Route path="accommodations" element={<MyAccommodationsPage />} />
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



