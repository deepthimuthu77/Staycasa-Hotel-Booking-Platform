import React from 'react';
import { ChevronLeft } from 'lucide-react';

// Import the reusable component
import { AuthOtpFlow } from '../components/AuthOtpFlow';
// Import the User type from the component file
import type { User } from '../components/AuthOtpFlow';

// --- TYPE DEFINITIONS (REMOVED) ---
// These are no longer needed, as the logic is in the component.

// --- CHILD COMPONENT: AuthOtpFlow (REMOVED) ---
// This entire inline component has been deleted.
// We are now importing it from src/components/AuthOtpFlow.tsx


// --- PAGE COMPONENT: LoginPage ---
/**
 * OTP login screen using the reusable AuthOtpFlow component.
 */
export const LoginPage = () => {
  
  // This function now expects a 'User' object,
  // matching the prop type of the reusable component.
  const handleLoginSuccess = (user: User) => {
    // In a real app, you'd call the useAuth() context's login function here
    console.log("Login Success! User:", user.email);
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
          
          {/* Use the imported reusable component */}
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