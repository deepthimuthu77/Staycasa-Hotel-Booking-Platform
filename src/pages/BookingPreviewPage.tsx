import React, { useState } from 'react';
import { 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Moon, 
  Sparkles,
  ShieldCheck,
  Loader2 // Added for loading
} from 'lucide-react';
import { format, differenceInCalendarDays, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Import reusable components
import { BookingSummary } from '../components/BookingSummary';
import { MockPaymentModal } from '../components/MockPaymentModal';

// Import Supabase client and auth hook
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../App'; // Make sure useAuth is exported from App.tsx

// Import types and helpers from the central data file
import { formatCurrency } from '../data/data';
import type { PriceBreakdown, HotelSnapshot, Booking } from '../data/data';


// --- TYPE DEFINITIONS ---
type BookingPreview = {
  hotel: HotelSnapshot;
  check_in: Date;
  check_out: Date;
  guests: { adults: number; children: number };
  price_breakdown: PriceBreakdown;
  room: { name: string; };
};

// --- MOCK DATA ---
// In a real app, this data would be passed from the HotelDetailPage
// We keep it here for now so the page can still be tested
const today = new Date();
export const mockBookingPreview: BookingPreview = {
  hotel: {
    id: "h-1", // This ID must match a real hotel ID in your DB
    name: "My Test Hotel",
    address: "123 Test Street, Supabase",
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

// --- HELPER FUNCTION ---
// Creates a unique booking reference
const generateBookingReference = () => {
  const date = format(new Date(), 'yyyyMMdd');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRO-${date}-${random}`;
};

// --- CHILD COMPONENT: Header (No change) ---
const Header = () => (
  <header className="sticky top-0 z-30 bg-white shadow-sm p-4 border-b border-gray-200">
    {/* ... (JSX is unchanged) ... */}
  </header>
);

// --- PAGE COMPONENT: BookingPreviewPage (UPDATED) ---
/**
 * Summary page before confirming booking.
 * Now creates a 'pending' booking before payment.
 */
export const BookingPreviewPage = () => {
  const [booking] = useState(mockBookingPreview); // Using mock data for display
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);

  const auth = useAuth();
  const navigate = useNavigate();

  // --- NEW: Real Booking Creation ---
  const handleBookNow = async () => {
    if (!auth?.session?.user) {
      alert("Please log in to make a booking.");
      navigate('/login');
      return;
    }
    
    setIsBooking(true);
    
    try {
      const newBookingRef = generateBookingReference();

      // 1. Create the booking object to insert
      const bookingToInsert = {
        user_id: auth.session.user.id,
        hotel_id: booking.hotel.id,
        // room_id: null, // Add this if you have room IDs
        check_in: booking.check_in.toISOString().split('T')[0], // Format as 'YYYY-MM-DD'
        check_out: booking.check_out.toISOString().split('T')[0],
        nights: booking.price_breakdown.nights,
        guests: booking.guests,
        price_breakdown: booking.price_breakdown,
        currency: booking.price_breakdown.currency,
        status: 'pending', // Set status to pending
        booking_reference: newBookingRef,
      };

      // 2. Insert into Supabase
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingToInsert)
        .select() // Ask Supabase to return the new row
        .single(); // We only inserted one
        
      if (error) throw error;

      // 3. Save the created booking and open the modal
      setPendingBooking(data as Booking);
      setIsModalOpen(true);

    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Error: Could not start the booking process. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  // --- NEW: Real Payment Confirmation ---
  const handlePaymentSuccess = async (paymentMeta: object) => {
    if (!pendingBooking) {
      alert("Error: No pending booking found.");
      return;
    }

    try {
      // 1. Update the booking status to 'confirmed'
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_meta: paymentMeta,
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingBooking.id)
        .select()
        .single();

      if (error) throw error;
      
      // 2. Close modal and navigate to confirmation page
      setIsModalOpen(false);
      navigate(`/booking/confirmation/${data.booking_reference}`);

    } catch (error) {
      console.error("Error confirming payment:", error);
      alert("Payment was successful but we failed to confirm your booking. Please contact support.");
    }
  };
  
  const handlePaymentFailure = () => {
    // Optional: You could update the booking status to 'failed' here
    // For now, just close the modal.
    setIsModalOpen(false);
    alert("Payment Failed. Please try again.");
  };

  const nights = differenceInCalendarDays(booking.check_out, booking.check_in);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="container mx-auto max-w-7xl p-4 mt-6">
        {/* ... (Back button and H1 title) ... */}
        
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
                    {/* ... (Check-in, Check-out, Nights, Guests) ... */}
                  </div>
                </div>
              </div>
            </div>
            {/* ... (Cancellation Policy, Special Requests, Mock Booking warning) ... */}
          </div>
          
          {/* --- Right Column (Price Summary) --- */}
          <div className="lg:col-span-1">
            {/* This component is UPDATED to show a loading spinner
              while the 'pending' booking is being created.
            */}
            <BookingSummary 
              priceBreakdown={booking.price_breakdown}
              onBookNow={handleBookNow}
              isLoading={isBooking} // Pass the loading state
            />
          </div>
        </div>
      </main>

      {/* The modal is only rendered if a pendingBooking exists.
        It is passed the real pendingBooking object.
      */}
      {pendingBooking && (
        <MockPaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          booking={pendingBooking} // Pass the real pending booking
        />
      )}
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  return <BookingPreviewPage />;
}
