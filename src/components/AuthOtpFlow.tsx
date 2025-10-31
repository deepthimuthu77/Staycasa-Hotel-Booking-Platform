import React, { useState } from 'react';
import { Mail, Key, Loader2, ArrowRight } from 'lucide-react';

// --- TYPE DEFINITIONS ---
export type User = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
};

type AuthOtpFlowProps = {
  onLoginSuccess: (user: User) => void;
  // In a real app, you'd have an onSendOtp function:
  // onSendOtp: (email: string) => Promise<boolean>;
};

// --- AuthOtpFlow Component ---
/**
 * A two-step OTP-based login UI (Email -> OTP).
 */
export const AuthOtpFlow = ({ onLoginSuccess }: AuthOtpFlowProps) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock OTP sending
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simulate API call
    setTimeout(() => {
      // Basic email validation
      if (!email.includes('@')) {
        setError('Please enter a valid email.');
        setIsLoading(false);
        return;
      }
      
      console.log(`Sending OTP to: ${email}`);
      setIsLoading(false);
      setStep('otp');
    }, 1000);
  };

  // Mock OTP verification
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simulate API call
    setTimeout(() => {
      // Mock validation
      if (otp === '123456') {
        console.log('OTP Verified!');
        // Mock user object
        const mockUser: User = {
          id: crypto.randomUUID(),
          email: email,
          full_name: "Demo User"
        };
        onLoginSuccess(mockUser);
      } else {
        setError('Invalid OTP. Please use "123456" for this demo.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-xl border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {step === 'email' ? 'Welcome!' : 'Check your email'}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {step === 'email' 
            ? 'Sign in to your ProBooker account.' 
            : `We sent a 6-digit code to ${email}`}
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
            <div className="relative mt-1">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Send Code'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label htmlFor="otp" className="text-sm font-medium text-gray-700">6-Digit Code</label>
            <div className="relative mt-1">
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                required
                maxLength={6}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In'}
            {!isLoading && <ArrowRight size={20} />}
          </button>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => { setStep('email'); setError(''); setOtp(''); }}
              className="text-sm text-blue-600 hover:underline"
            >
              Back to email
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
