// src/components/AuthForm.tsx
import React, { useState } from 'react';
import { Mail, Key, Loader2, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// React Hook Form + Zod
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Import your Supabase client
import { supabase } from '../lib/supabaseClient';

// (UPDATED) Import the new schemas
import { loginSchema, signupEmailSchema, signupVerifySchema } from '../lib/schemas';

// (UPDATED) Form data types
type LoginFormData = z.infer<typeof loginSchema>;
type SignupEmailFormData = z.infer<typeof signupEmailSchema>;
type SignupVerifyFormData = z.infer<typeof signupVerifySchema>;


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

// --- Main AuthForm Component (UPDATED) ---
export const AuthForm = ({ onLoginSuccess }: AuthFormProps) => {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  // (NEW) State for the multi-step sign-up flow
  const [signUpStep, setSignUpStep] = useState<'email' | 'verify'>('email');
  const [signUpEmail, setSignUpEmail] = useState<string>(''); // To store email between steps
  const [serverError, setServerError] = useState<string | null>(null);

  // --- Sign In Form ---
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    setError: setLoginError,
    formState: { errors: loginErrors, isSubmitting: isLoginLoading },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // --- (UPDATED) Sign Up Step 1: Email Form ---
  const signUpEmailForm = useForm<SignupEmailFormData>({
    resolver: zodResolver(signupEmailSchema),
  });

  // --- (NEW) Sign Up Step 2: Verify OTP + Set Password Form ---
  const signUpVerifyForm = useForm<SignupVerifyFormData>({
    resolver: zodResolver(signupVerifySchema),
    defaultValues: {
      email: '', // Will be set when step changes
    },
  });

  
  // --- Logic: Handle Sign In (Corrected Bug) ---
  const handleLogin = async (formData: LoginFormData) => {
    setServerError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setLoginError('root', { message: error.message });
    } else if (data.session) {
      // SUCCESS: A session was created
      onLoginSuccess(data.user);
    } else if (data.user && !data.session) {
      // BUG: User exists, but password was wrong
      setLoginError('root', { message: 'Invalid login credentials' });
    } else {
      setLoginError('root', { message: 'An unknown error occurred.' });
    }
  };


  // --- (NEW) Logic: Handle Sign Up - Step 1 (Request OTP) ---
  const handleRequestOtp = async (data: SignupEmailFormData) => {
    setServerError(null);
    // This function now just sends the OTP code.
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      signUpEmailForm.setError('root', { message: error.message });
    } else {
      // Save email and move to the next step
      setSignUpEmail(data.email);
      signUpVerifyForm.setValue('email', data.email); // Pre-fill email in next form
      setSignUpStep('verify');
    }
  };

  // --- (NEW) Logic: Handle Sign Up - Step 2 (Verify OTP & Set Password) ---
  const handleVerifyAndSetPassword = async (data: SignupVerifyFormData) => {
    setServerError(null);
    try {
      // 1. Verify the OTP. This logs the user in.
      const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.otp,
        type: 'signup', // Use 'signup' type
      });

      if (verifyError) throw verifyError;
      
      // --- (FIXED) Check for both session and user ---
      if (!sessionData.session || !sessionData.user) {
        throw new Error("Could not verify OTP. Please try again.");
      }

      // 2. User is now logged in. Set their password.
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      });

      if (updateError) throw updateError;
      
      // 3. All successful!
      onLoginSuccess(sessionData.user);

    } catch (error: any) {
      signUpVerifyForm.setError('root', { message: error.message || "An unknown error occurred." });
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
      onClick={() => {
        onClick();
        setSignUpStep('email'); // (NEW) Reset sign-up step when changing tabs
        setServerError(null);
      }}
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
          
          {/* --- SIGN IN FORM --- */}
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

          {/* --- SIGN UP FORM --- */}
          {mode === 'signUp' && (
            <div key="signUp">
              {/* --- STEP 1: Email Form --- */}
              {signUpStep === 'email' && (
                <motion.form
                  key="signUpEmail"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={signUpEmailForm.handleSubmit(handleRequestOtp)}
                  className="space-y-4"
                >
                  <RootError error={signUpEmailForm.formState.errors.root} />

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
                          signUpEmailForm.formState.errors.email
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        {...signUpEmailForm.register('email')}
                      />
                      <Mail
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                    </div>
                    {signUpEmailForm.formState.errors.email && (
                      <p className="mt-1 text-xs text-red-600">
                        {signUpEmailForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Captcha Placeholder */}
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
                  </div>

                  <button
                    type="submit"
                    disabled={signUpEmailForm.formState.isSubmitting}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {signUpEmailForm.formState.isSubmitting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      'Send Confirmation Code'
                    )}
                  </button>
                </motion.form>
              )}

              {/* --- STEP 2: Verify Form --- */}
              {signUpStep === 'verify' && (
                <motion.form
                  key="signUpVerify"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={signUpVerifyForm.handleSubmit(handleVerifyAndSetPassword)}
                  className="space-y-4"
                >
                  <RootError error={signUpVerifyForm.formState.errors.root} />
                  
                  <p className="text-sm text-center text-gray-600">
                    We sent a 6-digit code to <strong>{signUpEmail}</strong>.
                    Please check your email.
                  </p>

                  {/* Email (Hidden) */}
                  <input 
                    type="hidden" 
                    {...signUpVerifyForm.register('email')} 
                  />

                  {/* OTP Field */}
                  <div>
                    <label
                      htmlFor="otp"
                      className="text-sm font-medium text-gray-700"
                    >
                      6-Digit Code
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          signUpVerifyForm.formState.errors.otp
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        {...signUpVerifyForm.register('otp')}
                      />
                      <Key
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                    </div>
                    {signUpVerifyForm.formState.errors.otp && (
                      <p className="mt-1 text-xs text-red-600">
                        {signUpVerifyForm.formState.errors.otp.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label
                      htmlFor="password-signup"
                      className="text-sm font-medium text-gray-700"
                    >
                      Create Password
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="password-signup"
                        type="password"
                        placeholder="•••••••• (at least 8 characters)"
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          signUpVerifyForm.formState.errors.password
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        {...signUpVerifyForm.register('password')}
                      />
                      <Key
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                    </div>
                    {signUpVerifyForm.formState.errors.password && (
                      <p className="mt-1 text-xs text-red-600">
                        {signUpVerifyForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label
                      htmlFor="confirmPassword-signup"
                      className="text-sm font-medium text-gray-700"
                    >
                      Confirm Password
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="confirmPassword-signup"
                        type="password"
                        placeholder="••••••••"
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          signUpVerifyForm.formState.errors.confirmPassword
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        {...signUpVerifyForm.register('confirmPassword')}
                      />
                      <Key
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                    </div>
                    {signUpVerifyForm.formState.errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">
                        {signUpVerifyForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={signUpVerifyForm.formState.isSubmitting}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {signUpVerifyForm.formState.isSubmitting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      'Create Account'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignUpStep('email')}
                    className="text-sm text-blue-600 hover:underline w-full text-center"
                  >
                    Back
                  </button>
                </motion.form>
              )}
            </div>
          )}

        </AnimatePresence>
      </>
    </div>
  );
};