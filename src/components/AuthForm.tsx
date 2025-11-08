import React, { useState } from 'react';
import { Mail, Key, Loader2, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Import your Supabase client
import { supabase } from '../lib/supabaseClient';

// --- (NEW) Schemas (as requested in your new flow) ---
// (You should move these to src/lib/schemas.ts)
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});
type LoginFormData = z.infer<typeof loginSchema>;

const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  // TODO: Add a real captcha validation schema if using a library
  captcha: z.string().optional(), 
});
type SignupFormData = z.infer<typeof signupSchema>;


// --- Component Props ---
type AuthFormProps = {
  onLoginSuccess: (user: SupabaseUser) => void;
};

// --- Helper: Root Error Display ---
const RootError = ({ error }: { error?: { message?: string } }) => {
  if (!error?.message) return null;
  return (
    <div className="bg-red-100 border border-red-300 text-red-700 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
      <AlertCircle size={16} />
      {error.message}
    </div>
  );
};

// --- Framer Motion Variants ---
const formVariants = {
  hidden: { opacity: 0, x: 30, transition: { duration: 0.2 } },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
};

// --- Main AuthForm Component ---
export const AuthForm = ({ onLoginSuccess }: AuthFormProps) => {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [isSignUpSuccess, setIsSignUpSuccess] = useState(false);

  // --- Sign In Form ---
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    setError: setLoginError,
    formState: { errors: loginErrors, isSubmitting: isLoginLoading },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // --- Sign Up Form ---
  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    setError: setSignupError,
    formState: { errors: signupErrors, isSubmitting: isSignupLoading },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  // --- Logic: Handle Sign In (FIXED) ---
  const handleLogin = async (formData: LoginFormData) => {
    // --- THIS IS THE FIX ---
    // Destructure the response from Supabase into a new 'response' object
    const { data: responseData, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
    // --- END OF FIX ---

    if (error) {
      setLoginError('root', { message: error.message });
    } else if (responseData.user) {
      // Check 'responseData.user' instead of 'formData.user'
      onLoginSuccess(responseData.user);
    }
  };

  // --- Logic: Handle Sign Up ---
  const handleSignUp = async (data: SignupFormData) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        shouldCreateUser: true, 
        emailRedirectTo: `${window.location.origin}/create-password`,
      },
    });

    if (error) {
      setSignupError('root', { message: error.message });
    } else {
      setIsSignUpSuccess(true); // Show "Check your email" message
    }
  };

  // --- UI: Tab Button ---
  const TabButton = ({
    label,
    isActive,
    onClick,
  }: {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-1/2 p-3 font-semibold text-center relative ${
        isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      {label}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"
          layoutId="activeTab" 
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );

  return (
    <div className="w-full max-w-sm">
      {/* --- Success Message (for Sign Up) --- */}
      {isSignUpSuccess ? (
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Mail size={48} className="mx-auto text-green-500" />
            <h2 className="text-2xl font-bold text-gray-800 mt-4">
              Check your email
            </h2>
            <p className="text-gray-600 mt-2">
              We sent a confirmation link to your email address. Click it to
              continue.
            </p>
          </motion.div>
        </div>
      ) : (
        <>
          {/* --- Tab Selector --- */}
          <div className="flex border-b border-gray-200 mb-6">
            <TabButton
              label="Sign In"
              isActive={mode === 'signIn'}
              onClick={() => setMode('signIn')}
            />
            <TabButton
              label="Sign Up"
              isActive={mode === 'signUp'}
              onClick={() => setMode('signUp')}
            />
          </div>

          {/* --- Animated Form Container --- */}
          <AnimatePresence mode="wait">
            {mode === 'signIn' && (
              <motion.form
                key="signIn"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleLoginSubmit(handleLogin)}
                className="space-y-4"
              >
                <RootError error={loginErrors.root} />
                
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email-login"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="email-login"
                      type="email"
                      placeholder="you@example.com"
                      className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                        loginErrors.email
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      {...registerLogin('email')}
                    />
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {loginErrors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password-login"
                    className="text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="password-login"
                      type="password"
                      placeholder="••••••••"
                      className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                        loginErrors.password
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      {...registerLogin('password')}
                    />
                    <Key
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                  {loginErrors.password && (
                    <p className="mt-1 text-xs text-red-600">
                      {loginErrors.password.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                >
                  {isLoginLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    'Sign In'
                  )}
                  {!isLoginLoading && <ArrowRight size={20} />}
                </button>
              </motion.form>
            )}

            {mode === 'signUp' && (
              <motion.form
                key="signUp"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleSignupSubmit(handleSignUp)}
                className="space-y-4"
              >
                <RootError error={signupErrors.root} />

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email-signup"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="email-signup"
                      type="email"
                      placeholder="you@example.com"
                      className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                        signupErrors.email
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      {...registerSignup('email')}
                    />
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                  {signupErrors.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {signupErrors.email.message}
                    </p>
                  )}
                </div>

                {/* --- Captcha Placeholder --- */}
                <div>
                  <label
                    htmlFor="captcha-signup"
                    className="text-sm font-medium text-gray-700"
                  >
                    Captcha
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="captcha-signup"
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
                    {/* TODO: Implement a real captcha service like hCaptcha or reCAPTCHA */}
                    Captcha would be here.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSignupLoading}
                  className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                >
                  {isSignupLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    'Send Confirmation Link'
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};