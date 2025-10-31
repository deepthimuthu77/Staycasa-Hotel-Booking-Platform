// --- TYPE DEFINITIONS ---
// Based on the mock data structure
export type Hotel = {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: { street: string; city: string; country: string; lat: number; lng: number };
  description: string;
  rating: number;
  stars: number;
  min_price: number;
  currency: string;
  thumbnail: string;
  gallery: string[];
  amenities: string[];
  is_featured: boolean;
};

// Added User type from AccountPage
export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
};


// --- MOCK DATA ---
export const mockHotel: Hotel = {
  id: "b3f8e1a4-1111-2222-3333-6f9a4d",
  name: "Seaside Panorama Hotel",
  slug: "seaside-panorama-hotel",
  city: "Pondicherry",
  address: { street: "Beach Road 12", city: "Pondicherry", country: "India", lat: 11.926, lng: 79.8083 },
  description: "Enjoy breathtaking views of the ocean from our stunning Seaside Panorama Hotel...",
  rating: 4.6,
  stars: 4,
  min_price: 2499,
  currency: "INR",
  thumbnail: "https://placehold.co/600x400/007bff/FFF?text=Seaside+Panorama",
  gallery: [
    "https://placehold.co/1200x800/007bff/FFF?text=Seaside+View+1",
    "https://placehold.co/1200x800/0056b3/FFF?text=Lobby",
  ],
  amenities: ["wifi", "breakfast", "pool", "ac", "gym", "parking"],
  is_featured: true,
};

// Added mockUser from AccountPage
export const mockUser: UserProfile = {
  id: "u-1",
  email: "anita.desai@example.com",
  full_name: "Anita Desai",
  phone: "+919876543210",
  bio: "Frequent traveler and food enthusiast. Always looking for the next best view and a great cup of coffee.",
  avatar_url: "https://placehold.co/128x128/9CA3AF/FFFFFF?text=AD"
};


// --- HELPER FUNCTION ---
export const formatCurrency = (amount: number, currency: string = "INR"): string => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: currency, 
    minimumFractionDigits: 2 
  }).format(amount);
};