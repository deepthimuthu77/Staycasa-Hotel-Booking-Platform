// src/pages/BookingConfirmationPage.tsx

import React, { useState, useEffect } from 'react';
import {
  useParams,
  useNavigate, // (NEW) For navigation
} from 'react-router-dom';
import {
  CheckCircle,
  MapPin,
  Calendar,
  Users,
  Moon,
  ChevronLeft,
  Share2,
  Download,
  Printer,
  Loader2, // (NEW) For loading
  AlertCircle, // (NEW) For errors
} from 'lucide-react';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import jsPDF from 'jspdf'; // (NEW) Import jsPDF for downloading

// (NEW) Import Supabase client
import { supabase } from '../lib/supabaseClient';

// (NEW) Import types from the central data file
import { formatCurrency } from '../data/data';
import type { Booking, Hotel } from '../data/data';

// --- (NEW) TYPE DEFINITIONS ---
// This type represents the data we fetch (a booking with its hotel)
type FetchedBooking = Booking & {
  hotels: Hotel | null; // Supabase join will return 'hotels' object
};

// --- CHILD COMPONENT: Header ---
const Header = () => (
  <header className="sticky top-0 z-30 bg-white shadow-sm p-4 border-b border-gray-200">
    <div className="container mx-auto max-w-7xl flex justify-between items-center">
      <a href="/" className="text-2xl font-bold text-blue-600">
        ProBooker
      </a>
      <div className="flex items-center gap-4">
        <a href="/bookings" className="text-sm font-medium text-gray-700 hover:text-blue-600">
          My Bookings
        </a>
        <a href="/profile" className="text-sm font-medium text-gray-700 hover:text-blue-600">
          My Account
        </a>
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

// --- PAGE COMPONENT: BookingConfirmationPage (UPDATED) ---
/**
 * "Success" screen after booking.
 * Now fetches live data based on the URL parameter.
 */
export const BookingConfirmationPage = () => {
  const { ref } = useParams(); // Get the booking_reference from the URL
  const navigate = useNavigate();

  const [booking, setBooking] = useState<FetchedBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // (NEW) Fetch the booking data on load
  useEffect(() => {
    if (!ref) {
      setError('No booking reference provided.');
      setIsLoading(false);
      return;
    }

    const fetchBooking = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('bookings')
        .select(
          `
          *,
          hotels (*)
        `
        )
        .eq('booking_reference', ref)
        .single(); // We expect only one booking

      if (error) {
        console.error('Error fetching booking:', error);
        setError('Could not find your booking. Please check the reference.');
      } else if (data) {
        setBooking(data as FetchedBooking);
      }
      setIsLoading(false);
    };

    fetchBooking();
  }, [ref]); // Re-run if the 'ref' changes

  // --- (NEW) Action Handlers ---
  const handleShare = () => {
    if (navigator.share && booking && booking.hotels) {
      navigator
        .share({
          title: `My Booking at ${booking.hotels.name}`,
          text: `Check out my booking at ${booking.hotels.name}! Ref: ${booking.booking_reference}`,
          url: window.location.href,
        })
        .catch((err) => console.error('Share failed:', err));
    } else {
      alert('Share not supported on this browser.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!booking || !booking.hotels) return;
    const hotel = booking.hotels;

    // Create a new PDF document
    const doc = new jsPDF();

    // Add content to the PDF
    doc.setFontSize(22);
    doc.text('ProBooker', 105, 20, { align: 'center' });
    doc.setFontSize(18);
    doc.text('Booking Confirmation', 105, 30, { align: 'center' });

    doc.setFontSize(14);
    doc.text(`Reference: ${booking.booking_reference}`, 105, 40, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(10, 45, 200, 45);

    doc.setFontSize(12);
    doc.text(`Hotel: ${hotel.name}`, 15, 60);
    doc.text(`Address: ${hotel.address.street}, ${hotel.address.city}`, 15, 68);
    
    doc.text(`Check-in: ${format(parseISO(booking.check_in), 'EEE, dd MMM yyyy')}`, 15, 80);
    doc.text(`Check-out: ${format(parseISO(booking.check_out), 'EEE, dd MMM yyyy')}`, 15, 88);
    
    const guests = `${booking.guests.adults} Adult(s), ${booking.guests.children} Kid(s)`
    doc.text(`Guests: ${guests}`, 15, 96);

    doc.line(10, 110, 200, 110);
    doc.setFontSize(16);
    doc.text(`Total Paid: ${formatCurrency(
        booking.price_breakdown.total,
        booking.price_breakdown.currency,
        0 // Show no decimals
      )}`, 15, 125);
    
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Thank you for booking with ProBooker!', 105, 140, { align: 'center' });

    // Save the PDF
    doc.save(`ProBooker-Confirmation-${booking.booking_reference}.pdf`);
  };

  // --- Render Loading State ---
  if (isLoading) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <Header />
        <main className="container mx-auto max-w-3xl p-4 mt-10 mb-20">
          <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 flex flex-col items-center text-center h-96 justify-center">
            <Loader2 size={64} className="text-blue-600 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mt-4">
              Loading your booking...
            </h1>
          </div>
        </main>
      </div>
    );
  }

  // --- Render Error State ---
  if (error || !booking) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <Header />
        <main className="container mx-auto max-w-3xl p-4 mt-10 mb-20">
          <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 flex flex-col items-center text-center h-96 justify-center">
            <AlertCircle size={64} className="text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900 mt-4">
              Booking Not Found
            </h1>
            <p className="text-lg text-gray-600 mt-1">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              <ChevronLeft />
              Back to Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- Render Success State (with fetched data) ---
  const checkInDate = parseISO(booking.check_in);
  const checkOutDate = parseISO(booking.check_out);
  const nights = differenceInCalendarDays(checkOutDate, checkInDate);
  const hotel = booking.hotels; // The joined hotel object

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl p-4 mt-10 mb-20">
        <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
          <CheckCircle size={64} className="text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-gray-600 mt-1">
            Your booking at {hotel?.name || 'the hotel'} is complete.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            A confirmation email has been sent.
          </p>

          <div className="my-6 bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
            <p className="text-sm font-semibold text-blue-800">
              Your Booking Reference:
            </p>
            <p className="text-2xl font-bold text-blue-700 tracking-wider">
              {booking.booking_reference}
            </p>
          </div>

          <div className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {hotel?.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
              <BookingInfoRow
                icon={<MapPin size={18} />}
                label="Location"
                value={`${hotel?.address.street}, ${hotel?.address.city}`}
              />
              <BookingInfoRow
                icon={<Calendar size={18} />}
                label="Check-in"
                value={format(checkInDate, 'EEE, dd MMM yyyy')}
              />
              <BookingInfoRow
                icon={<Users size={18} />}
                label="Guests"
                value={`${booking.guests.adults} Adult(s), ${booking.guests.children} Kid(s)`}
              />
              <BookingInfoRow
                icon={<Calendar size={18} />}
                label="Check-out"
                value={format(checkOutDate, 'EEE, dd MMM yyyy')}
              />
              <BookingInfoRow
                icon={<Moon size={18} />}
                label="Total Stay"
                value={`${nights} ${nights > 1 ? 'nights' : 'night'}`}
              />
            </div>

            <div className="border-t border-gray-200 mt-5 pt-5 flex justify-between items-center">
              <span className="text-md font-semibold text-gray-600">
                Total Amount Paid:
              </span>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  booking.price_breakdown.total,
                  booking.price_breakdown.currency,
                  0 // Show no decimals
                )}
              </span>
            </div>
          </div>

          <div className="w-full border-t border-gray-200 mt-6 pt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/bookings')}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              <Calendar />
              View My Bookings
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-800 px-5 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              <ChevronLeft />
              Back to Home
            </button>
          </div>

          <div className="w-full flex justify-center gap-4 mt-6">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600"
            >
              <Share2 size={16} /> Share
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600"
            >
              <Download size={16} /> Download
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600"
            >
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
  // This page needs to be wrapped in a Router to use useParams
  return <BookingConfirmationPage />;
}