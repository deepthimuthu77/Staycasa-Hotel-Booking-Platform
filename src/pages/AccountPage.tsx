import React, { useState, ChangeEvent } from 'react';
import { 
  User as UserIcon, // Aliased to avoid name conflict
  Mail, 
  Phone, 
  BookText, 
  ShieldCheck, 
  Save, 
  ChevronLeft,
} from 'lucide-react';

// Import the reusable component from the components directory
import { AvatarUploader } from '../components/AvatarUploader';

// Import types and mock data from data.tsx
import { UserProfile, mockUser } from '../data/data.tsx';

// --- TYPE DEFINITIONS (REMOVED) ---
// The UserProfile type is now imported from ../data/data

// --- MOCK DATA (REMOVED) ---
// The mockUser object is now imported from ../data/data


// --- CHILD COMPONENT: Header ---
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

// --- CHILD COMPONENT: FormInputRow ---
type FormInputRowProps = {
  icon: React.ReactNode;
  label: string;
  name: string;
  value: string | null;
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
          {React.cloneElement(icon as React.ReactElement, { size: 18 })}
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


// --- PAGE COMPONENT: AccountPage ---
/**
 * User profile page (with AvatarUploader).
 */
export const AccountPage = () => {
  // Use the imported mockUser as the initial state
  const [profile, setProfile] = useState<UserProfile>(mockUser);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  /**
   * This function is passed to the reusable AvatarUploader component.
   * It handles the "upload" logic and returns a boolean.
   */
  const handleAvatarUpload = async (file: File): Promise<boolean> => {
    console.log("Uploading new avatar:", file.name);
    
    // --- MOCK UPLOAD ---
    await new Promise(res => setTimeout(res, 1000));
    
    // Optimistically update the profile state with a local blob URL
    const newAvatarUrl = URL.createObjectURL(file);
    setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));

    console.log("Upload complete (mock)");
    return true; // Return true on success
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving profile (text fields):", profile);
    
    // In a real app, update the 'users' table in Supabase
    alert("Profile saved successfully! (Mock)");
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="container mx-auto max-w-7xl p-4 mt-6">
        <a href="#" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 mb-4">
          <ChevronLeft size={16} />
          Back to Dashboard
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Account</h1>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- Left Column (Avatar) --- */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center">
              <AvatarUploader
                // The reusable component expects a 'user' prop
                // We create it from our 'profile' state
                user={{
                  id: profile.id,
                  email: profile.email,
                  full_name: profile.full_name,
                  avatar_url: profile.avatar_url,
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
                  value={profile.email}
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
                  onClick={() => alert("Password reset link sent! (Mock)")}
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
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                <Save size={18} />
                Save Changes
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
  return <AccountPage />;
}