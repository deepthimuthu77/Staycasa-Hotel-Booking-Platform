import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  Users, 
  Moon, 
  Download, 
  XCircle, 
  RefreshCw, 
  MessageSquare,
  ChevronLeft,
  Loader2 // Added for loading
} from 'lucide-react';
import { format, differenceInCalendarDays, isPast, isFuture, isToday } from 'date-fns';

// Import the real Supabase client and auth hook
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../App'; // Make sure useAuth is exported from App.tsx

// Import types, data, and helpers from the central data file
import { 
  formatCurrency, 
} from '../data/data';
import type { 
  Booking, 
  BookingStatus, 
  Hotel, // We need the full Hotel type for the join
  PriceBreakdown 
} from '../data/data';

// --- TYPE DEFINITIONS ---
// Create a new type to represent the data fetched from Supabase
// It replaces 'hotel: HotelSnapshot' with 'hotels: Hotel' from the join
type FetchedBooking = Omit<Booking, 'hotel'> & {
  hotels: Hotel | null; // Supabase returns the joined table as a property
};


// --- CHILD COMPONENT: Header (No change) ---
const Header = () => (
  <header className="sticky top-0 z-30 bg-white shadow-sm p-4 border-b border-gray-200">
    <div className="container mx-auto max-w-7xl flex justify-between items-center">
      <a href="#" className="text-2xl font-bold text-blue-600">ProBooker</a>
      <div className="flex items-center gap-4">
        <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Browse</a>
        <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">My Account</a>
      </div>
    </div>
  </header>
);

// --- CHILD COMPONENT: BookingCard (UPDATED) ---
type BookingCardProps = {
  booking: FetchedBooking; // Use the new FetchedBooking type
  statusType: BookingStatus;
};

const BookingCard = ({ booking, statusType }: BookingCardProps) => {
  // Use 'hotels' from the join and rename it to 'hotel'
  const { hotels: hotel, check_in, check_out, guests, price_breakdown, booking_reference, status } = booking;
  
  // Add a safety check in case the joined hotel data is missing
  if (!hotel) {
    return <div className="bg-white rounded-xl shadow-md p-5 text-red-600">Booking data is corrupted. Hotel not found.</div>;
  }
  
  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);
  const nights = differenceInCalendarDays(checkOutDate, checkInDate);

  const StatusBadge = () => {
    // Example logic for status badge rendering
    let badgeColor = '';
    let badgeText = '';

    switch (statusType) {
      case 'upcoming':
        badgeColor = 'bg-blue-100 text-blue-700';
        badgeText = 'Upcoming';
        break;
      case 'ongoing':
        badgeColor = 'bg-green-100 text-green-700';
        badgeText = 'Ongoing';
        break;
      case 'past':
        badgeColor = 'bg-gray-100 text-gray-700';
        badgeText = 'Past';
        break;
      case 'cancelled':
        badgeColor = 'bg-red-100 text-red-700';
        badgeText = 'Cancelled';
        break;
      default:
        badgeColor = 'bg-gray-100 text-gray-700';
        badgeText = statusType;
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
        {badgeText}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col md:flex-row">
      <img src={hotel.thumbnail} alt={hotel.name} className="w-full md:w-1/3 h-48 md:h-full object-cover" />
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-xl font-bold text-gray-800">{hotel.name}</h3>
            <StatusBadge />
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
            <MapPin size={14} />
            {/* UPDATED: Use the 'address' object from the 'hotels' table */}
            {hotel.address.street}, {hotel.address.city}
          </p>
          
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-700 py-3 border-y border-gray-100">
            {/* ... (This section is unchanged) ... */}
          </div>

          <div className="flex justify-between items-center mt-3">
            {/* ... (This section is unchanged) ... */}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          {/* ... (This section is unchanged) ... */}
        </div>
      </div>
    </div>
  );
};

// --- PAGE COMPONENT: MyBookingsPage (UPDATED) ---
/**
 * List of all bookings by the logged-in user, fetched from Supabase.
 */
export const MyBookingsPage = () => {
  type Tab = 'upcoming' | 'ongoing' | 'past' | 'cancelled';
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  
  // --- NEW: State for live data ---
  const [bookings, setBookings] = useState<FetchedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const auth = useAuth(); // Get the real user session

  // --- NEW: Data fetching logic ---
  useEffect(() => {
    const fetchBookings = async () => {
      if (!auth?.session?.user) {
        setIsLoading(false);
        return; // Not logged in
      }
      
      setIsLoading(true);
      
      // Fetch bookings AND their related hotel data
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          hotels (*)
        `)
        .eq('user_id', auth.session.user.id)
        .order('check_in', { ascending: false }); // Show newest first
        
      if (error) {
        console.error("Error fetching bookings:", error);
      } else {
        setBookings(data as FetchedBooking[]);
      }
      setIsLoading(false);
    };

    fetchBookings();
  }, [auth?.session]); // Re-fetch if auth state changes

  // Today's date for logic
  const today = new Date();

  const getBookingStatus = (booking: FetchedBooking): BookingStatus => {
    if (booking.status === 'cancelled') return 'cancelled';
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);
    
    if (isPast(checkOut)) return 'past';
    if (isFuture(checkIn)) return 'upcoming';
    if ((isToday(checkIn) || isPast(checkIn)) && isFuture(checkOut)) return 'ongoing';
    
    return 'past'; // Default fallback
  };

  // Use the new 'bookings' state
  const filteredBookings = bookings.filter(b => getBookingStatus(b) === activeTab);

  const renderBookings = () => {
    // NEW: Show loading state
    if (isLoading) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-100">
          <Loader2 size={48} className="mx-auto text-blue-600 animate-spin" />
          <h3 className="mt-4 text-xl font-semibold text-gray-700">Loading your bookings...</h3>
        </div>
      );
    }
    
    if (filteredBookings.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-100">
          <Briefcase size={48} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-xl font-semibold text-gray-700">No bookings found</h3>
          <p className="mt-1 text-gray-500">You don't have any {activeTab} bookings.</p>
          <a href="/" className="mt-4 inline-block bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700">
            Start Booking Now
          </a>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {filteredBookings.map(booking => (
          <BookingCard key={booking.id} booking={booking} statusType={activeTab} />
        ))}
      </div>
    );
  };

  const TabButton = ({ tab, label }: { tab: Tab, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 font-semibold rounded-lg ${
        activeTab === tab
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="container mx-auto max-w-7xl p-4 mt-6">
        <a href="/" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 mb-4">
          <ChevronLeft size={16} />
          Back to Dashboard
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Bookings</h1>

        <div className="flex items-center gap-2 mb-6 p-2 bg-gray-200 rounded-lg">
          <TabButton tab="upcoming" label="Upcoming" />
          <TabButton tab="ongoing" label="Ongoing" />
          <TabButton tab="past" label="Past" />
          <TabButton tab="cancelled" label="Cancelled" />
        </div>

        {renderBookings()}
      </main>
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  // This page needs to be wrapped in AuthProvider and Router
  // to function correctly in isolation.
  return <MyBookingsPage />;
}