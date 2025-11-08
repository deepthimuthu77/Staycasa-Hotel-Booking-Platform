import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Loader2, AlertCircle, Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// (NEW) Import the specific schema for this page
import { createPasswordSchema } from '../lib/schemas';

// Import Supabase client and auth hook
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../App';

// (NEW) Define form data type
type CreatePasswordFormData = z.infer<typeof createPasswordSchema>;

// --- Helper: Root Error Display ---
const RootError = ({ message }: { message: string | null }) => {
  if (!message) return null;
  return (
    <div className="bg-red-100 border border-red-300 text-red-700 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
      <AlertCircle size={16} />
      {message}
    </div>
  );
};

/**
 * This page is shown ONCE after a new user signs up via magic link.
 * It forces them to create a password to complete their account.
 */
export const CreatePasswordPage = () => {
  const navigate = useNavigate();
  const auth = useAuth(); // Get the currently logged-in user
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePasswordFormData>({
    resolver: zodResolver(createPasswordSchema),
  });

  // --- Logic: Handle Setting Password ---
  const handleSetPassword = async (data: CreatePasswordFormData) => {
    setServerError(null);

    // TODO: Add real captcha validation here

    // Update the password for the currently logged-in user
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setServerError(error.message);
    } else {
      // Success! Redirect to the main app dashboard
      navigate('/profile', { replace: true });
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-200">
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto text-green-500" />
            <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
              Welcome!
            </h1>
            <p className="text-gray-600 mb-6">
              Your email is confirmed. Just one last step: please create a
              password for your account.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(handleSetPassword)}
            className="space-y-4"
          >
            <RootError message={serverError} />

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type="password"
                  placeholder="•••••••• (at least 8 characters)"
                  className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  {...register('password')}
                />
                <Key
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  {...register('confirmPassword')}
                />
                <Key
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* --- Captcha Placeholder --- */}
            <div>
              <label
                htmlFor="captcha"
                className="text-sm font-medium text-gray-700"
              >
                Captcha
              </label>
              <div className="relative mt-1">
                <input
                  id="captcha"
                  type="text"
                  placeholder="Captcha (e.g., hCaptcha)"
                  disabled
                  className="w-full p-3 pl-10 border rounded-lg bg-gray-100 cursor-not-allowed"
                />
                <Shield
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {/* TODO: Implement a real captcha service */}
                Captcha would be here.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                'Set Password & Continue'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  return <CreatePasswordPage />;
}