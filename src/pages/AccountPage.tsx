import React, { useState, useEffect } from 'react';
import type { LucideProps } from 'lucide-react';
import { 
  User as UserIcon,
  Mail, 
  Phone, 
  BookText, 
  ShieldCheck, 
  Save, 
  ChevronLeft,
  Loader2 // Added for loading
} from 'lucide-react';

// Import the reusable component
import { AvatarUploader } from '../components/AvatarUploader';

// Import Supabase client and auth hook
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../App'; // Make sure useAuth is exported from App.tsx

// Import types from data.tsx
import type { UserProfile } from '../data/data';

// --- CHILD COMPONENT: Header (No change) ---
const Header = () => (
  <header className="sticky top-0 z-30 bg-white shadow-sm p-4 border-b border-gray-200">
    <div className="container mx-auto max-w-7xl flex justify-between items-center">
      <a href="#" className="text-2xl font-bold text-blue-600">ProBooker</a>
      <div className="flex items-center gap-4">
        <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Browse</a>
        <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">My Bookings</a>
      </div>
    </div>
  </header>
);

// --- CHILD COMPONENT: FormInputRow (No change) ---
type FormInputRowProps = {
  icon: React.ReactNode;
  label: string;
  name: string;
  value: string | null | undefined; // Allow undefined
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  disabled?: boolean;
};

const FormInputRow = ({ icon, label, name, value, onChange, type = 'text', disabled = false }: FormInputRowProps) => {
  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-3.5 text-gray-400">
          {React.cloneElement(icon as React.ReactElement<LucideProps>, { size: 18 })}
        </span>
        <InputComponent
          type={type}
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          placeholder={`Enter your ${label.toLowerCase()}`}
          rows={type === 'textarea' ? 4 : undefined}
          className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
};


// --- PAGE COMPONENT: AccountPage (UPDATED) ---
/**
 * User profile page, connected to Supabase.
 */
export const AccountPage = () => {
  const auth = useAuth(); // Get the real auth session
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- NEW: Fetch profile data on load ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth?.session?.user) return; // Wait for user

      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', auth.session.user.id)
        .single(); // We only expect one row

      if (error) {
        console.error("Error fetching profile:", error.message);
      } else {
        setProfile(data);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [auth?.session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => (prev ? { ...prev, [name]: value } : null));
  };

  /**
   * --- NEW: Real Avatar Upload ---
   * This function is passed to the reusable AvatarUploader component.
   */
  const handleAvatarUpload = async (file: File): Promise<boolean> => {
    if (!auth?.session?.user) return false;

    // Use user ID and timestamp to create a unique file path
    const filePath = `${auth.session.user.id}/${Date.now()}-${file.name}`;
    
    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload failed:", uploadError.message);
      alert("Upload failed. Please try again.");
      return false;
    }

    // 2. Get the public URL
    const { data: urlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath);
      
    const newAvatarUrl = urlData.publicUrl;

    // 3. Update the 'users' table with the new URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: newAvatarUrl, updated_at: new Date().toISOString() })
      .eq('id', auth.session.user.id);

    if (updateError) {
      console.error("Failed to update avatar URL:", updateError.message);
      alert("Avatar uploaded but failed to save. Please try again.");
      return false;
    }

    // 4. Optimistically update local state to show new image
    setProfile(prev => (prev ? { ...prev, avatar_url: newAvatarUrl } : null));
    return true;
  };

  /**
   * --- NEW: Real Profile Save ---
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !auth?.session?.user) return;

    setIsSaving(true);
    
    const { error } = await supabase
      .from('users')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        bio: profile.bio,
        updated_at: new Date().toISOString()
      })
      .eq('id', auth.session.user.id);
    
    setIsSaving(false);
    if (error) {
      alert("Error saving profile: " + error.message);
    } else {
      alert("Profile saved successfully!");
    }
  };

  /**
   * --- NEW: Real Password Reset ---
   */
  const handlePasswordReset = async () => {
    if (!auth?.session?.user?.email) {
        alert("Could not find user email.");
        return;
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(
      auth.session.user.email,
      {
        redirectTo: `${window.location.origin}/password-reset` // URL to your password reset page
      }
    );
    
    if (error) {
      alert("Error sending reset email: " + error.message);
    } else {
      alert("Password reset email sent! Please check your inbox.");
    }
  };


  if (isLoading || !profile) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <Header />
        <div className="flex justify-center items-center h-96">
          <Loader2 size={48} className="animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="container mx-auto max-w-7xl p-4 mt-6">
        <a href="/" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 mb-4">
          <ChevronLeft size={16} />
          Back to Dashboard
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Account</h1>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- Left Column (Avatar) --- */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center">
              <AvatarUploader
                // Pass the real user data from the 'profile' state
                user={{
                  id: profile.id,
                  email:  auth.session!.user.email!,
                  full_name: profile.full_name || 'New User',
                  avatar_url: profile.avatar_url || undefined,
                }}
                onAvatarChange={handleAvatarUpload}
              />
            </div>
          </div>

          {/* --- Right Column (Details) --- */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Details</h3>
              <div className="space-y-4">
                <FormInputRow
                  icon={<UserIcon />}
                  label="Full Name"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                />
                <FormInputRow
                  icon={<Mail />}
                  label="Email Address"
                  name="email"
                  value={ auth.session!.user.email}
                  onChange={handleChange}
                  disabled={true} // Email is from auth and shouldn't be changed here
                />
                <FormInputRow
                  icon={<Phone />}
                  label="Phone Number"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  type="tel"
                />
                <FormInputRow
                  icon={<BookText />}
                  label="Bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  type="textarea"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Security</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Password</p>
                  <p className="text-sm text-gray-500">Reset your password via email</p>
                </div>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  <ShieldCheck size={16} />
                  Reset Password
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  // This page needs to be wrapped in AuthProvider and Router
  // to function correctly in isolation.
  return <AccountPage />;
}