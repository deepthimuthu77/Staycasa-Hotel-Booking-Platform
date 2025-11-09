// src/data/data.tsx

import { addDays } from 'date-fns';

// ================================================================================================
// --- 1. TYPE DEFINITIONS ---
// Consolidating all types from across the application.
// ================================================================================================

// --- User Types ---
export type UserProfile = {
  id: string;
  
  full_name: string | null; 
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  updated_at?: string; 
  
  // --- (NEW) Added fields from JSON spec ---
  date_of_birth?: string; // Stored as 'YYYY-MM-DD' string or date
  language?: string; // e.g., 'en', 'fr'
  currency?: string; // e.g., 'INR', 'USD'
};

// --- Hotel & Room Types ---
export type Room = {
  id: string;
  hotel_id?: string; 
  name: string;
  description: string;
  capacity: number;
  bed_type: string;
  base_price: number; // In your schema, this is 'base_price' in rooms table
  amenities: string[];
  photos: string[];
};

export type Hotel = {
  id: string;
  name: string;
  slug: string;
  city: string; 
  address: { street: string; city: string; country: string; zip?: string; lat: number; lng: number };
  stars: number;
  popularity_score: number; 
  description: string;
  amenities: string[];
  policies?: { checkIn: string; checkOut: string; cancellation: string; };
  gallery: string[];
  thumbnail: string; 
  rooms?: Room[]; // For joined data
  base_price: number; 
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
  hotel_id?: string; 
  check_in: string; // ISO Date string
  check_out: string; // ISO Date string
  guests: { adults: number; children: number };
  price_breakdown: PriceBreakdown;
  status: 'confirmed' | 'cancelled' | 'pending';
  payment_meta?: object; 
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
  rating: number; 
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
  decimals: number = 0 // <-- (THE FIX) Changed default from 2 to 0
): string => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: currency, 
    minimumFractionDigits: decimals, // <-- This will now be 0
    maximumFractionDigits: decimals  // <-- This will now be 0
  }).format(amount);
};