import React, { useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// (NEW) Import the new AuthForm component
import { AuthForm } from '../components/AuthForm';

// Import the real useAuth hook from App.tsx
import { useAuth } from '../App';

/**
 * (UPDATED) Login screen using the reusable AuthForm component.
 */
export const LoginPage = () => {
  const navigate = useNavigate();
  const auth = useAuth(); // Get the real auth state
  const isAuthenticated = auth?.isAuthenticated;

  // 1. Check if the user is already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 2. Handle a successful login from the AuthForm component
  // (This logic remains the same)
  const handleLoginSuccess = (user: SupabaseUser) => {
    console.log("Login successful, navigating to profile:", user.id);
    
    // We navigate to /profile.
    // The AuthProvider in App.tsx will handle redirecting
    // to /create-password if this is a new user.
    navigate('/profile', { replace: true });
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <a
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 mb-4"
        >
          <ChevronLeft size={16} />
          Back to home
        </a>
        <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-200">
          {/* (UPDATED) New header text */}
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Welcome
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Sign in to your account or create a new one.
          </p>

          {/* (UPDATED) Use the new AuthForm component */}
          <AuthForm onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  // This default export might need to be wrapped in a
  // Router and AuthProvider to work correctly in isolation.
  return <LoginPage />;
}