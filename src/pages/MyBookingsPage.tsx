// src/pages/MyBookingsPage.tsx

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  format,
  differenceInCalendarDays,
  isPast,
  isFuture,
  isToday,
  parseISO,
} from 'date-fns';
import jsPDF from 'jspdf'; // (NEW) Import jsPDF for downloading

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

// --- TYPE DEFINITIONS ---
type FetchedBooking = Omit<Booking, 'hotel'> & {
  hotels: Hotel | null;
};

// --- (NEW) Centralized PDF Download Logic ---
const downloadBookingPDF = (booking: FetchedBooking) => {
  const { hotels: hotel } = booking;
  if (!hotel) {
    alert('Cannot download receipt: Hotel data is missing.');
    return;
  }

  // Create a new PDF document
  const doc = new jsPDF();

  // Add content to the PDF
  doc.setFontSize(22);
  doc.text('ProBooker', 105, 20, { align: 'center' });
  doc.setFontSize(18);
  doc.text('Booking Receipt', 105, 30, { align: 'center' });

  doc.setFontSize(14);
  doc.text(`Reference: ${booking.booking_reference}`, 105, 40, {
    align: 'center',
  });

  doc.setLineWidth(0.5);
  doc.line(10, 45, 200, 45);

  doc.setFontSize(12);
  doc.text(`Hotel: ${hotel.name}`, 15, 60);
  doc.text(`Address: ${hotel.address.street}, ${hotel.address.city}`, 15, 68);

  doc.text(
    `Check-in: ${format(parseISO(booking.check_in), 'EEE, dd MMM yyyy')}`,
    15,
    80
  );
  doc.text(
    `Check-out: ${format(parseISO(booking.check_out), 'EEE, dd MMM yyyy')}`,
    15,
    88
  );

  const guests = `${booking.guests.adults} Adult(s), ${booking.guests.children} Kid(s)`;
  doc.text(`Guests: ${guests}`, 15, 96);

  doc.line(10, 110, 200, 110);
  doc.setFontSize(16);
  doc.text(
    `Total Paid: ${formatCurrency(
      booking.price_breakdown.total,
      booking.price_breakdown.currency,
      0 // Show no decimals
    )}`,
    15,
    125
  );

  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text('Thank you for booking with ProBooker!', 105, 140, {
    align: 'center',
  });

  // Save the PDF
  doc.save(`ProBooker-Receipt-${booking.booking_reference}.pdf`);
};

// --- CHILD COMPONENT: BookingCard (UPDATED) ---
type BookingCardProps = {
  booking: FetchedBooking;
  statusType: BookingStatus;
  onCancel: (bookingId: string) => void;
  onDownload: (booking: FetchedBooking) => void; // (NEW) Add prop
};

const BookingCard = ({
  booking,
  statusType,
  onCancel,
  onDownload, // (NEW) Destructure prop
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
              onClick={() => {
                if (
                  window.confirm('Are you sure you want to cancel this booking?')
                ) {
                  onCancel(booking.id);
                }
              }}
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

          {/* (NEW) Hook up the download button */}
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

// --- PAGE COMPONENT: MyBookingsPage (UPDATED) ---
export const MyBookingsPage = () => {
  type Tab = 'upcoming' | 'ongoing' | 'past' | 'cancelled';
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  const [bookings, setBookings] = useState<FetchedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const auth = useAuth();

  // --- Data fetching logic ---
  const fetchBookings = async () => {
    if (!auth?.session?.user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        hotels (*)
      `
      )
      .eq('user_id', auth.session.user.id)
      .order('check_in', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setBookings(data as FetchedBooking[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [auth?.session]);

  // --- Cancel Booking Handler ---
  const handleCancelBooking = async (bookingId: string) => {
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      setBookings((currentBookings) =>
        currentBookings.map((b) =>
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        )
      );

      alert('Booking cancelled successfully.');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setIsCancelling(false);
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
        {/* Loading overlay for cancelling */}
        {isCancelling && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10 rounded-lg">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        )}
        {filteredBookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            statusType={activeTab}
            onCancel={handleCancelBooking}
            onDownload={downloadBookingPDF} // (NEW) Pass handler function
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
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  // This page needs to be wrapped in AuthProvider and Router
  // to function correctly in isolation.
  return <MyBookingsPage />;
}