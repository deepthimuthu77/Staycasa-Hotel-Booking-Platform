import { addDays } from 'date-fns';

// ================================================================================================
// --- 1. TYPE DEFINITIONS ---
// Consolidating all types from across the application.
// ================================================================================================

// --- User Types ---
export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
};

// --- Hotel & Room Types ---
export type Room = {
  id: string;
  name: string;
  description: string;
  capacity: number;
  bed_type: string;
  base_price_modifier: number; // e.g., 1.2 for 20% more than hotel base
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
  rating: number;
  description: string;
  amenities: string[];
  policies?: { checkIn: string; checkOut: string; cancellation: string; };
  gallery: string[];
  thumbnail: string; // <-- ADD THIS LINE
  rooms?: Room[];
  min_price: number;
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
  hotel: HotelSnapshot;
  check_in: string; // ISO Date string
  check_out: string; // ISO Date string
  guests: { adults: number; children: number };
  price_breakdown: PriceBreakdown;
  status: 'confirmed' | 'cancelled' | 'pending';
};

// *** THIS IS THE NEWLY ADDED TYPE ***
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
// --- 2. MOCK DATA ---
// Consolidating all mock data from across the application.
// ================================================================================================

const today = new Date();

// --- Mock User (from data.tsx) ---
export const mockUser: UserProfile = {
  id: "u-1",
  email: "anita.desai@example.com",
  full_name: "Anita Desai",
  phone: "+919876543210",
  bio: "Frequent traveler and food enthusiast.",
  avatar_url: "https://placehold.co/128x128/9CA3AF/FFFFFF?text=AD"
};

// --- Mock Hotel List (from BrowsePage.tsx) ---
export const mockHotelList: Hotel[] = [
  {
    id: "h-1",
    name: "Seaside Panorama Hotel",
    slug: "seaside-panorama-hotel",
    city: "Pondicherry",
    address: { street: "Beach Road 12", city: "Pondicherry", country: "India", lat: 11.926, lng: 79.8083 },
    description: "Experience breathtaking ocean views and unparalleled comfort.",
    stars: 5,
    rating: 4.8,
    min_price: 7999,
    currency: "INR",
    thumbnail: "https://placehold.co/400x300/3498db/ffffff?text=Seaside+Hotel",
    amenities: ["wifi", "pool", "ac", "breakfast"],
    is_featured: true,
    gallery: []
  },
  {
    id: "h-2",
    name: "Urban Oasis Suites",
    slug: "urban-oasis-suites",
    city: "Bangalore",
    address: { street: "MG Road 45", city: "Bangalore", country: "India", lat: 12.9716, lng: 77.5946 },
    description: "A modern retreat in the heart of the bustling city.",
    stars: 4,
    rating: 4.5,
    min_price: 5499,
    currency: "INR",
    thumbnail: "https://placehold.co/400x300/2ecc71/ffffff?text=Urban+Oasis",
    amenities: ["wifi", "gym", "ac", "parking"],
    is_featured: false,
    gallery: []
  },
  {
    id: "h-3",
    name: "Goa Beachfront Villa",
    slug: "goa-beachfront-villa",
    city: "Goa",
    address: { street: "Baga Beach", city: "Goa", country: "India", lat: 15.557, lng: 73.751 },
    description: "Your private paradise right on the sands of Baga beach.",
    stars: 5,
    rating: 4.9,
    min_price: 12500,
    currency: "INR",
    thumbnail: "https://placehold.co/400x300/e74c3c/ffffff?text=Goa+Villa",
    amenities: ["wifi", "pool", "ac", "breakfast"],
    is_featured: true,
    gallery: []
  },
  {
    id: "h-4",
    name: "The Heritage Inn",
    slug: "the-heritage-inn",
    city: "Jaipur",
    address: { street: "Old City", city: "Jaipur", country: "India", lat: 26.9124, lng: 75.7873 },
    description: "Stay in a beautifully restored haveli with royal charm.",
    stars: 3,
    rating: 4.3,
    min_price: 3200,
    currency: "INR",
    thumbnail: "https://placehold.co/400x300/f39c12/ffffff?text=Heritage+Inn",
    amenities: ["wifi", "ac", "breakfast"],
    is_featured: false,
    gallery: []
  }
];

// --- Mock Hotel Detail (from HotelDetailPage.tsx) ---
// --- Mock Hotel Detail (from HotelDetailPage.tsx) ---
export const mockHotelDetail: Hotel = {
  id: "h-1",
  name: "Seaside Panorama Hotel",
  slug: "seaside-panorama-hotel",
  // 1. ADDED THE MISSING 'city' PROPERTY
  city: "Pondicherry", 
  address: { street: "12 Beach Road", city: "Pondicherry", country: "India", zip: "605001", lat: 11.926, lng: 79.8083 },
  stars: 5,
  rating: 4.8,
  description: "Experience breathtaking ocean views and unparalleled comfort in our 5-star resort...",
  amenities: ["wifi", "pool", "ac", "breakfast", "gym", "parking", "spa", "room_service"],
  policies: {
    checkIn: "14:00",
    checkOut: "11:00",
    cancellation: "Free cancellation up to 48 hours before check-in."
  },
  gallery: [
    "https://placehold.co/800x600/3498db/ffffff?text=Main+View",
    "https://placehold.co/400x300/2ecc71/ffffff?text=Poolside",
    "https://placehold.co/400x300/e74c3c/ffffff?text=Lobby",
    "https://placehold.co/400x300/f39c12/ffffff?text=Deluxe+Room",
    "https://placehold.co/400x300/9b59b6/ffffff?text=Restaurant",
  ],
  // 2. ADDED THE MISSING 'thumbnail' PROPERTY (using the first gallery image)
  thumbnail: "https://placehold.co/800x600/3498db/ffffff?text=Main+View",
  rooms: [
    { id: "r-1", name: "Deluxe Ocean View", description: "King bed with balcony.", capacity: 2, bed_type: "King", base_price_modifier: 1.0, amenities: ["minibar", "balcony"], photos: [] },
    { id: "r-2", name: "Executive Suite", description: "King bed, separate living area.", capacity: 3, bed_type: "King", base_price_modifier: 1.5, amenities: ["minibar", "balcony", "living_room"], photos: [] },
    { id: "r-3", name: "Family Room", description: "Two queen beds.", capacity: 4, bed_type: "Queen", base_price_modifier: 1.3, amenities: ["minibar"], photos: [] },
  ],
  min_price: 7999,
  currency: "INR",
  is_featured: true
};

// --- Mock Reviews (from HotelDetailPage.tsx) ---
export const mockReviews: Review[] = [
  {
    id: "rev-1",
    user_id: "u-1",
    hotel_id: "h-1",
    user_name: "Anita Desai",
    user_avatar: "https://placehold.co/40x40/9CA3AF/FFFFFF?text=AD",
    rating: 5,
    title: "Absolutely stunning!",
    comment: "The view was incredible, and the service was top-notch.",
    photos: ["https://placehold.co/100x100/3498db/ffffff?text=View"],
    created_at: "2025-10-15T09:30:00Z"
  },
  {
    id: "rev-2",
    user_id: "u-2",
    hotel_id: "h-1",
    user_name: "Rohan Gupta",
    user_avatar: "https://placehold.co/40x40/2ECC71/FFFFFF?text=RG",
    rating: 4,
    title: "Great location, good food",
    comment: "Very convenient location on Beach Road. Breakfast was fantastic.",
    photos: [],
    created_at: "2025-10-12T14:45:00Z"
  }
];

// --- Mock Bookings (from MyBookingsPage.tsx) ---
export const mockBookings: Booking[] = [
  {
    id: "b-1",
    booking_reference: "PRO-20251120-A4F8",
    user_id: "u-1",
    hotel: {
      id: "h-1",
      name: "Seaside Panorama Hotel",
      city: "Pondicherry",
      thumbnail: "https://placehold.co/400x300/3498db/ffffff?text=Hotel+View",
      address: "12 Beach Road, Pondicherry"
    },
    check_in: addDays(today, 20).toISOString(),
    check_out: addDays(today, 23).toISOString(),
    guests: { adults: 2, children: 0 },
    price_breakdown: { nights: 3, base_price_per_night: 7000, subtotal: 21000, seasonal_mod: 1500, taxes: 3780, service_fee: 500, total: 25280, currency: "INR" },
    status: 'confirmed',
  },
  {
    id: "b-2",
    booking_reference: "PRO-20251028-B9C1",
    user_id: "u-1",
    hotel: {
      id: "h-2",
      name: "Mountain Retreat",
      city: "Manali",
      thumbnail: "https://placehold.co/400x300/2ecc71/ffffff?text=Mountain+View",
      address: "Old Manali, Manali"
    },
    check_in: addDays(today, -3).toISOString(), // Ongoing
    check_out: addDays(today, 2).toISOString(),
    guests: { adults: 2, children: 1 },
    price_breakdown: { nights: 5, base_price_per_night: 7000, subtotal: 35000, seasonal_mod: 0, taxes: 6300, service_fee: 500, total: 41800, currency: "INR" },
    status: 'confirmed',
  },
  {
    id: "b-3",
    booking_reference: "PRO-20250901-C3D7",
    user_id: "u-1",
    hotel: {
      id: "h-3",
      name: "City Center Inn",
      city: "Bangalore",
      thumbnail: "https://placehold.co/400x300/e74c3c/ffffff?text=City+Hotel",
      address: "MG Road, Bangalore"
    },
    check_in: addDays(today, -60).toISOString(), // Past
    check_out: addDays(today, -58).toISOString(),
    guests: { adults: 1, children: 0 },
    price_breakdown: { nights: 2, base_price_per_night: 4500, subtotal: 9000, seasonal_mod: 0, taxes: 1620, service_fee: 300, total: 10920, currency: "INR" },
    status: 'confirmed',
  },
  {
    id: "b-4",
    booking_reference: "PRO-20251201-D4E9",
    user_id: "u-1",
    hotel: {
      id: "h-4",
      name: "Goa Beachfront Villa",
      city: "Goa",
      thumbnail: "https://placehold.co/400x300/f39c12/ffffff?text=Goa+Villa",
      address: "Baga Beach, Goa"
    },
    check_in: addDays(today, 31).toISOString(),
    check_out: addDays(today, 35).toISOString(),
    guests: { adults: 4, children: 0 },
    price_breakdown: { nights: 4, base_price_per_night: 12000, subtotal: 48000, seasonal_mod: 0, taxes: 8640, service_fee: 1000, total: 57640, currency: "INR" },
    status: 'cancelled',
  },
];

// --- Mock Accommodations (from MyAccomodationsPage.tsx) ---
export const mockHotelsMap: Record<string, HotelSnapshot> = {
  "h-1": {
    id: "h-1",
    name: "Seaside Panorama Hotel",
    city: "Pondicherry",
    thumbnail: "https://placehold.co/400x300/3498db/ffffff?text=Hotel+View"
  },
  "h-2": {
    id: "h-2",
    name: "Mountain Retreat",
    city: "Manali",
    thumbnail: "https://placehold.co/400x300/2ecc71/ffffff?text=Mountain+View"
  },
  "h-3": {
    id: "h-3",
    name: "City Center Inn",
    city: "Bangalore",
    thumbnail: "https://placehold.co/400x300/e74c3c/ffffff?text=City+Hotel"
  }
};

export const mockAccommodations: Accommodation[] = [
  {
    id: "acc-1",
    user_id: "u-1",
    hotel_id: "h-3",
    last_visited_at: addDays(today, -58).toISOString(),
    has_reviewed: true,
    review_id: "r-1",
  },
  {
    id: "acc-2",
    user_id: "u-1",
    hotel_id: "h-1",
    last_visited_at: addDays(today, -75).toISOString(),
    has_reviewed: false,
    review_id: null,
  },
  {
    id: "acc-3",
    user_id: "u-1",
    hotel_id: "h-2",
    last_visited_at: addDays(today, -120).toISOString(),
    has_reviewed: true,
    review_id: "r-2",
  },
];

export const mockAccommodationReviews: Record<string, Review> = {
  "r-1": {
    id: "r-1",
    hotel_id: "h-3",
    user_id: "u-1",
    rating: 4,
    title: "Great location",
    comment: "Very convenient for business trips. Clean rooms and good service."
  },
  "r-2": {
    id: "r-2",
    hotel_id: "h-2",
    user_id: "u-1",
    rating: 5,
    title: "Breathtaking views!",
    comment: "The Mountain Retreat was absolutely stunning. Unforgettable."
  }
};


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