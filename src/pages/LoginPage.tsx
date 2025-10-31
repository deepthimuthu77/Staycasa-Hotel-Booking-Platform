import React, { useState } from 'react';
import { Mail, KeySquare, Loader2, ChevronLeft } from 'lucide-react';

// --- TYPE DEFINITIONS ---
type AuthStep = 'email' | 'otp' | 'loading';

type AuthOtpFlowProps = {
  onLoginSuccess: (token: string) => void;
};

// --- CHILD COMPONENT: AuthOtpFlow ---
/**
 * Handles the two-step email + OTP login flow.
 */
export const AuthOtpFlow = ({ onLoginSuccess }: AuthOtpFlowProps) => {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter a valid email address.');
      return;
    }
    setStep('loading');
    setError('');

    // --- MOCK API CALL ---
    // In a real app, this would call Supabase:
    // const { error } = await supabase.auth.signInWithOtp({ email });
    console.log('Sending OTP to:', email);
    await new Promise(res => setTimeout(res, 1000)); // Simulate network delay
    
    // On success:
    setStep('otp');
    // On failure:
    // setError('Failed to send OTP. Please try again.');
    // setStep('email');
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP.');
      return;
    }
    setStep('loading');
    setError('');

    // --- MOCK API CALL ---
    // In a real app, this would call Supabase:
    // const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    console.log('Verifying OTP:', otp);
    await new Promise(res => setTimeout(res, 1000)); // Simulate network delay

    // Mock success/failure
    if (otp === '123456') {
      // On success:
      console.log('Login successful');
      onLoginSuccess('mock-jwt-token');
    } else {
      // On failure:
      setError('Invalid OTP. Please try again.');
      setStep('otp');
    }
  };

  return (
    <div className="w-full max-w-md">
      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={18} />
              </span>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            Send OTP
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <p className="text-sm text-center text-gray-600">
            Enter the 6-digit code sent to <br />
            <strong className="text-gray-800">{email}</strong>
          </p>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
              One-Time Password (OTP)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <KeySquare size={18} />
              </span>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="123456"
                required
                maxLength={6}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center text-lg"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            Verify & Log In
          </button>
          <button
            type="button"
            onClick={() => { setStep('email'); setError(''); }}
            className="w-full text-sm text-center text-gray-600 hover:text-blue-600"
          >
            Use a different email
          </button>
        </form>
      )}

      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-gray-600">Please wait...</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 text-center mt-4">{error}</p>
      )}
    </div>
  );
};

// --- PAGE COMPONENT: LoginPage ---
/**
 * OTP login screen using AuthOtpFlow.
 */
export const LoginPage = () => {
  const handleLoginSuccess = (token: string) => {
    // In a real app, you'd set this token in your auth context/state
    console.log("Login Success! Token:", token);
    alert("Mock Login Successful!"); // Using alert for demo, replace with navigation
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <a href="#" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 mb-4">
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
          <AuthOtpFlow onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  return <LoginPage />;
}
