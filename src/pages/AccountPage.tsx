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
  ChevronLeft,
  Loader2,
  Calendar,
  Globe,
  Banknote,
  CreditCard,
  Bell,
  AlertCircle,
} from 'lucide-react';

// (UPDATED) React Hook Form Imports
import { useForm, type FieldError, type UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { profileSchema } from '../lib/schemas.ts'; 

// Import the reusable component
import { AvatarUploader } from '../components/AvatarUploader';

// Import Supabase client and auth hook
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../App'; 

// Import types from data.tsx
import type { UserProfile } from '../data/data';

// (NEW) Define the form data type from the Zod schema
type ProfileFormData = z.infer<typeof profileSchema>;


// --- (UPDATED) CHILD COMPONENT: FormInputRow ---
type FormInputRowProps = {
  icon: React.ReactNode;
  label: string;
  name: string;
  register: UseFormRegisterReturn; 
  error?: FieldError; 
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'date';
  disabled?: boolean;
  placeholder?: string;
  value?: string; // (NEW) Add value prop for disabled fields
};

const FormInputRow = ({
  icon,
  label,
  name,
  register, 
  error, 
  type = 'text',
  disabled = false,
  value, // (NEW)
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
          disabled={disabled}
          placeholder={`Enter your ${label.toLowerCase()}`}
          rows={type === 'textarea' ? 4 : undefined}
          className={`w-full pl-10 pr-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${
            type === 'date' ? 'text-gray-700' : ''
          }`}
          // (UPDATED) Conditionally spread register or use value
          {...(disabled ? { value: value || '' } : register)}
        />
      </div>
      {/* (NEW) Error message display */}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={14} /> {error.message}
        </p>
      )}
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
  const [isLoading, setIsLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined); 

  // (NEW) Mock state for notification preferences
  const [notifications, setNotifications] = useState({
    booking_updates: true,
    promotions: false,
  });

  // (NEW) Setup React Hook Form
  const {
    register,
    handleSubmit,
    reset, 
    watch, 
    formState: { errors, isSubmitting }, 
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      bio: '',
      date_of_birth: '',
      language: '',
      currency: '',
    },
  });
  
  // (NEW) Watch the full_name field to display under the avatar
  const watchedFullName = watch('full_name');

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
      } else if (data) {
        // (NEW) Populate the form with fetched data
        reset(data);
        setAvatarUrl(data.avatar_url); // (NEW) Set avatar URL
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [auth?.session, reset]); 

  // --- Real Avatar Upload ---
  const handleAvatarUpload = async (file: File): Promise<boolean> => {
    if (!auth?.session?.user) return false;

    const filePath = `${auth.session.user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload failed:', uploadError.message);
      alert('Upload failed. Please try again.');
      return false;
    }

    const { data: urlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath);

    const newAvatarUrl = urlData.publicUrl;

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

    setAvatarUrl(newAvatarUrl);
    return true;
  };

  // --- (UPDATED) Real Profile Save ---
  const onSave = async (data: ProfileFormData) => {
    if (!auth?.session?.user) return;

    const { error } = await supabase
      .from('users')
      .update({
        ...data, 
        updated_at: new Date().toISOString(),
      })
      .eq('id', auth.session.user.id);

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96 bg-white rounded-xl shadow-md border border-gray-100">
        <Loader2 size={48} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6 hidden lg:block">
        My Account
      </h1>

      <form
        onSubmit={handleSubmit(onSave)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* --- Left Column (Avatar) --- */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center">
            <AvatarUploader
              user={{
                id: auth.session!.user.id,
                email: auth.session!.user.email!,
                full_name: watchedFullName || 'User', 
                avatar_url: avatarUrl, 
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
                register={register('full_name')} 
                error={errors.full_name} 
              />
              {/* --- (THIS IS THE FIX) --- */}
              <FormInputRow
                icon={<Mail />}
                label="Email Address"
                name="email"
                value={auth.session!.user.email}
                disabled={true}
                // (FIX) We pass the real register, but the component will
                // ignore it because disabled={true}
                register={register('full_name')} 
              />
              {/* --- (END OF FIX) --- */}
              <FormInputRow
                icon={<Phone />}
                label="Phone Number"
                name="phone"
                type="tel"
                register={register('phone')} 
                error={errors.phone} 
              />
              <FormInputRow
                icon={<Calendar />}
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                register={register('date_of_birth')} 
                error={errors.date_of_birth} 
              />
              <div className="md:col-span-2">
                <FormInputRow
                  icon={<BookText />}
                  label="Bio"
                  name="bio"
                  type="textarea"
                  register={register('bio')} 
                  error={errors.bio} 
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
                placeholder="e.g., 'en' or 'English'"
                register={register('language')} 
                error={errors.language} 
              />
              <FormInputRow
                icon={<Banknote />}
                label="Preferred Currency"
                name="currency"
                placeholder="e.g., 'INR' or 'USD'"
                register={register('currency')} 
                error={errors.currency} 
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
              disabled={isSubmitting} 
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? ( 
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  // This page needs to be wrapped in AuthProvider and Router
  // to function correctly in isolation.
  return <AccountPage />;
}