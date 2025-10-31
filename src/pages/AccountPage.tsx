import React, { useState, ChangeEvent } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  BookText, 
  UploadCloud, 
  Trash2, 
  ShieldCheck, 
  Save, 
  ChevronLeft,
  Camera
} from 'lucide-react';

// --- TYPE DEFINITIONS ---
type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
};

// --- MOCK DATA ---
export const mockUser: UserProfile = {
  id: "u-1",
  email: "anita.desai@example.com",
  full_name: "Anita Desai",
  phone: "+919876543210",
  bio: "Frequent traveler and food enthusiast. Always looking for the next best view and a great cup of coffee.",
  avatar_url: "https://placehold.co/128x128/9CA3AF/FFFFFF?text=AD"
};

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

// --- CHILD COMPONENT: AvatarUploader ---
type AvatarUploaderProps = {
  currentAvatar: string | null;
  onAvatarChange: (file: File | null) => void;
};

export const AvatarUploader = ({ currentAvatar, onAvatarChange }: AvatarUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(currentAvatar);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onAvatarChange(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onAvatarChange(null);
    // In a real app, you might reset to a default avatar
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <img
          src={preview || 'https://placehold.co/128x128/E2E8F0/A0AEC0?text=No+Photo'}
          alt="Profile Avatar"
          className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md"
        />
        <label
          htmlFor="avatar-upload"
          className="absolute inset-0 w-32 h-32 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Camera size={32} />
        </label>
        <input
          type="file"
          id="avatar-upload"
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {preview && (
        <button
          onClick={handleRemove}
          className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
        >
          <Trash2 size={14} />
          Remove Photo
        </button>
      )}
    </div>
  );
};

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
  const [profile, setProfile] = useState<UserProfile>(mockUser);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving profile:", profile);
    
    if (avatarFile) {
      console.log("Uploading new avatar:", avatarFile.name);
      // --- MOCK UPLOAD ---
      // In a real app, this would call Supabase Storage:
      // const { data, error } = await supabase.storage
      //   .from('user-avatars')
      //   .upload(`${profile.id}/${avatarFile.name}`, avatarFile, { upsert: true });
      // if (data) {
      //   setProfile(prev => ({ ...prev, avatar_url: data.path }));
      // }
      await new Promise(res => setTimeout(res, 1000));
      console.log("Upload complete (mock)");
    }
    
    // In a real app, update the 'users' table in Supabase
    // const { data, error } = await supabase
    //   .from('users')
    //   .update({ full_name: profile.full_name, phone: profile.phone, bio: profile.bio, avatar_url: profile.avatar_url })
    //   .eq('id', profile.id);

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
                currentAvatar={profile.avatar_url}
                onAvatarChange={setAvatarFile}
              />
              <h2 className="text-xl font-semibold text-gray-800 mt-4">{profile.full_name}</h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
          </div>

          {/* --- Right Column (Details) --- */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Details</h3>
              <div className="space-y-4">
                <FormInputRow
                  icon={<User />}
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
