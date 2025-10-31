import React from 'react';
import { 
  CheckCircle, 
  MapPin, 
  Calendar, 
  Users, 
  Moon,
  ChevronLeft,
  Share2,
  Download,
  Printer
} from 'lucide-react';
import { format, differenceInCalendarDays, addDays } from 'date-fns';

// --- TYPE DEFINITIONS ---
type PriceBreakdown = {
  nights: number;
  base_price_per_night: number;
  subtotal: number;
  seasonal_mod: number;
  taxes: number;
  service_fee: number;
  total: number;
  currency: string;
};

type HotelSnapshot = {
  id: string;
  name: string;
  address: string;
  thumbnail: string;
  cancellation_policy: string;
};

type BookingConfirmation = {
  booking_reference: string;
  hotel: HotelSnapshot;
  check_in: Date;
  check_out: Date;
  guests: { adults: number; children: number };
  price_breakdown: PriceBreakdown;
  room: { name: string; };
  payment_meta: {
    mock: boolean;
    method: string;
    transaction_id: string;
    status: string;
    paid_at: string;
  }
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
const today = new Date();
export const mockBookingConfirmation: BookingConfirmation = {
  booking_reference: "PRO-20251031-4B7G",
  hotel: {
    id: "h-1",
    name: "Seaside Panorama Hotel",
    address: "12 Beach Road, Pondicherry",
    thumbnail: "https://placehold.co/400x300/3498db/ffffff?text=Hotel+View",
    cancellation_policy: "Free cancellation before 48 hours of check-in."
  },
  check_in: addDays(today, 10),
  check_out: addDays(today, 13),
  guests: { adults: 2, children: 0 },
  room: { name: "Deluxe Double Room with Sea View" },
  price_breakdown: {
    nights: 3,
    base_price_per_night: 7000,
    subtotal: 21000,
    seasonal_mod: 1500,
    taxes: 3780,
    service_fee: 500,
    total: 26780,
    currency: "INR"
  },
  payment_meta: {
    mock: true,
    method: "FAKE_QR",
    transaction_id: "mock_8a2b-4f9c-9d1e",
    status: "confirmed",
    paid_at: new Date().toISOString()
  }
};

// --- CHILD COMPONENT: Header ---
const Header = () => (
  <header className="sticky top-0 z-30 bg-white shadow-sm p-4 border-b border-gray-200">
    <div className="container mx-auto max-w-7xl flex justify-between items-center">
      <a href="#" className="text-2xl font-bold text-blue-600">ProBooker</a>
      <div className="flex items-center gap-4">
        <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">My Bookings</a>
        <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">My Account</a>
      </div>
    </div>
  </header>
);

// --- CHILD COMPONENT: BookingInfoRow ---
type BookingInfoRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};
const BookingInfoRow = ({ icon, label, value }: BookingInfoRowProps) => (
  <div className="flex items-start gap-3">
    <span className="text-blue-600 mt-1">{icon}</span>
    <div>
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="text-md font-medium text-gray-800">{value}</p>
    </div>
  </div>
);


// --- PAGE COMPONENT: BookingConfirmationPage ---
/**
 * "Success" screen after booking.
 */
export const BookingConfirmationPage = () => {
  const [booking] = React.useState(mockBookingConfirmation);
  const nights = differenceInCalendarDays(booking.check_out, booking.check_in);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl p-4 mt-10 mb-20">
        <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
          <CheckCircle size={64} className="text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Booking Confirmed!</h1>
          <p className="text-lg text-gray-600 mt-1">
            Your booking at {booking.hotel.name} is complete.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            A confirmation email has been sent to (mock-email)@example.com.
          </p>

          <div className="my-6 bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
            <p className="text-sm font-semibold text-blue-800">Your Booking Reference:</p>
            <p className="text-2xl font-bold text-blue-700 tracking-wider">
              {booking.booking_reference}
            </p>
          </div>
          
          <div className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{booking.hotel.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
              <BookingInfoRow 
                icon={<MapPin size={18} />}
                label="Location"
                value={booking.hotel.address}
              />
              <BookingInfoRow 
                icon={<Calendar size={18} />}
                label="Check-in"
                value={format(booking.check_in, 'EEE, dd MMM yyyy')}
              />
              <BookingInfoRow 
                icon={<Users size={18} />}
                label="Guests"
                value={`${booking.guests.adults} Adult(s), ${booking.guests.children} Kid(s)`}
              />
              <BookingInfoRow 
                icon={<Calendar size={18} />}
                label="Check-out"
                value={format(booking.check_out, 'EEE, dd MMM yyyy')}
              />
              <BookingInfoRow 
                icon={<Moon size={18} />}
                label="Total Stay"
                value={`${nights} ${nights > 1 ? 'nights' : 'night'}`}
              />
            </div>
            
            <div className="border-t border-gray-200 mt-5 pt-5 flex justify-between items-center">
              <span className="text-md font-semibold text-gray-600">Total Amount Paid:</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(booking.price_breakdown.total, booking.price_breakdown.currency)}
              </span>
            </div>
          </div>

          <div className="w-full border-t border-gray-200 mt-6 pt-6 flex flex-col sm:flex-row gap-3">
            <button
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              <Calendar />
              View My Bookings
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-800 px-5 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              <ChevronLeft />
              Back to Home
            </button>
          </div>
          
          <div className="w-full flex justify-center gap-4 mt-6">
             <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600">
               <Share2 size={16} /> Share
             </button>
             <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600">
               <Download size={16} /> Download
             </button>
             <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600">
               <Printer size={16} /> Print
             </button>
          </div>

        </div>
      </main>
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  return <BookingConfirmationPage />;
}
