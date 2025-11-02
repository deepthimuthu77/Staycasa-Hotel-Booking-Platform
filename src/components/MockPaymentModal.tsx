import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  Banknote, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

// --- TYPE DEFINITIONS ---
// This local type is a subset of the main Booking type.
// It works perfectly with the real Booking object.
export type Booking = {
  id: string;
  booking_reference: string;
  price_breakdown: {
    total: number;
    currency: string;
    // The main type has more fields, but this is all this component needs.
  };
};

type MockPaymentModalProps = {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentMeta: object) => void;
  onPaymentFailure: () => void;
};

// --- HELPER FUNCTION ---
export const formatCurrency = (amount: number, currency: string = "INR"): string => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: currency, 
  }).format(amount);
};

// --- MockPaymentModal Component ---
/**
 * A modal for the fake payment flow (QR, fake apps).
 * This component is self-contained and requires no changes.
 */
export const MockPaymentModal = ({ 
  booking, 
  isOpen, 
  onClose, 
  onPaymentSuccess,
  onPaymentFailure
}: MockPaymentModalProps) => {
  const [paymentState, setPaymentState] = useState<'INIT' | 'PENDING' | 'CONFIRMED' | 'FAILED'>('INIT');
  const [activeTab, setActiveTab] = useState<'qr' | 'apps'>('qr');

  const handleConfirmPayment = () => {
    setPaymentState('PENDING');
    // Simulate API call
    setTimeout(() => {
      // Simulate a 80% success rate
      if (Math.random() < 0.8) {
        setPaymentState('CONFIRMED');
        
        // This is the object sent to the onPaymentSuccess prop
        const paymentMeta = {
          mock: true,
          method: activeTab === 'qr' ? "FAKE_QR" : "FAKE_UPI_APP",
          transaction_id: `mock_${crypto.randomUUID()}`,
          status: "confirmed",
          paid_at: new Date().toISOString()
        };
        
        // Close modal after success animation
        setTimeout(() => {
          onPaymentSuccess(paymentMeta);
          setPaymentState('INIT'); // Reset for next time
        }, 1500);
      } else {
        setPaymentState('FAILED');
        onPaymentFailure();
      }
    }, 2000);
  };
  
  const handleRetry = () => {
    setPaymentState('INIT');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4 transform transition-all duration-300 scale-100 opacity-100">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Complete Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* --- Modal Content --- */}
        <div className="p-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500">You are paying</p>
            <p className="text-4xl font-bold text-gray-900">
              {formatCurrency(booking.price_breakdown.total, booking.price_breakdown.currency)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Ref: {booking.booking_reference}
            </p>
          </div>

          {/* --- Payment State Handling --- */}
          {paymentState === 'INIT' && (
            <div>
              {/* Tabs */}
              <div className="flex w-full mb-4 rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`w-1/2 p-2 rounded-md font-semibold transition-colors ${
                    activeTab === 'qr' ? 'bg-white shadow' : 'text-gray-600'
                  }`}
                >
                  Scan QR Code
                </button>
                <button
                  onClick={() => setActiveTab('apps')}
                  className={`w-1/2 p-2 rounded-md font-semibold transition-colors ${
                    activeTab === 'apps' ? 'bg-white shadow' : 'text-gray-600'
                  }`}
                >
                  Use Payment App
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'qr' && (
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-white border border-gray-200 rounded-lg">
                    {/* Fake QR Code */}
                    <QrCode size={180} className="text-gray-800" />
                  </div>
                  <p className="text-sm text-gray-600 mt-3">Scan with any UPI app</p>
                </div>
              )}
              
              {activeTab === 'apps' && (
                <div className="space-y-3">
                  <p className="text-sm text-center text-gray-600">Select a (fake) app to pay</p>
                  <button className="w-full p-3 border border-gray-300 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-gray-50">
                    <Banknote size={20} className="text-green-500" />
                    FakePay
                  </button>
                  <button className="w-full p-3 border border-gray-300 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-gray-50">
                    <Banknote size={20} className="text-blue-500" />
                    MockPay
                  </button>
                </div>
              )}

              <button
                onClick={handleConfirmPayment}
                className="w-full bg-blue-600 text-white p-3 mt-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
              >
                I have paid
              </button>
            </div>
          )}

          {paymentState === 'PENDING' && (
            <div className="flex flex-col items-center justify-center h-48">
              <Loader2 size={48} className="text-blue-600 animate-spin" />
              <p className="text-lg font-semibold text-gray-700 mt-4">Confirming payment...</p>
              <p className="text-sm text-gray-500">Please wait, do not close this window.</p>
            </div>
          )}

          {paymentState === 'CONFIRMED' && (
            <div className="flex flex-col items-center justify-center h-48">
              <CheckCircle2 size={48} className="text-green-600" />
              <p className="text-lg font-semibold text-gray-700 mt-4">Payment Successful!</p>
              <p className="text-sm text-gray-500">Redirecting you...</p>
            </div>
          )}

          {paymentState === 'FAILED' && (
            <div className="flex flex-col items-center justify-center h-48">
              <AlertCircle size={48} className="text-red-600" />
              <p className="text-lg font-semibold text-gray-700 mt-4">Payment Failed</p>
              <p className="text-sm text-gray-500 mb-4">Please try again.</p>
              <button
                onClick={handleRetry}
                className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700"
              >
                Retry Payment
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-green-600" />
            This is a mock payment. No real money will be deducted.
          </p>
        </div>
      </div>
    </div>
  );
};