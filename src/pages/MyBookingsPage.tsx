// src/pages/MyBookingsPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Calendar,
  MapPin,
  Users,
  Moon,
  Download,
  XCircle, // Icon for Cancel
  RefreshCw,
  MessageSquare, // Icon for Contact
  Loader2,
  AlertTriangle, // (NEW) For modal warning
  X,               // (NEW) For modal close
} from 'lucide-react';
import {
  format,
  differenceInCalendarDays,
  differenceInHours, // (NEW) For refund logic
  isPast,
  isFuture,
  isToday,
  parseISO,
} from 'date-fns';
// (DELETED) jsPDF import is no longer needed here

// (NEW) React Query Imports
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// (NEW) Framer Motion for modal animation
import { motion, AnimatePresence } from 'framer-motion';

// Import the real Supabase client and auth hook
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../App'; // Make sure useAuth is exported from App.tsx

// Import types, data, and helpers from the central data file
import { formatCurrency } from '../data/data';
import type {
  Booking,
  BookingStatus,
  Hotel,
  PriceBreakdown,
} from '../data/data';

// (NEW) Import the new PDF generator
import { downloadBookingPDF } from '../lib/pdfGenerator';

// --- TYPE DEFINITIONS ---
type FetchedBooking = Omit<Booking, 'hotel'> & {
  hotels: Hotel | null;
};

// --- (NEW) Cancel Booking Modal Component ---
type CancelModalProps = {
  booking: FetchedBooking | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
};

const CancelBookingModal = ({ booking, onClose, onConfirm, isPending }: CancelModalProps) => {
  const isOpen = !!booking;

  // (NEW) Refund Logic: Check if check-in is more than 48 hours away
  const isRefundable = useMemo(() => {
    if (!booking) return false;
    const checkInDate = parseISO(booking.check_in);
    return differenceInHours(checkInDate, new Date()) > 48;
  }, [booking]);

  const warning = isRefundable 
    ? "You are eligible for a full refund."
    : "You are past the free cancellation period and will not be refunded.";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Cancel Booking</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                Are you sure you want to cancel your booking at
                <br />
                <strong>{booking?.hotels?.name}?</strong>
              </h3>
              
              {/* (NEW) Refund Policy Warning */}
              <div 
                className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                  isRefundable 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <AlertTriangle 
                  size={24} 
                  className={isRefundable ? 'text-blue-600' : 'text-red-600'} 
                />
                <div>
                  <h4 
                    className={`font-semibold ${
                      isRefundable ? 'text-blue-800' : 'text-red-800'
                    }`}
                  >
                    {isRefundable ? 'Refund Eligible' : 'Non-Refundable'}
                  </h4>
                  <p 
                    className={`text-sm ${
                      isRefundable ? 'text-blue-700' : 'text-red-700'
                    }`}
                  >
                    {warning}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {isPending && <Loader2 size={18} className="animate-spin" />}
                  Yes, Cancel Booking
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


// --- CHILD COMPONENT: BookingCard (UPDATED) ---
type BookingCardProps = {
  booking: FetchedBooking;
  statusType: BookingStatus;
  onCancel: (booking: FetchedBooking) => void; // (MODIFIED) Prop type
  onDownload: (booking: FetchedBooking) => void; 
};

const BookingCard = ({
  booking,
  statusType,
  onCancel, // (MODIFIED) This is now a function that receives the booking
  onDownload, 
}: BookingCardProps) => {
  const {
    hotels: hotel,
    check_in,
    check_out,
    guests,
    price_breakdown,
    booking_reference,
    status,
  } = booking;

  if (!hotel) {
    return (
      <div className="bg-white rounded-xl shadow-md p-5 text-red-600">
        Booking data is corrupted. Hotel not found.
      </div>
    );
  }

  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);
  const nights = differenceInCalendarDays(checkOutDate, checkInDate);

  const StatusBadge = () => {
    // ... (StatusBadge logic is unchanged)
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
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}
      >
        {badgeText}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
      <div className="flex flex-col md:flex-row">
        <img
          src={hotel.thumbnail}
          alt={hotel.name}
          className="w-full md:w-1/3 h-48 md:h-auto object-cover"
        />
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-xl font-bold text-gray-800">{hotel.name}</h3>
              <StatusBadge />
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
              <MapPin size={14} />
              {hotel.address.street}, {hotel.address.city}
            </p>

            <div className="grid grid-cols-3 gap-4 text-sm text-gray-700 py-3 border-y border-gray-100">
              <div>
                <p className="font-semibold">Check-in</p>
                <p>{format(checkInDate, 'dd MMM yyyy')}</p>
              </div>
              <div>
                <p className="font-semibold">Check-out</p>
                <p>{format(checkOutDate, 'dd MMM yyyy')}</p>
              </div>
              <div>
                <p className="font-semibold">Guests</p>
                <p>
                  {guests.adults} Adults, {guests.children} Kids
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3">
              <div>
                <p className="text-sm text-gray-500">
                  Total Price ({nights} nights)
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(
                    price_breakdown.total,
                    price_breakdown.currency,
                    0
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Ref #</p>
                <p className="text-sm font-semibold text-gray-800">
                  {booking_reference}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Action Buttons Footer --- */}
      {statusType !== 'cancelled' && (
        <div className="flex items-center gap-2 p-4 border-t border-gray-100 bg-gray-50">
          {/* Show Cancel button ONLY for upcoming bookings */}
          {statusType === 'upcoming' && (
            <button
              // (MODIFIED) Removed window.confirm, just call onCancel
              onClick={() => onCancel(booking)}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-100"
            >
              <XCircle size={16} />
              Cancel Booking
            </button>
          )}

          <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-gray-200">
            <MessageSquare size={16} />
            Contact Hotel
          </button>

          <button
            onClick={() => onDownload(booking)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-gray-200"
          >
            <Download size={16} />
            Download Receipt
          </button>
        </div>
      )}
    </div>
  );
};

// --- (NEW) Data Fetching Function ---
const fetchBookingsQuery = async (userId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      hotels (*)
    `
    )
    .eq('user_id', userId)
    .order('check_in', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data as FetchedBooking[];
};

// --- PAGE COMPONENT: MyBookingsPage (UPDATED) ---
export const MyBookingsPage = () => {
  type Tab = 'upcoming' | 'ongoing' | 'past' | 'cancelled';
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  // (NEW) State for the cancellation modal
  const [bookingToCancel, setBookingToCancel] = useState<FetchedBooking | null>(null);
  
  const auth = useAuth();
  const queryClient = useQueryClient(); // (NEW)

  // --- (NEW) Data fetching logic with React Query ---
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', auth?.session?.user?.id],
    queryFn: () => fetchBookingsQuery(auth!.session!.user!.id),
    enabled: !!auth?.session?.user, // Only run if user is logged in
  });

  // --- (MODIFIED) Cancel Booking Mutation ---
  const cancelBookingMutation = useMutation({
    // (MODIFIED) The mutation function now needs to return the booking ID
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select('id') // Select the id
        .single();

      if (error) throw new Error(error.message);
      return data.id; // Return the ID
    },
    // (MODIFIED) The onSuccess handler now receives the ID
    onSuccess: (booking_id) => {
      // 1. Invalidate the query to refetch data
      queryClient.invalidateQueries({ queryKey: ['bookings', auth?.session?.user?.id] });

      // 2. (NEW) Fire-and-forget the cancellation email
      supabase.functions.invoke('send-cancellation-email', {
        body: { booking_id: booking_id },
      }).then(({ error: emailError }) => {
        if (emailError) {
          // Log the error for debugging, but don't bother the user
          console.error("Failed to send cancellation email:", emailError.message);
        }
      });
    },
    onError: (error) => {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    },
  });

  // (NEW) Handlers for opening and confirming the modal
  const handleOpenCancelModal = (booking: FetchedBooking) => {
    setBookingToCancel(booking);
  };

  const handleConfirmCancel = () => {
    if (bookingToCancel) {
      cancelBookingMutation.mutate(bookingToCancel.id);
      setBookingToCancel(null); // Close modal on confirm
    }
  };

  const getBookingStatus = (booking: FetchedBooking): BookingStatus => {
    if (booking.status === 'cancelled') return 'cancelled';
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);

    if (isPast(checkOut)) return 'past';
    if (isFuture(checkIn)) return 'upcoming';
    if ((isToday(checkIn) || isPast(checkIn)) && isFuture(checkOut))
      return 'ongoing';

    return 'past';
  };

  const filteredBookings = bookings.filter(
    (b) => getBookingStatus(b) === activeTab
  );

  const renderBookings = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-100">
          <Loader2 size={48} className="mx-auto text-blue-600 animate-spin" />
          <h3 className="mt-4 text-xl font-semibold text-gray-700">
            Loading your bookings...
          </h3>
        </div>
      );
    }

    if (filteredBookings.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-100">
          <Briefcase size={48} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-xl font-semibold text-gray-700">
            No bookings found
          </h3>
          <p className="mt-1 text-gray-500">
            You don't have any {activeTab} bookings.
          </p>
          <a
            href="/"
            className="mt-4 inline-block bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            Start Booking Now
          </a>
        </div>
      );
    }
    return (
      <div className="space-y-6 relative">
        {/* (NEW) Loading overlay for cancelling */}
        {cancelBookingMutation.isPending && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10 rounded-lg">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        )}
        {filteredBookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            statusType={activeTab}
            onCancel={handleOpenCancelModal} // (MODIFIED) Pass new handler
            onDownload={downloadBookingPDF} // (MODIFIED) Calls imported PDF generator
          />
        ))}
      </div>
    );
  };

  const TabButton = ({ tab, label }: { tab: Tab; label: string }) => (
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
    // This component now renders *inside* the ThreeTabSessionShell's <Outlet>
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6 hidden lg:block">
        My Bookings
      </h1>

      <div className="flex items-center gap-2 mb-6 p-2 bg-gray-200 rounded-lg">
        <TabButton tab="upcoming" label="Upcoming" />
        <TabButton tab="ongoing" label="Ongoing" />
        <TabButton tab="past" label="Past" />
        <TabButton tab="cancelled" label="Cancelled" />
      </div>

      {renderBookings()}

      {/* (NEW) Render the modal */}
      <CancelBookingModal
        booking={bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        onConfirm={handleConfirmCancel}
        isPending={cancelBookingMutation.isPending}
      />
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  // This page needs to be wrapped in AuthProvider and Router
  // to function correctly in isolation.
  return <MyBookingsPage />;
}