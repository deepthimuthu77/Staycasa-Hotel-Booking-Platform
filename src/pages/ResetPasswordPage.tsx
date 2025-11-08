import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Loader2, AlertCircle, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// (NEW) Import the specific schema for this page
import { resetPasswordSchema } from '../lib/schemas';

// Import Supabase client
import { supabase } from '../lib/supabaseClient';

// (NEW) Define form data type
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

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
 * Page for the custom multi-step password reset flow.
 */
export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // --- Logic: Handle Requesting OTP (Step 1) ---
  const handleRequestOtp = async () => {
    setServerError(null);
    setIsLoading(true);

    const email = getValues('email'); // Get just the email
    
    // You must enable "Email OTP" for password resets in Supabase Auth settings
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // We are NOT providing a redirectTo, so Supabase sends an OTP
    });

    if (error) {
      setServerError(error.message);
    } else {
      setStep('reset'); // Move to the next step
    }
    setIsLoading(false);
  };

  // --- Logic: Handle Verifying & Setting Password (Step 2) ---
  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setServerError(null);
    setIsLoading(true);

    try {
      // 1. Verify the OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.otp,
        type: 'email', // Use 'email' type for this custom flow
      });

      if (verifyError) throw verifyError;

      // 2. If OTP is valid, update the user's password
      // (This only works if the user is ALREADY logged in, which they aren't)
      // We must use the (now deprecated but necessary) resetPassword flow
      // A better flow would be to use the token from verifyOtp
      
      // --- (CORRECTED LOGIC) ---
      // The `resetPasswordForEmail` sends a token. The user *clicks a link*
      // or you use the `recover` flow.
      
      // Let's stick to your requested OTP flow, which means we must
      // use `verifyOtp` and then `updateUser`.
      // NOTE: `updateUser` only works for a logged-in user.
      
      // --- (RE-CORRECTED LOGIC FOR YOUR OTP FLOW) ---
      // Your flow is custom: verify OTP, THEN update password.
      // This is tricky. `verifyOtp` can grant a session, then `updateUser` works.
      
      const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.otp,
        type: 'email', 
      });

      if (sessionError) throw sessionError;
      
      // If verification is successful, Supabase *logs the user in*.
      // Now we can update the password for this logged-in user.
      if (sessionData.session) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: data.password
        });
        
        if (updateError) throw updateError;
        
        // Success! (Skipping final email as requested)
        alert("Password reset successfully! Please log in.");
        await supabase.auth.signOut(); // Log them out so they can log in normally
        navigate('/login', { replace: true });

      } else {
        throw new Error("Could not verify OTP. Please try again.");
      }

    } catch (error: any) {
      setServerError(error.message || "An unknown error occurred.");
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          
          <AnimatePresence mode="wait">
            
            {/* --- STEP 1: Request OTP --- */}
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
                
                <form
                  onSubmit={handleSubmit(handleRequestOtp)}
                  className="space-y-4"
                >
                  <RootError message={serverError} />
                  
                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.email
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        {...register('email')}
                      />
                      <Mail
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      'Send Code'
                    )}
                    {!isLoading && <ArrowRight size={20} />}
                  </button>
                </form>
              </motion.div>
            )}

            {/* --- STEP 2: Set New Password --- */}
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
                
                <form
                  onSubmit={handleSubmit(handleResetPassword)}
                  className="space-y-4"
                >
                  <RootError message={serverError} />
                  
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
                        maxLength={6}
                        placeholder="123456"
                        className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.otp
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        {...register('otp')}
                      />
                      <Key
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                    </div>
                    {errors.otp && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.otp.message}
                      </p>
                    )}
                  </div>

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
                        placeholder="••••••••"
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
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      'Reset Password'
                    )}
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