import React, { useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Import the reusable component
import { AuthOtpFlow } from '../components/AuthOtpFlow';

// Import the real useAuth hook from App.tsx
// Make sure App.tsx exports useAuth
import { useAuth } from '../App';

// Import your Supabase client
import { supabase } from '../lib/supabaseclient';

// --- TYPE DEFINITIONS (REMOVED) ---
// We no longer need the mock User type

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
      // If user is already logged in, redirect them
      // to their profile. No need to show the login page.
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 2. Handle a successful login from the AuthOtpFlow component
  const handleLoginSuccess = async (user: SupabaseUser) => {
    try {
      // 3. This is a critical step:
      // After Supabase auth, we create (or update) a matching
      // row in our public 'users' table.
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: user.id, // The user's auth ID
          email: user.email,
          updated_at: new Date().toISOString(),
          // full_name, bio, etc. will be null until the user
          // edits them on the AccountPage.
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error.message);
      }

      // 4. Navigate the user to their profile page
      navigate('/profile', { replace: true });
    } catch (err) {
      console.error('Error in login success handler:', err);
    }
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