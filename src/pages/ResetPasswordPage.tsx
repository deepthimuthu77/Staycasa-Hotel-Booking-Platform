// src/pages/ResetPasswordPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Loader2, AlertCircle, Mail, ArrowRight, CheckCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// (MODIFIED) Import the new schema
import { resetPasswordSchema, resetPasswordLoggedInSchema, resetPasswordEmailSchema } from '../lib/schemas';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../App';

// (MODIFIED) Define all form data types
type ResetPasswordEmailFormData = z.infer<typeof resetPasswordEmailSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type ResetPasswordLoggedInFormData = z.infer<typeof resetPasswordLoggedInSchema>;

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

// --- Framer Motion Variants ---
const formVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

/**
 * (NEW) A context-aware page for password reset.
 * - If LOGGED IN: Shows a form to enter current and new password.
 * - If LOGGED OUT: Shows the multi-step OTP flow.
 */
export const ResetPasswordPage = () => {
  const auth = useAuth(); // <-- (NEW) Check auth state
  
  if (auth.isAuthenticated) {
    return <ResetPasswordLoggedIn />;
  }
  
  return <ResetPasswordLoggedOut />;
};


// ==================================================================
// --- (NEW) LOGGED-IN COMPONENT ---
// ==================================================================
const ResetPasswordLoggedIn = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false); // <-- (NEW) Success state

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordLoggedInFormData>({
    resolver: zodResolver(resetPasswordLoggedInSchema),
  });

  const handleLoggedInReset = async (data: ResetPasswordLoggedInFormData) => {
    setServerError(null);

    if (!auth.session?.user?.email) {
      setServerError("Could not find user. Please log out and log in again.");
      return;
    }

    // 1. First, verify the user's *current* password by trying to log in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: auth.session.user.email,
      password: data.currentPassword,
    });

    if (signInError) {
      setServerError("Your current password is not correct.");
      return;
    }

    // 2. If successful, update the password to the new one
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (updateError) {
      setServerError("Failed to update password: " + updateError.message);
    } else {
      // (NEW) Set success state instead of alert
      setIsSuccess(true);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              // --- (NEW) Success Message ---
              <motion.div
                key="success"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="text-center">
                  <CheckCircle size={48} className="mx-auto text-green-500" />
                  <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
                    Success!
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Your password has been updated successfully.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    Back to Profile
                  </button>
                </div>
              </motion.div>
            ) : (
              // --- Original Form ---
              <motion.form
                key="form"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleSubmit(handleLoggedInReset)}
                className="space-y-4"
              >
                <div className="text-center">
                  <Shield size={48} className="mx-auto text-blue-600" />
                  <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
                    Change Your Password
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Enter your current and new password to update your account.
                  </p>
                </div>
                
                <RootError message={serverError} />

                {/* Current Password Field */}
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    Current Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="currentPassword"
                      type="password"
                      placeholder="••••••••"
                      className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.currentPassword
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      {...register('currentPassword')}
                    />
                    <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  {errors.currentPassword && (
                    <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>
                  )}
                </div>

                {/* New Password Field */}
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
                    <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm New Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    Confirm New Password
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
                    <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                >
                  {isSubmitting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    'Save New Password'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="text-sm text-blue-600 hover:underline w-full text-center"
                >
                  Cancel
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};


// ==================================================================
// --- LOGGED-OUT COMPONENT (This is the one with the fix) ---
// ==================================================================
const ResetPasswordLoggedOut = () => {
  const navigate = useNavigate();
  // (NEW) Add 'success' to the step state
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // --- Force logout on page load ---
  useEffect(() => {
    const signOut = async () => {
      await supabase.auth.signOut();
    };
    signOut();
  }, []);

  // (NEW) Form for Step 1: Request OTP
  const requestForm = useForm<ResetPasswordEmailFormData>({
    resolver: zodResolver(resetPasswordEmailSchema),
  });

  // (NEW) Form for Step 2: Reset Password
  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // --- (MODIFIED) Logic: Handle Requesting OTP (Step 1) ---
  const handleRequestOtp = async (data: ResetPasswordEmailFormData) => { // <-- Now accepts data
    setServerError(null);
    setIsLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {});

    if (error) {
      if (error.status === 429) {
        setServerError("Too many requests. Please wait a minute before trying again.");
      } else {
        setServerError(error.message);
      }
      setIsLoading(false);
    } else {
      // Pass the email to the second form
      resetForm.setValue('email', data.email); 
      setStep('reset');
      setIsLoading(false); // Make sure to stop loading
    }
  };

  // --- (MODIFIED) Logic: Handle Verifying & Setting Password (Step 2) ---
  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setServerError(null);
    setIsLoading(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.otp,
        type: 'recovery',
      });

      if (sessionError) throw sessionError;
      
      if (sessionData.session) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: data.password
        });
        
        if (updateError) throw updateError;
        
        // (NEW) Go to success step instead of alert
        await supabase.auth.signOut();
        setStep('success');

      } else {
        throw new Error("Could not verify OTP. Please try again.");
      }

    } catch (error: any) {
      setServerError(error.message || "An unknown error occurred.");
    }

    setIsLoading(false);
  };

  // --- JSX for Logged-Out Flow ---
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <AnimatePresence mode="wait">
            
            {/* --- STEP 1 FORM --- */}
            {step === 'request' && (
              <motion.div
                key="request"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Reset Password
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Enter your email to receive a 6-digit one-time code.
                  </p>
                </div>
                {/* (MODIFIED) Use requestForm here */}
                <form
                  onSubmit={requestForm.handleSubmit(handleRequestOtp)}
                  className="space-y-4"
                >
                  <RootError message={serverError} />
                  <div>
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                    <div className="relative mt-1">
                      <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          requestForm.formState.errors.email // (MODIFIED)
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        {...requestForm.register('email')} 
                      />
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {requestForm.formState.errors.email && (<p className="mt-1 text-xs text-red-600">{requestForm.formState.errors.email.message}</p>)}
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {isLoading ? (<Loader2 size={20} className="animate-spin" />) : ('Send Code')}
                    {!isLoading && <ArrowRight size={20} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-sm text-blue-600 hover:underline w-full text-center"
                  >
                    Back to Login
                  </button>
                </form>
              </motion.div>
            )}

            {/* --- STEP 2 FORM --- */}
            {step === 'reset' && (
              <motion.div
                key="reset"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="text-center">
                   <CheckCircle size={48} className="mx-auto text-green-500" />
                  <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
                    Code Sent!
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Check your email for the code and set your new password.
                  </p>
                </div>
                {/* (MODIFIED) Use resetForm here */}
                <form
                  onSubmit={resetForm.handleSubmit(handleResetPassword)}
                  className="space-y-4"
                >
                  <RootError message={serverError} />
                  {/* This field is hidden but registered, carrying over the email */}
                  <input type="hidden" {...resetForm.register('email')} />
                  
                  {/* OTP Field */}
                  <div>
                    <label htmlFor="otp" className="text-sm font-medium text-gray-700">6-Digit Code</label>
                    <div className="relative mt-1">
                      <input
                        id="otp"
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          resetForm.formState.errors.otp ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500' // (MODIFIED)
                        }`}
                        {...resetForm.register('otp')} // (MODIFIED)
                      />
                      <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {resetForm.formState.errors.otp && (<p className="mt-1 text-xs text-red-600">{resetForm.formState.errors.otp.message}</p>)}
                  </div>
                  
                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">New Password</label>
                    <div className="relative mt-1">
                      <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          resetForm.formState.errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500' // (MODIFIED)
                        }`}
                        {...resetForm.register('password')} // (MODIFIED)
                      />
                      <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {resetForm.formState.errors.password && (<p className="mt-1 text-xs text-red-600">{resetForm.formState.errors.password.message}</p>)} {/* (MODIFIED) */}
                  </div>
                  
                  {/* Confirm Password Field */}
                  <div>
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</label>
                    <div className="relative mt-1">
                      <input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          resetForm.formState.errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        {...resetForm.register('confirmPassword')} // (MODIFIED)
                      />
                      <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {resetForm.formState.errors.confirmPassword && (<p className="mt-1 text-xs text-red-600">{resetForm.formState.errors.confirmPassword.message}</p>)} {/* (MODIFIED) */}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {isLoading ? (<Loader2 size={20} className="animate-spin" />) : ('Reset Password')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="text-sm text-blue-600 hover:underline w-full text-center"
                  >
                    Back
                  </button>
                </form>
              </motion.div>
            )}

            {/* --- (NEW) STEP 3: Success Message --- */}
            {step === 'success' && (
              <motion.div
                key="success"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="text-center">
                  <CheckCircle size={48} className="mx-auto text-green-500" />
                  <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
                    Success!
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Password reset successfully! Please log in.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  return <ResetPasswordPage />;
}