// src/pages/AccountPage.tsx

import React, { useState, useEffect } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  User as UserIcon,
  Mail,
  Phone,
  BookText,
  ShieldCheck,
  Save,
  Loader2,
  Calendar,
  Globe,
  Banknote,
  CreditCard, // (NEW) Added icon
  Bell, // (NEW) Added icon
} from 'lucide-react';

// Import the reusable component
import { AvatarUploader } from '../components/AvatarUploader';

// Import Supabase client and auth hook
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../App'; // Make sure useAuth is exported from App.tsx

// Import types from data.tsx
import type { UserProfile } from '../data/data';

// --- (REMOVED) Header component ---

// --- CHILD COMPONENT: FormInputRow (No change) ---
type FormInputRowProps = {
  icon: React.ReactNode;
  label: string;
  name: string;
  value: string | null | undefined; // Allow undefined
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'date'; // (NEW) Added 'date' type
  disabled?: boolean;
  placeholder?: string;
};

const FormInputRow = ({
  icon,
  label,
  name,
  value,
  onChange,
  type = 'text',
  disabled = false,
}: FormInputRowProps) => {
  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-3.5 text-gray-400">
          {React.cloneElement(icon as React.ReactElement<LucideProps>, {
            size: 18,
          })}
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
          className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          } ${type === 'date' ? 'text-gray-700' : ''}`}
        />
      </div>
    </div>
  );
};

// --- (NEW) CHILD COMPONENT: NotificationToggle ---
type NotificationToggleProps = {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
};
const NotificationToggle = ({
  label,
  description,
  enabled,
  onToggle,
}: NotificationToggleProps) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium text-gray-700">{label}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

// --- PAGE COMPONENT: AccountPage (UPDATED) ---
export const AccountPage = () => {
  const auth = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // (NEW) Mock state for notification preferences
  const [notifications, setNotifications] = useState({
    booking_updates: true,
    promotions: false,
  });

  // --- Fetch profile data on load ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth?.session?.user) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', auth.session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
      } else {
        setProfile(data);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [auth?.session]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  // --- Real Avatar Upload ---
  const handleAvatarUpload = async (file: File): Promise<boolean> => {
    if (!auth?.session?.user) return false;

    const filePath = `${auth.session.user.id}/${Date.now()}-${file.name}`;

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload failed:', uploadError.message);
      alert('Upload failed. Please try again.');
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
      .update({
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', auth.session.user.id);

    if (updateError) {
      console.error('Failed to update avatar URL:', updateError.message);
      alert('Avatar uploaded but failed to save. Please try again.');
      return false;
    }

    // 4. Optimistically update local state
    setProfile((prev) => (prev ? { ...prev, avatar_url: newAvatarUrl } : null));
    return true;
  };

  // --- (UPDATED) Real Profile Save ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !auth?.session?.user) return;

    setIsSaving(true);

    // (NEW) Include all new fields in the update
    const { error } = await supabase
      .from('users')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        bio: profile.bio,
        date_of_birth: profile.date_of_birth, // (NEW)
        language: profile.language, // (NEW)
        currency: profile.currency, // (NEW)
        updated_at: new Date().toISOString(),
      })
      .eq('id', auth.session.user.id);

    setIsSaving(false);
    if (error) {
      alert('Error saving profile: ' + error.message);
    } else {
      alert('Profile saved successfully!');
    }
  };

  // --- Real Password Reset ---
  const handlePasswordReset = async () => {
    if (!auth?.session?.user?.email) {
      alert('Could not find user email.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      auth.session.user.email,
      {
        redirectTo: `${window.location.origin}/password-reset`,
      }
    );

    if (error) {
      alert('Error sending reset email: ' + error.message);
    } else {
      alert('Password reset email sent! Please check your inbox.');
    }
  };

  if (isLoading || !profile) {
    return (
      // (UPDATED) Simplified loading state for being inside a shell
      <div className="flex justify-center items-center h-96 bg-white rounded-xl shadow-md border border-gray-100">
        <Loader2 size={48} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    // (REMOVED) <div className="bg-gray-100 min-h-screen">
    // (REMOVED) <Header />
    // (REMOVED) <main ...>
    // (REMOVED) Back to Dashboard link

    // This component now renders *inside* the ThreeTabSessionShell's <Outlet>
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6 hidden lg:block">
        My Account
      </h1>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Left Column (Avatar) --- */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center">
            <AvatarUploader
              user={{
                id: profile.id,
                email: auth.session!.user.email!,
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
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                value={auth.session!.user.email}
                onChange={handleChange}
                disabled={true}
              />
              <FormInputRow
                icon={<Phone />}
                label="Phone Number"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                type="tel"
              />
              {/* --- (NEW) Date of Birth --- */}
              <FormInputRow
                icon={<Calendar />}
                label="Date of Birth"
                name="date_of_birth"
                value={profile.date_of_birth}
                onChange={handleChange}
                type="date"
              />
              <div className="md:col-span-2">
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
          </div>

          {/* --- (NEW) Preferences Section --- */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInputRow
                icon={<Globe />}
                label="Language"
                name="language"
                value={profile.language}
                onChange={handleChange}
                placeholder="e.g., 'en' or 'English'"
              />
              <FormInputRow
                icon={<Banknote />}
                label="Preferred Currency"
                name="currency"
                value={profile.currency}
                onChange={handleChange}
                placeholder="e.g., 'INR' or 'USD'"
              />
            </div>
          </div>

          {/* --- (NEW) Payment Methods Section --- */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Payment Methods
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard size={24} className="text-gray-600" />
                  <div>
                    <p className="font-medium">Visa •••• 4242</p>
                    <p className="text-sm text-gray-500">Expires 12/2028</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              <button
                type="button"
                className="w-full p-2.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-700 font-semibold flex items-center justify-center gap-1 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                + Add New Card
              </button>
            </div>
          </div>

          {/* --- (NEW) Notifications Section --- */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Notifications
            </h3>
            <div className="space-y-4">
              <NotificationToggle
                label="Booking Updates"
                description="Email alerts for confirmations and cancellations."
                enabled={notifications.booking_updates}
                onToggle={() =>
                  setNotifications((p) => ({
                    ...p,
                    booking_updates: !p.booking_updates,
                  }))
                }
              />
              <NotificationToggle
                label="Promotions"
                description="Occasional emails about sales and special offers."
                enabled={notifications.promotions}
                onToggle={() =>
                  setNotifications((p) => ({
                    ...p,
                    promotions: !p.promotions,
                  }))
                }
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Security
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Password</p>
                <p className="text-sm text-gray-500">
                  Reset your password via email
                </p>
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
    </div>
    // (REMOVED) </main>
    // (REMOVED) </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  // This page needs to be wrapped in AuthProvider and Router
  // to function correctly in isolation.
  return <AccountPage />;
}