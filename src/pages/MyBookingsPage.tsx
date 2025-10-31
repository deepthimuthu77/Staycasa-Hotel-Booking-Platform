import React, { useState } from 'react';
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
  ChevronLeft 
} from 'lucide-react';
import { format, differenceInCalendarDays, isPast, isFuture, isToday } from 'date-fns';

// --- TYPE DEFINITIONS ---
type BookingStatus = 'upcoming' | 'ongoing' | 'past' | 'cancelled';

type PriceBreakdown = {
  subtotal: number;
  taxes: number;
  service_fee: number;
  total: number;
  currency: string;
};

type HotelSnapshot = {
  id: string;
  name: string;
  city: string;
  thumbnail: string;
  address: string;
};

type Booking = {
  id: string;
  booking_reference: string;
  user_id: string;
  hotel: HotelSnapshot;
  check_in: string; // ISO Date string
  check_out: string; // ISO Date string
  guests: { adults: number; children: number };
  price_breakdown: PriceBreakdown;
  status: 'confirmed' | 'cancelled';
};

// --- HELPER FUNCTIONS ---
export const formatCurrency = (amount: number, currency: string = "INR"): string => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: currency, 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// --- MOCK DATA ---
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
    check_in: "2025-11-20T14:00:00Z",
    check_out: "2025-11-23T11:00:00Z",
    guests: { adults: 2, children: 0 },
    price_breakdown: { subtotal: 21000, taxes: 3780, service_fee: 500, total: 25280, currency: "INR" },
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
    check_in: "2025-10-28T14:00:00Z", // Assuming today is Oct 31, this is ongoing
    check_out: "2025-11-02T11:00:00Z",
    guests: { adults: 2, children: 1 },
    price_breakdown: { subtotal: 35000, taxes: 6300, service_fee: 500, total: 41800, currency: "INR" },
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
    check_in: "2025-09-01T14:00:00Z",
    check_out: "2025-09-03T11:00:00Z",
    guests: { adults: 1, children: 0 },
    price_breakdown: { subtotal: 9000, taxes: 1620, service_fee: 300, total: 10920, currency: "INR" },
    status: 'confirmed', // This is a "past" booking
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
    check_in: "2025-12-01T14:00:00Z",
    check_out: "2025-12-05T11:00:00Z",
    guests: { adults: 4, children: 0 },
    price_breakdown: { subtotal: 48000, taxes: 8640, service_fee: 1000, total: 57640, currency: "INR" },
    status: 'cancelled',
  },
];

// --- CHILD COMPONENT: Header ---
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

// --- CHILD COMPONENT: BookingCard ---
type BookingCardProps = {
  booking: Booking;
  statusType: BookingStatus;
};

const BookingCard = ({ booking, statusType }: BookingCardProps) => {
  const { hotel, check_in, check_out, guests, price_breakdown, booking_reference, status } = booking;
  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);
  const nights = differenceInCalendarDays(checkOutDate, checkInDate);

  const StatusBadge = () => {
    if (status === 'cancelled') {
      return <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Cancelled</span>;
    }
    switch (statusType) {
      case 'upcoming':
        return <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Upcoming</span>;
      case 'ongoing':
        return <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ongoing</span>;
      case 'past':
        return <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Completed</span>;
      default:
        return null;
    }
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
            {hotel.address}
          </p>
          
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-700 py-3 border-y border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Check-in</p>
              <p className="font-medium">{format(checkInDate, 'dd MMM yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Check-out</p>
              <p className="font-medium">{format(checkOutDate, 'dd MMM yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Guests</p>
              <p className="font-medium">{guests.adults} Adult(s), {guests.children} Kid(s)</p>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3">
            <div>
              <p className="text-xs text-gray-500">Total Price ({nights} nights)</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(price_breakdown.total, price_breakdown.currency)}
              </p>
            </div>
            <p className="text-xs text-gray-400">Ref: {booking_reference}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          {statusType === 'upcoming' && (
            <button className="flex-1 text-sm text-center bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-200">
              <XCircle size={16} className="inline mr-1" />
              Cancel Booking
            </button>
          )}
          {statusType === 'past' && (
            <button className="flex-1 text-sm text-center bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200">
              <MessageSquare size={16} className="inline mr-1" />
              Write a Review
            </button>
          )}
          {statusType !== 'cancelled' && (
            <button className="flex-1 text-sm text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200">
              <Download size={16} className="inline mr-1" />
              Download Receipt
            </button>
          )}
          {status === 'cancelled' && (
             <button className="flex-1 text-sm text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200">
              <RefreshCw size={16} className="inline mr-1" />
              Book Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- PAGE COMPONENT: MyBookingsPage ---
/**
 * List of all bookings by the logged-in user.
 */
export const MyBookingsPage = () => {
  type Tab = 'upcoming' | 'ongoing' | 'past' | 'cancelled';
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  // Today's date for logic (ignoring time for simplicity in isToday)
  const today = new Date();

  const getBookingStatus = (booking: Booking): BookingStatus => {
    if (booking.status === 'cancelled') return 'cancelled';
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);
    
    if (isPast(checkOut)) return 'past';
    if (isFuture(checkIn)) return 'upcoming';
    // If check-in is today or in the past, and check-out is in the future
    if ((isToday(checkIn) || isPast(checkIn)) && isFuture(checkOut)) return 'ongoing';
    
    return 'past'; // Default fallback
  };

  const filteredBookings = mockBookings.filter(b => getBookingStatus(b) === activeTab);

  const renderBookings = () => {
    if (filteredBookings.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-100">
          <Briefcase size={48} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-xl font-semibold text-gray-700">No bookings found</h3>
          <p className="mt-1 text-gray-500">You don't have any {activeTab} bookings.</p>
          <button className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700">
            Start Booking Now
          </button>
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
        <a href="#" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 mb-4">
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
  return <MyBookingsPage />;
}