// src/components/AuthForm.tsx
import React, { useState } from 'react';
// (NEW) Import Link from react-router-dom
import { Link } from 'react-router-dom'; 
import { Mail, Key, Loader2, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// React Hook Form + Zod
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Import your Supabase client
import { supabase } from '../lib/supabaseClient';

// (UPDATED) Import ALL the new schemas
import { 
  loginSchema, 
  signupEmailSchema, 
  signupVerifySchema,
  loginOtpEmailSchema,
  loginOtpVerifySchema
} from '../lib/schemas';

// (UPDATED) Form data types
type LoginFormData = z.infer<typeof loginSchema>;
type SignupEmailFormData = z.infer<typeof signupEmailSchema>;
type SignupVerifyFormData = z.infer<typeof signupVerifySchema>;
type LoginOtpEmailFormData = z.infer<typeof loginOtpEmailSchema>;
type LoginOtpVerifyFormData = z.infer<typeof loginOtpVerifySchema>;


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
  // (UPDATED) Mode now handles 3 states
  const [mode, setMode] = useState<'signInPassword' | 'signInOtp' | 'signUp'>('signInPassword');
  
  // State for multi-step sign-UP
  const [signUpStep, setSignUpStep] = useState<'email' | 'verify'>('email');
  
  // (NEW) State for multi-step sign-IN
  const [signInOtpStep, setSignInOtpStep] = useState<'email' | 'verify'>('email');
  
  // Shared email state
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [serverError, setServerError] = useState<string | null>(null);

  // --- 1. Sign In (Password) Form ---
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    setError: setLoginError,
    formState: { errors: loginErrors, isSubmitting: isLoginLoading },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // --- 2. Sign Up Step 1: Email Form ---
  const signUpEmailForm = useForm<SignupEmailFormData>({
    resolver: zodResolver(signupEmailSchema),
  });

  // --- 3. Sign Up Step 2: Verify OTP + Set Password Form ---
  const signUpVerifyForm = useForm<SignupVerifyFormData>({
    resolver: zodResolver(signupVerifySchema),
  });

  // --- (NEW) 4. Sign In (OTP) Step 1: Email Form ---
  const loginOtpEmailForm = useForm<LoginOtpEmailFormData>({
    resolver: zodResolver(loginOtpEmailSchema),
  });

  // --- (NEW) 5. Sign In (OTP) Step 2: Verify Form ---
  const loginOtpVerifyForm = useForm<LoginOtpVerifyFormData>({
    resolver: zodResolver(loginOtpVerifySchema),
  });

  
  // --- Logic: Handle Sign In (Password) ---
  const handleLogin = async (formData: LoginFormData) => {
    setServerError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setLoginError('root', { message: error.message });
    } else if (data.session) {
      onLoginSuccess(data.user);
    } else if (data.user && !data.session) {
      setLoginError('root', { message: 'Invalid login credentials' });
    } else {
      setLoginError('root', { message: 'An unknown error occurred.' });
    }
  };

  // --- Logic: Handle Sign Up - Step 1 (Request OTP) ---
  const handleRequestSignUpOtp = async (data: SignupEmailFormData) => {
    setServerError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      signUpEmailForm.setError('root', { message: error.message });
    } else {
      setPendingEmail(data.email);
      signUpVerifyForm.setValue('email', data.email);
      setSignUpStep('verify');
    }
  };

  // --- Logic: Handle Sign Up - Step 2 (Verify & Set Password) ---
  const handleVerifyAndSetPassword = async (data: SignupVerifyFormData) => {
    setServerError(null);
    try {
      const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.otp,
        type: 'signup',
      });

      if (verifyError) throw verifyError;
      if (!sessionData.session || !sessionData.user) {
        throw new Error("Could not verify OTP. Please try again.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      });

      if (updateError) throw updateError;
      
      onLoginSuccess(sessionData.user);

    } catch (error: any) {
      signUpVerifyForm.setError('root', { message: error.message || "An unknown error occurred." });
    }
  };

  // --- (NEW) Logic: Handle Sign In (OTP) - Step 1 (Request Code) ---
  const handleRequestLoginOtp = async (data: LoginOtpEmailFormData) => {
    setServerError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        shouldCreateUser: false, // Don't create a new user
      },
    });

    if (error) {
      loginOtpEmailForm.setError('root', { message: error.message });
    } else {
      setPendingEmail(data.email);
      loginOtpVerifyForm.setValue('email', data.email);
      setSignInOtpStep('verify');
    }
  };

  // --- (NEW) Logic: Handle Sign In (OTP) - Step 2 (Verify Code) ---
  const handleVerifyLoginOtp = async (data: LoginOtpVerifyFormData) => {
    setServerError(null);
    try {
      const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.otp,
        type: 'email', // Use 'email' type for passwordless login
      });

      if (verifyError) throw verifyError;
      if (!sessionData.session || !sessionData.user) {
        throw new Error("Could not verify OTP. Please try again.");
      }
      
      // Success!
      onLoginSuccess(sessionData.user);

    } catch (error: any) {
      loginOtpVerifyForm.setError('root', { message: error.message || "An unknown error occurred." });
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
        // (UPDATED) Reset all sub-steps when changing tabs
        setSignUpStep('email');
        setSignInOtpStep('email');
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
  
  // (NEW) Reusable back button
  const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-blue-600 hover:underline w-full text-center mt-3"
    >
      Back
    </button>
  );

  return (
    <div className="w-full max-w-sm">
      <>
        {/* --- Tab Selector --- */}
        <div className="flex border-b border-gray-200 mb-6">
          <TabButton
            label="Sign In"
            isActive={mode.includes('signIn')} // (UPDATED) Active if either signIn mode
            onClick={() => setMode('signInPassword')}
          />
          <TabButton
            label="Sign Up"
            isActive={mode === 'signUp'}
            onClick={() => setMode('signUp')}
          /> {/* <--- THIS WAS THE FIX (changed } to />) */}
        </div>

        {/* --- Animated Form Container --- */}
        <AnimatePresence mode="wait">
          
          {/* --- 1. SIGN IN (PASSWORD) FORM --- */}
          {mode === 'signInPassword' && (
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
                <label htmlFor="email-login" className="text-sm font-medium text-gray-700">Email</label>
                <div className="relative mt-1">
                  <input
                    id="email-login"
                    type="email"
                    placeholder="you@example.com"
                    className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                      loginErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    {...registerLogin('email')}
                  />
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                </div>
                {loginErrors.email && (<p className="mt-1 text-xs text-red-600">{loginErrors.email.message}</p>)}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="password-login" className="text-sm font-medium text-gray-700">Password</label>
                  {/* --- (THIS IS THE NEW BUTTON) --- */}
                  <Link 
                    to="/reset-password" 
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative mt-1">
                  <input
                    id="password-login"
                    type="password"
                    placeholder="••••••••"
                    className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                      loginErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    {...registerLogin('password')}
                  />
                  <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                </div>
                {loginErrors.password && (<p className="mt-1 text-xs text-red-600">{loginErrors.password.message}</p>)}
              </div>

              <button
                type="submit"
                disabled={isLoginLoading}
                className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
              >
                {isLoginLoading ? (<Loader2 size={20} className="animate-spin" />) : ('Sign In')}
                {!isLoginLoading && <ArrowRight size={20} />}
              </button>
              
              {/* Alternative Login Button */}
              <div className="relative text-center my-2">
                <span className="text-sm text-gray-500 bg-white px-2 relative z-10">or</span>
                <div className="absolute left-0 top-1/2 w-full h-px bg-gray-200"></div>
              </div>
              <button
                type="button"
                onClick={() => setMode('signInOtp')}
                className="w-full p-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Mail size={20} />
                Sign in with a code
              </button>
              
            </motion.form>
          )}

          {/* --- 2. SIGN IN (OTP) FLOW --- */}
          {mode === 'signInOtp' && (
            <div key="signInOtp">
              {/* --- Step 1: Email --- */}
              {signInOtpStep === 'email' && (
                <motion.form
                  key="signInOtpEmail"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={loginOtpEmailForm.handleSubmit(handleRequestLoginOtp)}
                  className="space-y-4"
                >
                  <RootError error={loginOtpEmailForm.formState.errors.root} />
                  <p className="text-sm text-center text-gray-600">
                    Enter your email to receive a 6-digit login code.
                  </p>
                  <div>
                    <label htmlFor="email-otp-login" className="text-sm font-medium text-gray-700">Email</label>
                    <div className="relative mt-1">
                      <input
                        id="email-otp-login"
                        type="email"
                        placeholder="you@example.com"
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          loginOtpEmailForm.formState.errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        {...loginOtpEmailForm.register('email')}
                      />
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    </div>
                    {loginOtpEmailForm.formState.errors.email && (<p className="mt-1 text-xs text-red-600">{loginOtpEmailForm.formState.errors.email.message}</p>)}
                  </div>
                  <button
                    type="submit"
                    disabled={loginOtpEmailForm.formState.isSubmitting}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {loginOtpEmailForm.formState.isSubmitting ? (<Loader2 size={20} className="animate-spin" />) : ('Send Code')}
                  </button>
                  <BackButton onClick={() => setMode('signInPassword')} />
                </motion.form>
              )}
              
              {/* --- Step 2: Verify --- */}
              {signInOtpStep === 'verify' && (
                <motion.form
                  key="signInOtpVerify"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={loginOtpVerifyForm.handleSubmit(handleVerifyLoginOtp)}
                  className="space-y-4"
                >
                  <RootError error={loginOtpVerifyForm.formState.errors.root} />
                  <p className="text-sm text-center text-gray-600">
                    We sent a 6-digit code to <strong>{pendingEmail}</strong>.
                  </p>
                  <input type="hidden" {...loginOtpVerifyForm.register('email')} />
                  <div>
                    <label htmlFor="otp-login" className="text-sm font-medium text-gray-700">6-Digit Code</label>
                    <div className="relative mt-1">
                      <input
                        id="otp-login"
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          loginOtpVerifyForm.formState.errors.otp ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        {...loginOtpVerifyForm.register('otp')}
                      />
                      <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    </div>
                    {loginOtpVerifyForm.formState.errors.otp && (<p className="mt-1 text-xs text-red-600">{loginOtpVerifyForm.formState.errors.otp.message}</p>)}
                  </div>
                  <button
                    type="submit"
                    disabled={loginOtpVerifyForm.formState.isSubmitting}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {loginOtpVerifyForm.formState.isSubmitting ? (<Loader2 size={20} className="animate-spin" />) : ('Verify and Sign In')}
                  </button>
                  <BackButton onClick={() => setSignInOtpStep('email')} />
                </motion.form>
              )}
            </div>
          )}

          {/* --- 3. SIGN UP (OTP + PASSWORD) FLOW --- */}
          {mode === 'signUp' && (
            <div key="signUp">
              {/* --- Step 1: Email Form --- */}
              {signUpStep === 'email' && (
                <motion.form
                  key="signUpEmail"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={signUpEmailForm.handleSubmit(handleRequestSignUpOtp)}
                  className="space-y-4"
                >
                  <RootError error={signUpEmailForm.formState.errors.root} />
                  <div>
                    <label htmlFor="email-signup" className="text-sm font-medium text-gray-700">Email</label>
                    <div className="relative mt-1">
                      <input
                        id="email-signup"
                        type="email"
                        placeholder="you@example.com"
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          signUpEmailForm.formState.errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        {...signUpEmailForm.register('email')}
                      />
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    </div>
                    {signUpEmailForm.formState.errors.email && (<p className="mt-1 text-xs text-red-600">{signUpEmailForm.formState.errors.email.message}</p>)}
                  </div>
                  <div>
                    <label htmlFor="captcha-signup" className="text-sm font-medium text-gray-700">Captcha</label>
                    <div className="relative mt-1">
                      <input
                        id="captcha-signup"
                        type="text"
                        placeholder="Captcha (e.g., hCaptcha)"
                        disabled
                        className="w-full p-3 pl-10 border rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                      <Shield size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={signUpEmailForm.formState.isSubmitting}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {signUpEmailForm.formState.isSubmitting ? (<Loader2 size={20} className="animate-spin" />) : ('Send Confirmation Code')}
                  </button>
                </motion.form>
              )}

              {/* --- Step 2: Verify Form --- */}
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
                    We sent a 6-digit code to <strong>{pendingEmail}</strong>.
                  </p>
                  <input type="hidden" {...signUpVerifyForm.register('email')} />
                  <div>
                    <label htmlFor="otp" className="text-sm font-medium text-gray-700">6-Digit Code</label>
                    <div className="relative mt-1">
                      <input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          signUpVerifyForm.formState.errors.otp ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        {...signUpVerifyForm.register('otp')}
                      />
                      <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    </div>
                    {signUpVerifyForm.formState.errors.otp && (<p className="mt-1 text-xs text-red-600">{signUpVerifyForm.formState.errors.otp.message}</p>)}
                  </div>
                  <div>
                    <label htmlFor="password-signup" className="text-sm font-medium text-gray-700">Create Password</label>
                    <div className="relative mt-1">
                      <input
                        id="password-signup"
                        type="password"
                        placeholder="•••••••• (at least 8 characters)"
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          signUpVerifyForm.formState.errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        {...signUpVerifyForm.register('password')}
                      />
                      <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    </div>
                    {signUpVerifyForm.formState.errors.password && (<p className="mt-1 text-xs text-red-600">{signUpVerifyForm.formState.errors.password.message}</p>)}
                  </div>
                  <div>
                    <label htmlFor="confirmPassword-signup" className="text-sm font-medium text-gray-700">Confirm Password</label>
                    <div className="relative mt-1">
                      <input
                        id="confirmPassword-signup"
                        type="password"
                        placeholder="••••••••"
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          signUpVerifyForm.formState.errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        {...signUpVerifyForm.register('confirmPassword')}
                      />
                      <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    </div>
                    {signUpVerifyForm.formState.errors.confirmPassword && (<p className="mt-1 text-xs text-red-600">{signUpVerifyForm.formState.errors.confirmPassword.message}</p>)}
                  </div>
                  <button
                    type="submit"
                    disabled={signUpVerifyForm.formState.isSubmitting}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {signUpVerifyForm.formState.isSubmitting ? (<Loader2 size={20} className="animate-spin" />) : ('Create Account')}
                  </button>
                  <BackButton onClick={() => setSignUpStep('email')} />
                </motion.form>
              )}
            </div>
          )}

        </AnimatePresence>
      </>
    </div>
  );
};