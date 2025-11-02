import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

// Import the central types and helper functions
import { formatCurrency } from '../data/data';
import type { PriceBreakdown } from '../data/data';

// --- TYPE DEFINITIONS ---
type BookingSummaryProps = {
  priceBreakdown: PriceBreakdown;
  onBookNow: () => void;
  isLoading?: boolean; // <-- ADDED THIS LINE
};

// --- BookingSummary Component ---
/**
 * A sticky summary card for the booking preview page.
 * Shows a detailed price breakdown and a "Book Now" button.
 */
export const BookingSummary = ({ 
  priceBreakdown, 
  onBookNow, 
  isLoading = false // <-- ADDED THIS LINE
}: BookingSummaryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    nights, 
    subtotal, 
    seasonal_mod, 
    taxes, 
    service_fee, 
    total, 
    currency, 
    base_price_per_night 
  } = priceBreakdown;

  // Use the imported formatCurrency helper, setting decimals to 0
  const formattedTotal = formatCurrency(total, currency, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-28">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Price Summary</h3>
      
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex justify-between">
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="flex items-center text-blue-600 hover:underline"
          >
            {formatCurrency(base_price_per_night, currency, 0)} x {nights} nights
            {isExpanded ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
          </button>
          <span>{formatCurrency(subtotal, currency, 0)}</span>
        </div>
        
        {isExpanded && (
          <div className="pl-4 space-y-1 text-xs text-gray-500 border-l-2 border-gray-200">
            <div className="flex justify-between">
              <span>Seasonal price adjustment</span>
              <span>+ {formatCurrency(seasonal_mod, currency, 0)}</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-between">
          <span>Taxes & fees</span>
          <span>{formatCurrency(taxes + service_fee, currency, 0)}</span>
        </div>
      </div>
      
      <div className="border-t border-gray-200 my-4"></div>
      
      <div className="flex justify-between items-center mb-5">
        <span className="text-lg font-bold text-gray-900">Total</span>
        <span className="text-2xl font-bold text-blue-600">{formattedTotal}</span>
      </div>
      
      {/* --- BUTTON UPDATED --- */}
      <button
        onClick={onBookNow}
        disabled={isLoading} // <-- ADDED THIS
        className="w-full bg-blue-600 text-white text-lg font-bold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 size={24} className="animate-spin mx-auto" /> // <-- ADDED LOADING SPINNER
        ) : (
          'Book Now'
        )}
      </button>
      <p className="text-xs text-gray-500 mt-3 text-center">
        You won't be charged yet. This is a mock payment.
      </p>
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
// This allows the component to be run independently for testing.
export default function App() {
  const mockPriceBreakdown: PriceBreakdown = {
    nights: 3,
    base_price_per_night: 7000,
    subtotal: 21000,
    seasonal_mod: 1500,
    taxes: 3780,
    service_fee: 500,
    total: 26780,
    currency: "INR"
  };

  return (
    <div className="p-8 bg-gray-100 flex justify-center">
      <div className="w-full max-w-sm">
        <BookingSummary 
          priceBreakdown={mockPriceBreakdown} 
          onBookNow={() => alert("Book Now Clicked!")} 
          isLoading={false} // You can toggle this to 'true' to test the loading spinner
        />
      </div>
    </div>
  );
}