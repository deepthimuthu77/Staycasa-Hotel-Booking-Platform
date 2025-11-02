import { addDays } from 'date-fns';

// ================================================================================================
// --- 1. TYPE DEFINITIONS ---
// Consolidating all types from across the application.
// ================================================================================================

// --- User Types ---
export type UserProfile = {
  id: string;
  
  full_name: string | null; // Changed to match DB
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  updated_at?: string; // Added to match DB
};

// --- Hotel & Room Types ---
export type Room = {
  id: string;
  hotel_id?: string; // Added to match DB
  name: string;
  description: string;
  capacity: number;
  bed_type: string;
  base_price_modifier: number; // In your schema, this is 'base_price' in rooms table
  amenities: string[];
  photos: string[];
};

export type Hotel = {
  id: string;
  name: string;
  slug: string;
  city: string; // This is in the 'address' jsonb, but duplicated here for simplicity
  address: { street: string; city: string; country: string; zip?: string; lat: number; lng: number };
  stars: number;
  popularity_score: number; // Changed from 'rating' to match DB
  description: string;
  amenities: string[];
  policies?: { checkIn: string; checkOut: string; cancellation: string; };
  gallery: string[];
  thumbnail: string; 
  rooms?: Room[]; // For joined data
  base_price: number; // Changed from 'min_price' to match DB
  currency: string;
  is_featured: boolean;
};

// --- Booking & Payment Types ---
export type PriceBreakdown = {
  nights: number;
  base_price_per_night: number;
  subtotal: number;
  seasonal_mod: number;
  taxes: number;
  service_fee: number;
  total: number;
  currency: string;
};

export type HotelSnapshot = {
  id: string;
  name: string;
  city: string;
  thumbnail: string;
  address?: string;
};

export type Booking = {
  id: string;
  booking_reference: string;
  user_id: string;
  hotel: HotelSnapshot; // This is for the mock, FetchedBooking type will use a join
  hotel_id?: string; // Added to match DB
  check_in: string; // ISO Date string
  check_out: string; // ISO Date string
  guests: { adults: number; children: number };
  price_breakdown: PriceBreakdown;
  status: 'confirmed' | 'cancelled' | 'pending';
  payment_meta?: object; // Added to match DB
};

export type BookingStatus = 'upcoming' | 'ongoing' | 'past' | 'cancelled';

// --- Review & Accommodation Types ---
export type Review = {
  id: string;
  user_id: string;
  hotel_id: string;
  user_name?: string;
  user_avatar?: string;
  rating: number;
  title: string;
  comment: string;
  photos?: string[];
  created_at?: string;
};

export type Accommodation = {
  id: string;
  user_id: string;
  hotel_id: string;
  last_visited_at: string; // ISO Date string
  has_reviewed: boolean;
  review_id: string | null;
};

// --- Filter & UI Types ---
export type Filters = {
  priceRange: { min: number; max: number };
  stars: number[];
  rating: number; // Kept for the FilterBar component
  amenities: string[];
};

export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export type GuestCount = {
  adults: number;
  children: number;
};


// ================================================================================================
// --- 2. MOCK DATA (REMOVED) ---
// All mock data (mockUser, mockHotelList, mockBookings, etc.)
// has been removed as the app is now connected to Supabase.
// ================================================================================================


// ================================================================================================
// --- 3. HELPER FUNCTIONS ---
// ================================================================================================

/**
 * Formats a number as currency.
 * @param amount The amount to format.
 * @param currency The currency code (e.g., "INR").
 * @param decimals The number of decimal places to show (default: 2).
 * @returns A formatted currency string.
 */
export const formatCurrency = (
  amount: number, 
  currency: string = "INR", 
  decimals: number = 2
): string => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: currency, 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
};