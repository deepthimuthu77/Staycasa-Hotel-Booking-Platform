import React, { useState, ChangeEvent } from 'react';
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
  CalendarCheck2
} from 'lucide-react';
import { format } from 'date-fns';

// --- TYPE DEFINITIONS ---
type HotelSnapshot = {
  id: string;
  name: string;
  city: string;
  thumbnail: string;
};

type Accommodation = {
  id: string;
  user_id: string;
  hotel_id: string;
  last_visited_at: string; // ISO Date string
  has_reviewed: boolean;
  review_id: string | null;
};

type Review = {
  id: string;
  hotel_id: string;
  user_id: string;
  rating: number;
  title: string;
  comment: string;
};

// --- MOCK DATA ---
// We need a map of hotels for easy lookup
const mockHotelsMap: Record<string, HotelSnapshot> = {
  "h-1": {
    id: "h-1",
    name: "Seaside Panorama Hotel",
    city: "Pondicherry",
    thumbnail: "https://placehold.co/400x300/3498db/ffffff?text=Hotel+View"
  },
  "h-2": {
    id: "h-2",
    name: "Mountain Retreat",
    city: "Manali",
    thumbnail: "https://placehold.co/400x300/2ecc71/ffffff?text=Mountain+View"
  },
  "h-3": {
    id: "h-3",
    name: "City Center Inn",
    city: "Bangalore",
    thumbnail: "https://placehold.co/400x300/e74c3c/ffffff?text=City+Hotel"
  }
};

// Mock data for accommodations (derived from past bookings)
export const mockAccommodations: Accommodation[] = [
  {
    id: "acc-1",
    user_id: "u-1",
    hotel_id: "h-3",
    last_visited_at: "2025-09-03T11:00:00Z",
    has_reviewed: true,
    review_id: "r-1",
  },
  {
    id: "acc-2",
    user_id: "u-1",
    hotel_id: "h-1",
    last_visited_at: "2025-08-15T11:00:00Z",
    has_reviewed: false,
    review_id: null,
  },
  {
    id: "acc-3",
    user_id: "u-1",
    hotel_id: "h-2",
    last_visited_at: "2025-07-01T11:00:00Z",
    has_reviewed: true,
    review_id: "r-2",
  },
];

// Mock data for existing reviews
const mockReviews: Record<string, Review> = {
  "r-1": {
    id: "r-1",
    hotel_id: "h-3",
    user_id: "u-1",
    rating: 4,
    title: "Great location",
    comment: "Very convenient for business trips. Clean rooms and good service."
  },
  "r-2": {
    id: "r-2",
    hotel_id: "h-2",
    user_id: "u-1",
    rating: 5,
    title: "Breathtaking views!",
    comment: "The Mountain Retreat was absolutely stunning. Woke up to the Himalayas. Unforgettable."
  }
};


// --- CHILD COMPONENT: Header ---
const Header = () => (
  <header className="sticky top-0 z-30 bg-white shadow-sm p-4 border-b border-gray-200">
    <div className="container mx-auto max-w-7xl flex justify-between items-center">
      <a href="#" className="text-2xl font-bold text-blue-600">ProBooker</a>
      <div className="flex items-center gap-4">
        <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Browse</a>
        <a href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">My Bookings</a>
      </div>
    </div>
  </header>
);

// --- CHILD COMPONENT: StarRatingInput ---
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

// --- CHILD COMPONENT: ReviewModal ---
type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  hotel: HotelSnapshot;
  existingReview: Review | null;
  onSubmit: (review: Omit<Review, 'id' | 'user_id'>) => void;
};

const ReviewModal = ({ isOpen, onClose, hotel, existingReview, onSubmit }: ReviewModalProps) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }
    onSubmit({
      hotel_id: hotel.id,
      rating,
      title,
      comment,
    });
  };

  if (!isOpen) return null;

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

            {/* Mock Photo Uploader */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Photos</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500">
                <Camera size={32} className="mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">Click to upload (mock)</p>
              </div>
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

// --- CHILD COMPONENT: AccommodationCard ---
type AccommodationCardProps = {
  accommodation: Accommodation;
  onWriteReview: (hotel: HotelSnapshot, review: Review | null) => void;
};

const AccommodationCard = ({ accommodation, onWriteReview }: AccommodationCardProps) => {
  const hotel = mockHotelsMap[accommodation.hotel_id];
  const existingReview = accommodation.review_id ? mockReviews[accommodation.review_id] : null;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col md:flex-row">
      <img src={hotel.thumbnail} alt={hotel.name} className="w-full md:w-48 h-40 md:h-full object-cover" />
      <div className="p-5 flex-1 flex flex-col md:flex-row justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{hotel.name}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
            <MapPin size={14} />
            {hotel.city}
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
          onClick={() => onWriteReview(hotel, existingReview)}
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


// --- PAGE COMPONENT: MyAccommodationsPage ---
/**
 * Shows hotels the user has visited (i.e., confirmed bookings ended) and whether they left reviews
 */
export const MyAccommodationsPage = () => {
  type Tab = 'all' | 'reviewed' | 'not_reviewed';
  const [activeTab, setActiveTab] = useState<Tab>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelSnapshot | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  
  // State for accommodations, to simulate review submission
  const [accommodations, setAccommodations] = useState(mockAccommodations);

  const handleOpenReviewModal = (hotel: HotelSnapshot, review: Review | null) => {
    setSelectedHotel(hotel);
    setSelectedReview(review);
    setIsModalOpen(true);
  };
  
  const handleCloseReviewModal = () => {
    setIsModalOpen(false);
    setSelectedHotel(null);
    setSelectedReview(null);
  };
  
  const handleSubmitReview = (review: Omit<Review, 'id' | 'user_id'>) => {
    console.log("Submitting review:", review);
    // --- MOCK API CALL ---
    // In a real app, you would save this to the 'reviews' table
    // and update the 'accommodations' table.

    // Simulate update
    setAccommodations(prev => 
      prev.map(acc => 
        acc.hotel_id === review.hotel_id 
          ? { ...acc, has_reviewed: true, review_id: 'new-r-id' } 
          : acc
      )
    );
    // Add to mock reviews (for "Edit" logic)
    mockReviews['new-r-id'] = { ...review, id: 'new-r-id', user_id: 'u-1' };
    
    handleCloseReviewModal();
    alert("Review submitted successfully! (Mock)");
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

        {filteredAccommodations.length === 0 ? (
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

      {selectedHotel && (
        <ReviewModal
          isOpen={isModalOpen}
          onClose={handleCloseReviewModal}
          hotel={selectedHotel}
          existingReview={selectedReview}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  return <MyAccommodationsPage />;
}
