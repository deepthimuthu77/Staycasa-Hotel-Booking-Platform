import React, { useState, useRef } from 'react';
import { User as UserIcon, Camera, Upload, X, Loader2 } from 'lucide-react';

// --- TYPE DEFINITIONS ---
export type User = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
};

// --- MOCK DATA ---
export const mockUser: User = {
  id: "u-123",
  email: "demo@example.com",
  full_name: "Demo User",
  avatar_url: "https://placehold.co/150x150/9CA3AF/FFFFFF?text=DU"
};

type AvatarUploaderProps = {
  user: User;
  onAvatarChange: (file: File) => Promise<boolean>; // Returns true on success
};

// --- AvatarUploader Component ---
/**
 * Lets the user upload or change their profile picture.
 * (In a real app, this would involve cropping and compression).
 */
export const AvatarUploader = ({ user, onAvatarChange }: AvatarUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(user.avatar_url || null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    const success = await onAvatarChange(file); // Simulate upload
    setIsLoading(false);

    if (success) {
      setFile(null); // Clear file queue
    } else {
      // Handle error (e.g., show a toast)
      console.error("Upload failed");
      // Revert preview if upload fails and we're not keeping the optimistic update
      // setPreview(user.avatar_url || null);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreview(user.avatar_url || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

  return (
    <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col items-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Picture</h3>
      
      {/* --- Avatar Preview --- */}
      <div className="relative mb-4">
        <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
          {preview ? (
            <img src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
          ) : (
            <UserIcon size={64} className="text-gray-400" />
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-md hover:bg-blue-700 transition-colors"
          title="Change picture"
        >
          <Camera size={20} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />
      </div>

      <p className="text-xl font-bold text-gray-800">{user.full_name}</p>
      <p className="text-sm text-gray-500">{user.email}</p>

      {/* --- Upload/Cancel Buttons --- */}
      {file && (
        <div className="w-full flex gap-3 mt-6">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 p-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors"
          >
            <X size={16} />
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isLoading}
            className="flex-1 p-2.5 rounded-lg bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {isLoading ? 'Uploading...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
};
