import React, { useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Import the reusable component
import { AuthOtpFlow } from '../components/AuthOtpFlow';

// Import the real useAuth hook from App.tsx
import { useAuth } from '../App';

// Import your Supabase client
// We still need supabase for AuthOtpFlow, but not in this component
// import { supabase } from '../lib/supabaseClient';

/**
 * OTP login screen using the reusable AuthOtpFlow component.
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

  // 2. Handle a successful login from the AuthOtpFlow component
  // --- THIS IS THE FIX ---
  // The database trigger now handles profile creation.
  // This function just needs to navigate the user.
  const handleLoginSuccess = (user: SupabaseUser) => {
    console.log("Login successful, navigating to profile:", user.id);
    // The database trigger has already created the profile.
    // We can safely navigate to the profile page.
    navigate('/profile', { replace: true });
  };
  // --- END OF FIX ---

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
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Log in or sign up with a one-time code.
          </p>

          {/* Use the imported reusable component */}
          <AuthOtpFlow onLoginSuccess={handleLoginSuccess} />
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

