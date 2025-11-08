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
  Loader2,
  AlertCircle, // (NEW) For errors
} from 'lucide-react';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';

// (NEW) React Query Imports
import { useMutation, useQueryClient } from '@tanstack/react-query';

// (NEW) React Hook Form Imports
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Import reusable components
import { BookingSummary } from '../components/BookingSummary';
import { MockPaymentModal } from '../components/MockPaymentModal';

// Import Supabase client and auth hook
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../App'; // Make sure useAuth is exported from App.tsx

// Import types and helpers from the central data file
import { formatCurrency } from '../data/data';
import type { PriceBreakdown, HotelSnapshot, Booking } from '../data/data';

// --- (NEW) Zod Schema for this form ---
const bookingPreviewSchema = z.object({
  special_requests: z
    .string()
    .max(500, 'Special requests cannot exceed 500 characters.')
    .optional(),
});
type BookingPreviewFormData = z.infer<typeof bookingPreviewSchema>;

// --- TYPE DEFINITIONS ---
// This is the shape of the data we expect from HotelDetailPage
type BookingPreview = {
  hotel: HotelSnapshot;
  check_in: string; // Dates will come as ISO strings
  check_out: string;
  guests: { adults: number; children: number };
  price_breakdown: PriceBreakdown;
  room: { name: string };
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
      <a href="/" className="text-2xl font-bold text-blue-600">
        ProBooker
      </a>
      <a
        href="/"
        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600"
      >
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
  const queryClient = useQueryClient(); // (NEW)

  // Get booking data from router state
  const bookingData = location.state as BookingPreview | null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);

  // (NEW) Setup React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors }, 
  } = useForm<BookingPreviewFormData>({
    resolver: zodResolver(bookingPreviewSchema),
    defaultValues: {
      special_requests: '',
    },
  });

  // Redirect if no booking data is found
  useEffect(() => {
    if (!bookingData) {
      console.error('No booking data found, redirecting to home.');
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

  // --- (NEW) Mutation for creating the 'pending' booking ---
  const createBookingMutation = useMutation({
    mutationFn: async (formData: BookingPreviewFormData) => {
      if (!auth?.session?.user) {
        throw new Error('Please log in to make a booking.');
      }
      
      const newBookingRef = generateBookingReference();

      // 1. Create the booking object to insert
      const bookingToInsert = {
        user_id: auth.session.user.id,
        hotel_id: bookingData.hotel.id,
        check_in: bookingData.check_in.split('T')[0], // Format as 'YYYY-MM-DD'
        check_out: bookingData.check_out.split('T')[0],
        nights: nights,
        guests: bookingData.guests,
        price_breakdown: bookingData.price_breakdown,
        currency: bookingData.price_breakdown.currency,
        status: 'pending',
        booking_reference: newBookingRef,
        special_requests: formData.special_requests || null,
      };

      // 2. Insert into Supabase
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingToInsert)
        .select()
        .single();

      if (error) throw error;
      return data as Booking;
    },
    onSuccess: (data) => {
      // 3. Save the created booking and open the modal
      setPendingBooking(data);
      setIsModalOpen(true);
    },
    onError: (error) => {
      console.error('Error creating booking:', error);
      alert('Error: Could not start the booking process. ' + error.message);
      if (error.message.includes('log in')) {
        navigate('/login');
      }
    }
  });

  // --- (NEW) Mutation for confirming the payment ---
  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentMeta: object) => {
      if (!pendingBooking) {
        throw new Error('Error: No pending booking found.');
      }

      // 1. Update the booking status to 'confirmed'
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_meta: paymentMeta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pendingBooking.id)
        .select()
        .single();

      if (error) throw error;

      // 2. Trigger the backend function to send the email
      await supabase.functions.invoke('send-confirmation-email', {
        body: { booking_id: data.id },
      });
      
      return data as Booking;
    },
    onSuccess: (data) => {
      // 3. Invalidate 'bookings' query to refresh "My Bookings" page
      queryClient.invalidateQueries({ queryKey: ['bookings', auth?.session?.user?.id] });
      
      // 4. Close modal and navigate to confirmation page
      setIsModalOpen(false);
      navigate(`/booking/confirmation/${data.booking_reference}`);
    },
    onError: (error) => {
      console.error('Error confirming payment or sending email:', error);
      alert(
        'Payment was successful but we failed to send your confirmation email. Please contact support.'
      );
      // Still navigate to confirmation, as payment was successful
      if (pendingBooking) {
        navigate(`/booking/confirmation/${pendingBooking.booking_reference}`);
      }
    }
  });

  // (NEW) Wrapper function to satisfy React Hook Form's handleSubmit
  const onFormSubmit = (formData: BookingPreviewFormData) => {
    createBookingMutation.mutate(formData);
  };

  const handlePaymentFailure = () => {
    setIsModalOpen(false);
    alert('Payment Failed. Please try again.');
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="container mx-auto max-w-7xl p-4 mt-6">
        {/* (NEW) Form tag now calls onFormSubmit */}
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <a
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 mb-4"
          >
            <ChevronLeft size={16} />
            Back
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Confirm your booking
          </h1>

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
                    <h2 className="text-2xl font-bold text-gray-800">
                      {bookingData.hotel.name}
                    </h2>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                      <MapPin size={14} />
                      {bookingData.hotel.address}
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-blue-600" />
                        <strong>Check-in:</strong>{' '}
                        {format(checkInDate, 'EEE, dd MMM yyyy')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-blue-600" />
                        <strong>Check-out:</strong>{' '}
                        {format(checkOutDate, 'EEE, dd MMM yyyy')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Moon size={14} className="text-blue-600" />
                        <strong>Total:</strong> {nights}{' '}
                        {nights > 1 ? 'nights' : 'night'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-blue-600" />
                        <strong>Guests:</strong> {bookingData.guests.adults}{' '}
                        Adults, {bookingData.guests.children} Children
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
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Cancellation Policy
                </h3>
                <p className="text-sm text-gray-600">
                  Free cancellation before 48 hours of check-in. (This is a mock
                  policy).
                </p>
              </div>

              {/* (UPDATED) Special Requests Section */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Special Requests
                </h3>
                <textarea
                  placeholder="e.g., 'Late check-in', 'Room on a high floor'"
                  className={`w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                    errors.special_requests
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  rows={4}
                  {...register('special_requests')}
                ></textarea>
                {/* (NEW) Error display */}
                {errors.special_requests && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />{' '}
                    {errors.special_requests.message}
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-center gap-3">
                <ShieldCheck size={24} className="text-yellow-700" />
                <p className="text-sm text-yellow-800">
                  <strong>This is a mock booking.</strong> You will not be
                  charged. This flow uses a fake payment modal to simulate the
                  booking process.
                </p>
              </div>
            </div>

            {/* --- Right Column (Price Summary) --- */}
            <div className="lg:col-span-1">
              <BookingSummary
                priceBreakdown={bookingData.price_breakdown}
                // (NEW) Trigger form submission, which triggers the mutation
                onBookNow={handleSubmit(onFormSubmit)}
                // (NEW) Use mutation's loading state
                isLoading={createBookingMutation.isPending}
              />
            </div>
          </div>
        </form>
      </main>

      {pendingBooking && (
        <MockPaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          // (NEW) Call the payment confirmation mutation
          onPaymentSuccess={(paymentMeta) => confirmPaymentMutation.mutate(paymentMeta)}
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