import React, { useState } from 'react';
import { 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Moon, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  X,
  QrCode,
  Smartphone,
  Loader2
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

type BookingPreview = {
  hotel: HotelSnapshot;
  check_in: Date;
  check_out: Date;
  guests: { adults: number; children: number };
  price_breakdown: PriceBreakdown;
  room: { name: string; };
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
export const mockBookingPreview: BookingPreview = {
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

// --- CHILD COMPONENT: BookingSummary ---
type BookingSummaryProps = {
  priceBreakdown: PriceBreakdown;
  onBookNow: () => void;
};

export const BookingSummary = ({ priceBreakdown, onBookNow }: BookingSummaryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { nights, subtotal, seasonal_mod, taxes, service_fee, total, currency, base_price_per_night } = priceBreakdown;

  const formattedTotal = formatCurrency(total, currency);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-28">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Price Summary</h3>
      
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex justify-between">
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="flex items-center text-blue-600 hover:underline"
          >
            {formatCurrency(base_price_per_night, currency)} x {nights} nights
            {isExpanded ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
          </button>
          <span>{formatCurrency(subtotal, currency)}</span>
        </div>
        
        {isExpanded && (
          <div className="pl-4 space-y-1 text-xs text-gray-500 border-l-2 border-gray-200">
            <div className="flex justify-between">
              <span>Seasonal price adjustment</span>
              <span>+ {formatCurrency(seasonal_mod, currency)}</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-between">
          <span>Taxes & fees</span>
          <span>{formatCurrency(taxes + service_fee, currency)}</span>
        </div>
      </div>
      
      <div className="border-t border-gray-200 my-4"></div>
      
      <div className="flex justify-between items-center mb-5">
        <span className="text-lg font-bold text-gray-900">Total</span>
        <span className="text-2xl font-bold text-blue-600">{formattedTotal}</span>
      </div>
      
      <button
        onClick={onBookNow}
        className="w-full bg-blue-600 text-white text-lg font-bold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
      >
        Book Now
      </button>
      <p className="text-xs text-gray-500 mt-3 text-center">
        You won't be charged yet. This is a mock payment.
      </p>
    </div>
  );
};


// --- CHILD COMPONENT: MockPaymentModal ---
type MockPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // Renamed from onPaymentSuccess
  amount: string;
};

export const MockPaymentModal = ({ isOpen, onClose, onConfirm, amount }: MockPaymentModalProps) => {
  type Tab = 'qr' | 'app';
  const [activeTab, setActiveTab] = useState<Tab>('qr');
  const [paymentState, setPaymentState] = useState<'idle' | 'pending' | 'confirmed'>('idle');

  const handlePayment = () => {
    setPaymentState('pending');
    setTimeout(() => {
      setPaymentState('confirmed');
      setTimeout(() => {
        onConfirm(); // Call the success callback
        // Reset state for next time
        setPaymentState('idle');
        setActiveTab('qr');
      }, 1500); // Show success checkmark for 1.5s
    }, 2500); // Simulate 2.5s payment processing
  };
  
  const handleClose = () => {
    if (paymentState === 'pending') return; // Don't close while processing
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          disabled={paymentState === 'pending'}
        >
          <X size={24} />
        </button>
        
        {paymentState === 'idle' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Complete Payment</h2>
            <p className="text-center text-3xl font-bold text-blue-600 mb-4">{amount}</p>

            <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('qr')}
                className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm flex items-center justify-center gap-2 ${activeTab === 'qr' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}
              >
                <QrCode size={18} />
                Scan QR
              </button>
              <button
                onClick={() => setActiveTab('app')}
                className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm flex items-center justify-center gap-2 ${activeTab === 'app' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}
              >
                <Smartphone size={18} />
                Pay with App
              </button>
            </div>

            {/* QR Code Tab */}
            {activeTab === 'qr' && (
              <div className="flex flex-col items-center">
                <img 
                  src="https://placehold.co/256x256/000000/FFFFFF?text=Mock+QR+Code" 
                  alt="Mock QR Code" 
                  className="w-64 h-64 rounded-lg border-4 border-gray-200"
                />
                <p className="text-sm text-gray-500 mt-3 text-center">Scan this code with your payment app.</p>
              </div>
            )}
            
            {/* App Tab */}
            {activeTab === 'app' && (
              <div className="flex flex-col items-center space-y-3">
                <p className="text-sm text-gray-500 text-center">Select your mock payment app:</p>
                <button className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <img src="https://placehold.co/40x40/3498db/FFFFFF?text=P" alt="App" className="rounded-full" />
                  <span className="font-semibold">MockPay</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <img src="https://placehold.co/40x40/2ecc71/FFFFFF?text=G" alt="App" className="rounded-full" />
                  <span className="font-semibold">GeminiPay</span>
                </button>
              </div>
            )}
            
            <button
              onClick={handlePayment}
              className="w-full bg-green-600 text-white text-lg font-bold py-3 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-300 mt-6"
            >
              Simulate Successful Payment
            </button>
          </div>
        )}
        
        {paymentState === 'pending' && (
          <div className="p-12 flex flex-col items-center justify-center h-80">
            <Loader2 size={64} className="text-blue-600 animate-spin" />
            <h3 className="text-xl font-semibold text-gray-700 mt-4">Processing Payment...</h3>
            <p className="text-gray-500">Please wait.</p>
          </div>
        )}
        
        {paymentState === 'confirmed' && (
          <div className="p-12 flex flex-col items-center justify-center h-80 bg-green-50">
            <CheckCircle size={64} className="text-green-600" />
            <h3 className="text-xl font-semibold text-green-700 mt-4">Payment Confirmed!</h3>
            <p className="text-gray-500">Redirecting you...</p>
          </div>
        )}

      </div>
    </div>
  );
};


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

  const nights = differenceInCalendarDays(booking.check_out, booking.check_in);

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
                <span>{booking.hotel.cancellation_policy}</span>
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
            <BookingSummary 
              priceBreakdown={booking.price_breakdown}
              onBookNow={handleBookNow}
            />
          </div>
        </div>
      </main>

      <MockPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handlePaymentSuccess}
        amount={formatCurrency(booking.price_breakdown.total, booking.price_breakdown.currency)}
      />
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  return <BookingPreviewPage />;
}