import React, { useState } from 'react';
import { Mail, Key, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// (NEW) React Hook Form Imports
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { emailSchema, otpSchema } from '../lib/schemas.ts'; // (NEW) Import Zod schemas

// Import your new Supabase client
import { supabase } from '../lib/supabaseClient';

// --- (NEW) Define the form data types ---
type EmailFormData = z.infer<typeof emailSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

// --- TYPE DEFINITIONS ---
type AuthOtpFlowProps = {
  onLoginSuccess: (user: SupabaseUser) => void;
};

// --- AuthOtpFlow Component ---
/**
 * A two-step OTP-based login UI (Email -> OTP).
 * Now connected to the real Supabase auth flow and
 * managed with React Hook Form.
 */
export const AuthOtpFlow = ({ onLoginSuccess }: AuthOtpFlowProps) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  // (NEW) Store email state for step 2
  const [email, setEmail] = useState('');
  // (REMOVED) otp, isLoading, error states

  // --- (NEW) React Hook Form for Email Step ---
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    setError: setEmailError,
    formState: { errors: emailErrors, isSubmitting: isEmailLoading },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // --- (NEW) React Hook Form for OTP Step ---
  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    setError: setOtpError,
    clearErrors: clearOtpErrors,
    formState: { errors: otpErrors, isSubmitting: isOtpLoading },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  // --- (UPDATED) Real OTP Sending ---
  const handleSendOtp = async (data: EmailFormData) => {
    // 'data' is validated by Zod: { email: string }
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      // (NEW) Set error on the form
      setEmailError('root', { type: 'manual', message: error.message });
    } else {
      setEmail(data.email); // (NEW) Save email for step 2
      setStep('otp'); // Move to the next step
    }
  };

  // --- (UPDATED) Real OTP Verification ---
  const handleVerifyOtp = async (data: OtpFormData) => {
    // 'data' is validated by Zod: { otp: string }
    const { data: verifyData, error } = await supabase.auth.verifyOtp({
      email: email, // (NEW) Use email from state
      token: data.otp,
      type: 'email',
    });

    if (error) {
      // (NEW) Set error on the form
      setOtpError('root', { type: 'manual', message: error.message });
    } else if (verifyData.user) {
      // Success! Pass the real user object up to the parent component
      onLoginSuccess(verifyData.user);
    } else {
      setOtpError('root', {
        type: 'manual',
        message: 'Login failed. Please try again.',
      });
    }
  };

  // (NEW) Helper to display root error from Supabase
    const RootError = ({ error }: { error?: unknown }) => {
      if (!error) return null;
  
      // Safely extract a string message from various possible shapes
      let message: string | undefined;
      if (typeof error === 'string') {
        message = error;
      } else if (typeof error === 'object' && error !== null) {
        const maybeMsg = (error as any).message;
        if (typeof maybeMsg === 'string') {
          message = maybeMsg;
        }
      }
  
      if (!message) return null;
  
      return (
        <div className="bg-red-100 border border-red-300 text-red-700 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle size={16} />
          {message}
        </div>
      );
    };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {step === 'email' ? 'Welcome!' : 'Check your email'}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {step === 'email'
            ? 'Sign in or create an account.'
            : `We sent a 6-digit code to ${email}`}
        </p>
      </div>

      {step === 'email' && (
        <form
          onSubmit={handleEmailSubmit(handleSendOtp)}
          className="space-y-4"
        >
          {/* (NEW) Display Supabase error */}
          <RootError error={emailErrors.root} />

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
                  emailErrors.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                {...registerEmail('email')}
              />
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
            {/* (NEW) Display validation error */}
            {emailErrors.email && (
              <p className="mt-1 text-xs text-red-600">
                {emailErrors.email.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isEmailLoading}
            className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            {isEmailLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              'Send Code'
            )}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form
          onSubmit={handleOtpSubmit(handleVerifyOtp)}
          className="space-y-4"
        >
          {/* (NEW) Display Supabase error */}
          <RootError error={otpErrors.root} />

          <div>
            <label htmlFor="otp" className="text-sm font-medium text-gray-700">
              6-Digit Code
            </label>
            <div className="relative mt-1">
              <input
                id="otp"
                type="text"
                placeholder="123456"
                maxLength={6}
                className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                  otpErrors.otp
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                {...registerOtp('otp')}
              />
              <Key
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
            {/* (NEW) Display validation error */}
            {otpErrors.otp && (
              <p className="mt-1 text-xs text-red-600">
                {otpErrors.otp.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isOtpLoading}
            className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            {isOtpLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              'Sign In'
            )}
            {!isOtpLoading && <ArrowRight size={20} />}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('email');
              clearOtpErrors(); // Clear errors
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to email
          </button>
        </form>
      )}
    </div>
  );
};