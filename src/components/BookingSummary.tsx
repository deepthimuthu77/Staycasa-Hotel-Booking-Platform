import React from 'react';
import { 
  Hash, 
  Calendar, 
  Moon, 
  Users, 
  Tag, 
  Receipt,
  FileText
} from 'lucide-react';

// --- HELPER FUNCTION ---
export const formatCurrency = (amount: number, currency: string = "INR"): string => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: currency, 
    minimumFractionDigits: 2
  }).format(amount);
};

// --- TYPE DEFINITIONS ---
export type PriceBreakdown = {
  nights: number;
  basePrice: number;
  seasonalMod: number;
  taxes: number;
  fees: number;
  total: number;
  currency: string;
};

export type Booking = {
  id: string;
  booking_reference: string;
  hotel: { id: string; name: string; thumbnail: string };
  check_in: string;
  check_out: string;
  guests: { adults: number; children: number };
  price_breakdown: PriceBreakdown;
  status: 'pending' | 'confirmed' | 'cancelled';
};

// --- MOCK DATA ---
export const mockBooking: Booking = {
  id: "bk_12345",
  booking_reference: "PRO-20251030-7F4Q",
  hotel: {
    id: "h_6789",
    name: "Seaside Panorama Hotel",
    thumbnail: "https://placehold.co/600x400/3498db/ffffff?text=Hotel+Image"
  },
  check_in: "2025-12-20",
  check_out: "2025-12-23",
  guests: { adults: 2, children: 1 },
  price_breakdown: {
    nights: 3,
    basePrice: 4500.00,
    seasonalMod: 300.00,
    taxes: 480.00,
    fees: 150.00,
    total: 5430.00,
    currency: "INR"
  },
  status: "pending"
};

// --- BookingSummary Component ---
/**
 * Shows booking details (dates, cost breakdown).
 * Used in BookingPreviewPage and BookingConfirmationPage.
 */
export const BookingSummary = ({ booking }: { booking: Booking }) => {
  const { price_breakdown: price, guests } = booking;
  const totalGuests = guests.adults + guests.children;

  const summaryItems = [
    { label: "Check-in", value: format(new Date(booking.check_in), 'EEE, dd MMM yyyy'), icon: Calendar },
    { label: "Check-out", value: format(new Date(booking.check_out), 'EEE, dd MMM yyyy'), icon: Calendar },
    { label: "Total Nights", value: `${price.nights} night${price.nights > 1 ? 's' : ''}`, icon: Moon },
    { label: "Guests", value: `${totalGuests} guest${totalGuests > 1 ? 's' : ''}`, icon: Users },
  ];

  const costItems = [
    { label: `Base Price (${price.nights} nights)`, value: price.basePrice },
    { label: "Seasonal Surcharge", value: price.seasonalMod },
    { label: "Taxes & Fees", value: price.taxes + price.fees },
  ];
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 w-full max-w-md overflow-hidden">
      <div className="p-5">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">{booking.hotel.name}</h2>
        <p className="text-sm text-gray-500 mb-4">
          Booking Reference: <span className="font-medium text-gray-700">{booking.booking_reference}</span>
        </p>

        {/* --- Booking Details --- */}
        <div className="border-t border-b border-gray-200 divide-y divide-gray-200 my-4">
          {summaryItems.map(item => (
            <div key={item.label} className="flex justify-between items-center py-3">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <item.icon size={16} />
                {item.label}
              </span>
              <span className="text-sm font-semibold text-gray-800">{item.value}</span>
            </div>
          ))}
        </div>

        {/* --- Price Breakdown --- */}
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Receipt size={18} />
          Price Breakdown
        </h3>
        <div className="space-y-2 text-sm">
          {costItems.map(item => (
            <div key={item.label} className="flex justify-between">
              <span className="text-gray-600">{item.label}</span>
              <span className="text-gray-800">{formatCurrency(item.value, price.currency)}</span>
            </div>
          ))}
        </div>

        {/* --- Total Price --- */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-dashed border-gray-200">
          <span className="text-lg font-bold text-gray-900">Total Amount</span>
          <span className="text-2xl font-bold text-blue-600">
            {formatCurrency(price.total, price.currency)}
          </span>
        </div>
      </div>
      
      {booking.status === 'confirmed' && (
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <button className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors">
            <FileText size={16} />
            Download Receipt
          </button>
        </div>
      )}
    </div>
  );
};
