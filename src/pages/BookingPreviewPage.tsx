import React, { useState } from 'react';
import { 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Moon, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { format, differenceInCalendarDays, addDays } from 'date-fns';

// Import reusable components
import { BookingSummary } from '../components/BookingSummary';
import { MockPaymentModal } from '../components/MockPaymentModal';

// Import types and helpers from the central data file
import { formatCurrency } from '../data/data';
import type { PriceBreakdown, HotelSnapshot } from '../data/data';
// We also need the 'Booking' type for the modal prop
import type { Booking } from '../data/data';


// --- TYPE DEFINITIONS ---
// This type is specific to this page, so it stays
type BookingPreview = {
  hotel: HotelSnapshot;
  check_in: Date;
  check_out: Date;
  guests: { adults: number; children: number };
  price_breakdown: PriceBreakdown;
  room: { name: string; };
};

// --- HELPER FUNCTIONS (REMOVED) ---
// formatCurrency is now imported from ../data/data.tsx

// --- MOCK DATA ---
// This mock data is specific to this page's state, so it stays
const today = new Date();
export const mockBookingPreview: BookingPreview = {
  hotel: {
    id: "h-1",
    name: "Seaside Panorama Hotel",
    address: "12 Beach Road, Pondicherry",
    city: "Pondicherry",
    thumbnail: "https://placehold.co/400x300/3498db/ffffff?text=Hotel+View",
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

// --- CHILD COMPONENT: BookingSummary (REMOVED) ---
// This is now imported from ../components/BookingSummary.tsx

// --- CHILD COMPONENT: MockPaymentModal (REMOVED) ---
// This is now imported from ../components/MockPaymentModal.tsx


// --- PAGE COMPONENT: BookingPreviewPage ---
/**
 * Summary page before confirming booking.
 */
export const BookingPreviewPage = () => {
  const [booking] = useState(mockBookingPreview);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBookNow = () => {
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsModalOpen(false);
    // This is where you would navigate to the confirmation page
    alert("Booking Confirmed! (Mock) - Navigating to confirmation page...");
    // In a real app with a router:
    // navigate(`/booking/confirmation/PRO-MOCK-REF-123`);
  };
  
  const handlePaymentFailure = () => {
    setIsModalOpen(false);
    alert("Payment Failed. Please try again.");
  };

  const nights = differenceInCalendarDays(booking.check_out, booking.check_in);

  // We need to create a minimal 'Booking' object for the modal prop
  const bookingForModal: Pick<Booking, 'id' | 'booking_reference' | 'price_breakdown'> = {
    id: 'preview-123',
    booking_reference: 'PRO-PREVIEW-XYZ',
    price_breakdown: {
      // The modal only needs total and currency
      total: booking.price_breakdown.total,
      currency: booking.price_breakdown.currency,
      // Pass dummy values for the rest
      nights: booking.price_breakdown.nights,
      base_price_per_night: booking.price_breakdown.base_price_per_night,
      subtotal: booking.price_breakdown.subtotal,
      seasonal_mod: booking.price_breakdown.seasonal_mod,
      taxes: booking.price_breakdown.taxes,
      service_fee: booking.price_breakdown.service_fee,
    }
  };


  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="container mx-auto max-w-7xl p-4 mt-6">
        <a href="#" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 mb-4">
          <ChevronLeft size={16} />
          Back to Hotel Details
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Confirm your booking</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- Left Column (Booking Details) --- */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex flex-col sm:flex-row gap-5">
                <img 
                  src={booking.hotel.thumbnail} 
                  alt={booking.hotel.name}
                  className="w-full sm:w-48 h-40 rounded-lg object-cover"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{booking.hotel.name}</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                    <MapPin size={14} />
                    {booking.hotel.address}
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-600" />
                      <div>
                        <strong>Check-in:</strong> {format(booking.check_in, 'EEE, dd MMM yyyy')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-600" />
                      <div>
                        <strong>Check-out:</strong> {format(booking.check_out, 'EEE, dd MMM yyyy')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Moon size={16} className="text-blue-600" />
                      <div>
                        <strong>Total stay:</strong> {nights} {nights > 1 ? 'nights' : 'night'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-blue-600" />
                      <div>
                        <strong>Guests:</strong> {booking.guests.adults} Adult(s), {booking.guests.children} Kid(s)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Cancellation Policy</h3>
              <p className="text-sm text-gray-600 flex items-start gap-2">
                <ShieldCheck size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  {/* This property is not in the type, so hard-coding it for now. 
                      You could add `cancellation_policy` to `HotelSnapshot` in data.tsx */}
                  Free cancellation before 48 hours of check-in.
                </span>
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Special Requests</h3>
              <p className="text-sm text-gray-500 mb-2">
                Special requests cannot be guaranteed – but the property will do its best to meet your needs.
              </p>
              <textarea
                rows={4}
                placeholder="e.g., late check-in, high floor..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start gap-3">
              <Sparkles size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">This is a mock booking</h4>
                <p className="text-sm text-yellow-700">No real payment will be processed and no booking will be made. This is for demonstration purposes only.</p>
              </div>
            </div>
          </div>
          
          {/* --- Right Column (Price Summary) --- */}
          <div className="lg:col-span-1">
            {/* Use the imported BookingSummary component */}
            <BookingSummary 
              priceBreakdown={booking.price_breakdown}
              onBookNow={handleBookNow}
            />
          </div>
        </div>
      </main>

      {/* This is the corrected component call.
        It now passes the props required by src/components/MockPaymentModal.tsx
      */}
      <MockPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={handlePaymentFailure}
        booking={bookingForModal as Booking} // Pass the constructed booking object
      />
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  return <BookingPreviewPage />;
}