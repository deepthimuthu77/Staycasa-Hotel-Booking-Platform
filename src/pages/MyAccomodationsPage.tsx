import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  MapPin, 
  Star, 
  MessageSquare, 
  Edit3, 
  X, 
  Camera,
  ChevronLeft,
  CheckCircle,
  CalendarCheck2,
  Loader2 // Added for loading
} from 'lucide-react';
import { format } from 'date-fns';

// Import the real Supabase client and auth hook
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../App'; // Make sure useAuth is exported from App.tsx

// Import types and data from the central data file
import type {
  Hotel,
  Accommodation,
  Review
} from '../data/data';

// --- TYPE DEFINITIONS ---
// New type to represent the joined data from Supabase
type FetchedAccommodation = Accommodation & {
  hotels: Hotel | null; // Joined from 'hotels' table
  reviews: Review | null; // Joined from 'reviews' table
};

// --- CHILD COMPONENT: Header (No change) ---
const Header = () => (
  <header className="sticky top-0 z-30 bg-white shadow-sm p-4 border-b border-gray-200">
    {/* ... (JSX is unchanged) ... */}
  </header>
);

// --- CHILD COMPONENT: StarRatingInput (No change) ---
type StarRatingInputProps = {
  rating: number;
  setRating: (rating: number) => void;
};
const StarRatingInput = ({ rating, setRating }: StarRatingInputProps) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => setRating(star)}
        className={`transition-colors ${
          star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
        }`}
      >
        <Star size={28} fill="currentColor" />
      </button>
    ))}
  </div>
);

// --- CHILD COMPONENT: ReviewModal (UPDATED) ---
type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  accommodation: FetchedAccommodation | null; // Use the new type
  onSubmit: (reviewData: { rating: number, title: string, comment: string }) => void;
};

const ReviewModal = ({ isOpen, onClose, accommodation, onSubmit }: ReviewModalProps) => {
  // Get the hotel and existing review from the accommodation object
  const hotel = accommodation?.hotels;
  const existingReview = accommodation?.reviews;
  
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  
  // Pre-fill the form if an existing review is passed in
  useEffect(() => {
    if (accommodation) {
      setRating(existingReview?.rating || 0);
      setTitle(existingReview?.title || '');
      setComment(existingReview?.comment || '');
    }
  }, [accommodation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }
    onSubmit({ rating, title, comment });
  };

  if (!isOpen || !accommodation || !hotel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {existingReview ? 'Edit your review' : 'Write a review'}
          </h2>
          <p className="text-gray-600 mb-4">for {hotel.name}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ... (Rest of the form JSX is unchanged) ... */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Rating*</label>
              <StarRatingInput rating={rating} setRating={setRating} />
            </div>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 'A wonderful stay'"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                placeholder="Share your experience..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                Submit Review
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- CHILD COMPONENT: AccommodationCard (UPDATED) ---
type AccommodationCardProps = {
  accommodation: FetchedAccommodation;
  onWriteReview: (accommodation: FetchedAccommodation) => void;
};

const AccommodationCard = ({ accommodation, onWriteReview }: AccommodationCardProps) => {
  // Get hotel and review data from the joined accommodation object
  const hotel = accommodation.hotels;
  const existingReview = accommodation.reviews;

  // Safety check if the hotel join failed
  if (!hotel) {
    return (
      <div className="bg-white rounded-xl shadow-md p-5 text-red-600">
        Error: Could not load accommodation details.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col md:flex-row">
      <img src={hotel.thumbnail} alt={hotel.name} className="w-full md:w-48 h-40 md:h-full object-cover" />
      <div className="p-5 flex-1 flex flex-col md:flex-row justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{hotel.name}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
            <MapPin size={14} />
            {hotel.address?.city}
          </p>
          <p className="text-sm text-gray-600 flex items-center gap-1.5 font-medium">
            <CalendarCheck2 size={14} className="text-blue-600" />
            Last visited: {format(new Date(accommodation.last_visited_at), 'dd MMM yyyy')}
          </p>
          {accommodation.has_reviewed && (
            <p className="text-sm text-green-600 flex items-center gap-1.5 font-medium mt-1">
              <CheckCircle size={14} />
              You've reviewed this stay
            </p>
          )}
        </div>
        <button
          onClick={() => onWriteReview(accommodation)}
          className={`mt-4 md:mt-0 flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
            accommodation.has_reviewed
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {accommodation.has_reviewed ? (
            <Edit3 size={16} />
          ) : (
            <MessageSquare size={16} />
          )}
          {accommodation.has_reviewed ? 'Edit Review' : 'Write a Review'}
        </button>
      </div>
    </div>
  );
};


// --- PAGE COMPONENT: MyAccommodationsPage (UPDATED) ---
/**
 * Shows hotels the user has visited and allows them to manage reviews.
 */
export const MyAccommodationsPage = () => {
  type Tab = 'all' | 'reviewed' | 'not_reviewed';
  const [activeTab, setActiveTab] = useState<Tab>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // --- NEW: State for live data ---
  const [accommodations, setAccommodations] = useState<FetchedAccommodation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccommodation, setSelectedAccommodation] = useState<FetchedAccommodation | null>(null);
  const auth = useAuth(); // Get the real user session

  // --- NEW: Data fetching logic ---
  const fetchAccommodations = async () => {
    if (!auth?.session?.user) {
      setIsLoading(false);
      return; // Not logged in
    }
    
    setIsLoading(true);
    
    // Fetch accommodations and join related hotel AND review data
    const { data, error } = await supabase
      .from('accommodations')
      .select(`
        *,
        hotels (*),
        reviews (*)
      `)
      .eq('user_id', auth.session.user.id);
      
    if (error) {
      console.error("Error fetching accommodations:", error);
    } else {
      setAccommodations(data as FetchedAccommodation[]);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchAccommodations();
  }, [auth?.session]); // Re-fetch if auth state changes

  
  const handleOpenReviewModal = (accommodation: FetchedAccommodation) => {
    setSelectedAccommodation(accommodation);
    setIsModalOpen(true);
  };
  
  const handleCloseReviewModal = () => {
    setIsModalOpen(false);
    setSelectedAccommodation(null);
  };
  
  // --- NEW: Real review submission logic ---
  const handleSubmitReview = async (reviewData: { rating: number, title: string, comment: string }) => {
    if (!selectedAccommodation || !auth?.session?.user) {
      alert("You must be logged in to submit a review.");
      return;
    }
    
    try {
      // 1. Upsert (create or update) the review
      //    'upsert' is perfect for "edit review" functionality
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .upsert({
          id: selectedAccommodation.review_id || undefined, // Update existing if id is present
          user_id: auth.session.user.id,
          hotel_id: selectedAccommodation.hotel_id,
          rating: reviewData.rating,
          title: reviewData.title,
          comment: reviewData.comment,
        })
        .select()
        .single();
      
      if (reviewError) throw reviewError;

      // 2. Update the 'accommodations' table to link the review
      const { error: accError } = await supabase
        .from('accommodations')
        .update({
          has_reviewed: true,
          review_id: review.id
        })
        .eq('id', selectedAccommodation.id);
        
      if (accError) throw accError;
      
      // 3. Close modal and refresh data
      alert("Review submitted successfully!");
      handleCloseReviewModal();
      fetchAccommodations(); // Refresh the list
      
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  const filteredAccommodations = accommodations.filter(acc => {
    if (activeTab === 'all') return true;
    if (activeTab === 'reviewed') return acc.has_reviewed;
    if (activeTab === 'not_reviewed') return !acc.has_reviewed;
    return false;
  });

  const TabButton = ({ tab, label }: { tab: Tab, label: string }) => (
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
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="container mx-auto max-w-7xl p-4 mt-6">
        <a href="#" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 mb-4">
          <ChevronLeft size={16} />
          Back to Dashboard
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Accommodations</h1>

        <div className="flex items-center gap-2 mb-6 p-2 bg-gray-200 rounded-lg">
          <TabButton tab="all" label="All Stays" />
          <TabButton tab="reviewed" label="Reviewed" />
          <TabButton tab="not_reviewed" label="Not Reviewed" />
        </div>

        {isLoading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-100">
            <Loader2 size={48} className="mx-auto text-blue-600 animate-spin" />
            <h3 className="mt-4 text-xl font-semibold text-gray-700">Loading your stays...</h3>
          </div>
        ) : filteredAccommodations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-100">
            <Briefcase size={48} className="mx-auto text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold text-gray-700">No accommodations found</h3>
            <p className="mt-1 text-gray-500">You don't have any stays in this category.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAccommodations.map(acc => (
              <AccommodationCard 
                key={acc.id} 
                accommodation={acc} 
                onWriteReview={handleOpenReviewModal}
              />
            ))}
          </div>
        )}
      </main>

      {/* The modal is now driven by the selectedAccommodation state */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={handleCloseReviewModal}
        accommodation={selectedAccommodation}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  return <MyAccommodationsPage />;
}