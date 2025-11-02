// src/pages/BookingPreviewPage.tsx

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Moon, 
  Sparkles,
  ShieldCheck,
  Loader2 
} from 'lucide-react';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
// --- (UPDATED) Import useLocation to get router state ---
import { useNavigate, useLocation } from 'react-router-dom';

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
// This is the shape of the data we expect from HotelDetailPage
type BookingPreview = {
  hotel: HotelSnapshot;
  check_in: string; // Dates will come as ISO strings
  check_out: string;
  guests: { adults: number; children: number };
  price_breakdown: PriceBreakdown;
  room: { name: string; };
};

// --- HELPER FUNCTION ---
const generateBookingReference = () => {
  const date = format(new Date(), 'yyyyMMdd');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRO-${date}-${random}`;
};

// --- CHILD COMPONENT: Header (No change) ---
const Header = () => (
  <header className="sticky top-0 z-30 bg-white shadow-sm p-4 border-b border-gray-200">
    <div className="container mx-auto max-w-7xl flex justify-between items-center">
      <a href="/" className="text-2xl font-bold text-blue-600">ProBooker</a>
      <a href="/" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600">
        <ChevronLeft size={16} />
        Back to search
      </a>
    </div>
  </header>
);

// --- PAGE COMPONENT: BookingPreviewPage (UPDATED) ---
export const BookingPreviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  // Get booking data from router state
  const bookingData = location.state as BookingPreview | null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);

  // Redirect if no booking data is found
  useEffect(() => {
    if (!bookingData) {
      console.error("No booking data found, redirecting to home.");
      navigate('/');
    }
  }, [bookingData, navigate]);

  // Handle missing data during render
  if (!bookingData) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <Header />
        <div className="flex justify-center items-center h-96">
          <Loader2 size={48} className="animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  // Parse dates from ISO strings
  const checkInDate = parseISO(bookingData.check_in);
  const checkOutDate = parseISO(bookingData.check_out);
  const nights = differenceInCalendarDays(checkOutDate, checkInDate);

  // --- Real Booking Creation ---
  const handleBookNow = async () => {
    if (!auth?.session?.user) {
      alert("Please log in to make a booking.");
      navigate('/login');
      return;
    }
    
    setIsBooking(true);
    
    try {
      const newBookingRef = generateBookingReference();

      // 1. Create the booking object to insert (using real data)
      const bookingToInsert = {
        user_id: auth.session.user.id,
        hotel_id: bookingData.hotel.id,
        // room_id: null, // Add this if you pass room IDs
        check_in: bookingData.check_in.split('T')[0], // Format as 'YYYY-MM-DD'
        check_out: bookingData.check_out.split('T')[0],
        nights: nights,
        guests: bookingData.guests,
        price_breakdown: bookingData.price_breakdown, // Use the dynamic breakdown
        currency: bookingData.price_breakdown.currency,
        status: 'pending',
        booking_reference: newBookingRef,
      };

      // 2. Insert into Supabase
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingToInsert)
        .select()
        .single();
        
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

  // --- Real Payment Confirmation ---
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
      
      // 2. --- (NEW) Trigger the backend function to send the email ---
      await supabase.functions.invoke('send-confirmation-email', { 
        body: { booking_id: data.id } 
      });

      // 3. Close modal and navigate to confirmation page
      setIsModalOpen(false);
      navigate(`/booking/confirmation/${data.booking_reference}`);

    } catch (error) {
      console.error("Error confirming payment or sending email:", error);
      // Let the user know the booking is confirmed, but email might have failed
      alert("Payment was successful but we failed to send your confirmation email. Please contact support.");
      // Still navigate them
      if (pendingBooking) {
        navigate(`/booking/confirmation/${pendingBooking.booking_reference}`);
      }
    }
  };
  
  const handlePaymentFailure = () => {
    setIsModalOpen(false);
    alert("Payment Failed. Please try again.");
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="container mx-auto max-w-7xl p-4 mt-6">
        <a href="/" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 mb-4">
          <ChevronLeft size={16} />
          Back
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Confirm your booking</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- Left Column (Booking Details) --- */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex flex-col sm:flex-row gap-5">
                <img 
                  src={bookingData.hotel.thumbnail} 
                  alt={bookingData.hotel.name}
                  className="w-full sm:w-48 h-40 rounded-lg object-cover"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{bookingData.hotel.name}</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                    <MapPin size={14} />
                    {bookingData.hotel.address}
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-600" />
                      <strong>Check-in:</strong> {format(checkInDate, 'EEE, dd MMM yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-600" />
                      <strong>Check-out:</strong> {format(checkOutDate, 'EEE, dd MMM yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Moon size={14} className="text-blue-600" />
                      <strong>Total:</strong> {nights} {nights > 1 ? 'nights' : 'night'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-blue-600" />
                      <strong>Guests:</strong> {bookingData.guests.adults} Adults, {bookingData.guests.children} Children
                    </div>
                     <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-blue-600" />
                      <strong>Room:</strong> {bookingData.room.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Cancellation Policy</h3>
              <p className="text-sm text-gray-600">
                Free cancellation before 48 hours of check-in. (This is a mock policy).
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Special Requests</h3>
              <textarea
                placeholder="e.g., 'Late check-in', 'Room on a high floor'"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              ></textarea>
            </div>
            
             <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-center gap-3">
              <ShieldCheck size={24} className="text-yellow-700" />
              <p className="text-sm text-yellow-800">
                <strong>This is a mock booking.</strong> You will not be charged. This flow uses a fake payment modal to simulate the booking process.
              </p>
            </div>
          </div>
          
          {/* --- Right Column (Price Summary) --- */}
          <div className="lg:col-span-1">
            <BookingSummary 
              priceBreakdown={bookingData.price_breakdown} // Use the dynamic breakdown
              onBookNow={handleBookNow}
              isLoading={isBooking}
            />
          </div>
        </div>
      </main>

      {pendingBooking && (
        <MockPaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          booking={pendingBooking}
        />
      )}
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  // This page needs to be wrapped in AuthProvider and Router
  // to function correctly.
  return <BookingPreviewPage />;
}