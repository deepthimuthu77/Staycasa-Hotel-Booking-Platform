// src/pages/HotelDetailPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Wifi, 
  Utensils, 
  Wind,
  ParkingCircle,
  Check,
  ChevronLeft,
  Calendar,
  Users,
  Moon,
  Plus,
  Minus,
  X,
  MessageSquare,
  Share2,
  Loader2, // For loading
  BarChart3, // For review histogram
  AlertCircle, // For availability status
  CheckCircle, // For availability status
} from 'lucide-react';

// (NEW) React Hook Form Imports
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { reviewSchema } from '../lib/schemas.ts'; // (NEW) Import Zod schema

// (NEW) Import Auth Hook
import { useAuth } from '../App.tsx';

// --- (NEW) Import Leaflet CSS for the map ---
import 'leaflet/dist/leaflet.css';
// --- (NEW) Import Map components ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

// Import the DayPicker styles
import 'react-day-picker/dist/style.css';
import { format, differenceInCalendarDays } from 'date-fns';

// Import the reusable DateRangePicker component
import { DateRangePicker } from '../components/DateRangePicker';
import { HotelCard } from '../components/HotelCard'; 

// Import your Supabase client
import { supabase } from '../lib/supabaseClient';

// --- (NEW) Import the dynamic pricing engine ---
import { calculatePrice } from '../lib/pricingEngine';

// Import types, data, and helpers from the central data file
import { 
  formatCurrency, 
} from '../data/data';
import type { 
  Hotel, 
  Room,
  Review, 
  DateRange, 
  GuestCount,
  PriceBreakdown 
} from '../data/data';

// (NEW) Define the form data type from the Zod schema
type ReviewFormData = z.infer<typeof reviewSchema>;


// --- CHILD COMPONENT: Header (No change) ---
const Header = () => (
  <header className="sticky top-0 z-30 bg-white shadow-sm p-4 border-b border-gray-200">
    <div className="container mx-auto max-w-7xl flex justify-between items-center">
      <a href="/" className="text-2xl font-bold text-blue-600">ProBooker</a>
      <a href="/" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600">
        <ChevronLeft size={16} />
        Back to search
      </a>
    </div>
  </header>
);

// --- CHILD COMPONENT: GuestSelector (No change) ---
type GuestSelectorProps = { count: GuestCount; onChange: (count: GuestCount) => void; };
export const GuestSelector = ({ count, onChange }: GuestSelectorProps) => {
  const updateCount = (type: 'adults' | 'children', delta: number) => {
    const newCount = { ...count, [type]: Math.max(type === 'adults' ? 1 : 0, count[type] + delta) };
    onChange(newCount);
  };
  return (
    <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-sm">
      {/* ... (rest of GuestSelector JSX is unchanged) ... */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Adults</p>
          <p className="text-xs text-gray-500">Ages 13+</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => updateCount('adults', -1)} className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50" disabled={count.adults <= 1}>-</button>
          <span className="w-8 text-center font-medium">{count.adults}</span>
          <button onClick={() => updateCount('adults', 1)} className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100">+</button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        <div>
          <p className="text-sm font-semibold">Children</p>
          <p className="text-xs text-gray-500">Ages 0-12</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => updateCount('children', -1)} className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50" disabled={count.children <= 0}>-</button>
          <span className="w-8 text-center font-medium">{count.children}</span>
          <button onClick={() => updateCount('children', 1)} className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100">+</button>
        </div>
      </div>
    </div>
  );
};


// --- CHILD COMPONENT: AmenityIcon (No change) ---
const AmenityIcon: React.FC<{ amenity: string }> = ({ amenity }) => {
  const iconSize = 18;
  const map: Record<string, React.ComponentType<any>> = {
    wifi: Wifi,
    'free wifi': Wifi,
    restaurant: Utensils,
    'restaurant on-site': Utensils,
    'air conditioning': Wind,
    ac: Wind,
    parking: ParkingCircle,
    'free parking': ParkingCircle,
    breakfast: Check,
    'breakfast included': Check,
    pool: Check,
    'room service': Utensils,
    'pet friendly': Check,
    default: Check,
  };
  const key = (amenity || '').toLowerCase();
  const Matched = Object.entries(map).find(([k]) => k !== 'default' && key.includes(k))?.[1] ?? map.default;
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-gray-50 border border-gray-100">
      <Matched size={iconSize} className="text-gray-600" />
      <span className="text-sm text-gray-700">{amenity}</span>
    </div>
  );
};

// --- (NEW) Default Price Breakdown ---
const defaultPriceBreakdown: PriceBreakdown = {
  nights: 0,
  base_price_per_night: 0,
  subtotal: 0,
  seasonal_mod: 0,
  taxes: 0,
  service_fee: 0,
  total: 0,
  currency: 'INR',
};

// --- (NEW) CHILD COMPONENT: ReviewSummary ---
/**
 * Displays an aggregate rating and histogram for reviews.
 */
type ReviewSummaryProps = { reviews: Review[] };
const ReviewSummary = ({ reviews }: ReviewSummaryProps) => {
  // Calculate average rating and rating distribution
  const { averageRating, ratingCounts } = useMemo(() => {
    if (reviews.length === 0) {
      return { averageRating: 'N/A', ratingCounts: [] };
    }

    const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = (totalRating / reviews.length).toFixed(1);

    const counts = [5, 4, 3, 2, 1].map(star => {
      const count = reviews.filter(r => r.rating === star).length;
      const percentage = (count / reviews.length) * 100;
      return { star, count, percentage };
    });

    return { averageRating: avg, ratingCounts: counts };
  }, [reviews]);

  if (reviews.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Reviews</h3>
        <p className="text-gray-500">No reviews for this hotel yet.</p>
        {/* The ReviewForm is now rendered outside this component */}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Guest Reviews</h3>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex flex-col items-center justify-center bg-blue-600 text-white w-full sm:w-28 h-28 rounded-lg shadow-lg flex-shrink-0">
          <span className="text-5xl font-bold">{averageRating}</span>
          <span className="text-sm font-medium">({reviews.length} reviews)</span>
        </div>
        <div className="flex-1 w-full space-y-2">
          {ratingCounts.map(item => (
            <div key={item.star} className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 w-12">{item.star} star</span>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${item.percentage}%` }}></div>
              </div>
              <span className="text-sm text-gray-500 w-10 text-right">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// --- (NEW) CHILD COMPONENT: StarRatingInput ---
// (Copied from MyAccomodationsPage)
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
          star <= rating
            ? 'text-yellow-400'
            : 'text-gray-300 hover:text-yellow-300'
        }`}
      >
        <Star size={28} fill="currentColor" />
      </button>
    ))}
  </div>
);

// --- (NEW) CHILD COMPONENT: ReviewForm ---
/**
 * A fully functional review form using React Hook Form.
 */
type ReviewFormProps = {
  hotelId: string;
  onReviewSubmit: (newReview: Review) => void;
};
const ReviewForm = ({ hotelId, onReviewSubmit }: ReviewFormProps) => {
  const auth = useAuth();
  
  // (NEW) Setup React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      title: '',
      comment: '',
    },
  });

  const handleFormSubmit = async (data: ReviewFormData) => {
    if (!auth.session?.user) {
      alert("You must be logged in to submit a review.");
      return;
    }
    
    try {
      const newReviewData = {
        hotel_id: hotelId,
        user_id: auth.session.user.id,
        // (NEW) Add user details from session/profile (if available)
        user_name: auth.session.user.user_metadata?.full_name || 'Anonymous',
        user_avatar: auth.session.user.user_metadata?.avatar_url || null,
        ...data,
      };

      // 1. Insert into Supabase
      const { data: insertedReview, error } = await supabase
        .from('reviews')
        .insert(newReviewData)
        .select()
        .single();
      
      if (error) throw error;
      
      // 2. Pass the new review up to the parent to update the UI
      onReviewSubmit(insertedReview as Review);
      
      // 3. Reset the form
      reset();

    } catch (error: any) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review: " + error.message);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-6">
      <h4 className="text-lg font-semibold text-gray-800 mb-3">Leave a Review</h4>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Rating*
          </label>
          {/* (NEW) Controller for the custom StarRatingInput */}
          <Controller
            name="rating"
            control={control}
            render={({ field }) => (
              <StarRatingInput
                rating={field.value}
                setRating={(value) => field.onChange(value)}
              />
            )}
          />
          {errors.rating && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.rating.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Review Title
          </label>
          <input
            type="text"
            id="title"
            placeholder="e.g., 'A wonderful stay'"
            className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
              errors.title
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            {...register('title')}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.title.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your Review
          </label>
          <textarea
            id="comment"
            rows={5}
            placeholder="Share your experience..."
            className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
              errors.comment
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            {...register('comment')}
          />
          {errors.comment && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={14} /> {errors.comment.message}
            </p>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};


// --- PAGE COMPONENT: HotelDetailPage (UPDATED) ---
export const HotelDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate(); 
  const auth = useAuth(); // (NEW) Get auth state

  // State for live data
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarHotels, setSimilarHotels] = useState<Hotel[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  // (NEW) State to track if the current user has already reviewed
  const [userReview, setUserReview] = useState<Review | null>(null);
  
  // State for booking panel
  const [dates, setDates] = useState<DateRange>({ from: undefined, to: undefined });
  const [guests, setGuests] = useState<GuestCount>({ adults: 2, children: 0 });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // State for availability check
  type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('idle');
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown>(defaultPriceBreakdown);

  // Data fetching logic
  useEffect(() => {
    const fetchHotelData = async () => {
      if (!slug) return;

      setIsLoading(true);
      setHotel(null);
      setReviews([]);
      setSimilarHotels([]);
      setAvailabilityStatus('idle'); 
      
      // 1. Fetch hotel details and its rooms
      const { data: hotelData, error: hotelError } = await supabase
        .from('hotels')
        .select(`
          *,
          rooms (*)
        `)
        .eq('slug', slug)
        .single();

      if (hotelError || !hotelData) {
        console.error("Error fetching hotel:", hotelError);
        setIsLoading(false);
        return;
      }

      setHotel(hotelData as Hotel);
      if (hotelData.rooms && hotelData.rooms.length > 0) {
        setSelectedRoom(hotelData.rooms[0]);
      }

      // 2. Fetch reviews for that hotel
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .eq('hotel_id', hotelData.id)
        .order('created_at', { ascending: false }); // (NEW) Order by newest

      if (!reviewError) {
        setReviews(reviewData as Review[]);
      }

      // 3. Fetch similar hotels (same city, not this one)
      if (hotelData.address?.city) {
        const { data: similarData } = await supabase
          .from('hotels')
          .select('*')
          .eq('address->>city', hotelData.address.city) 
          .neq('id', hotelData.id)
          .limit(3); 
        
        if (similarData) {
          setSimilarHotels(similarData as Hotel[]);
        }
      }

      setIsLoading(false);
    };

    fetchHotelData();
  }, [slug]); 

  // (NEW) Check for existing user review whenever reviews or auth state change
  useEffect(() => {
    const userId = auth.session?.user?.id;
    if (userId) {
      const foundReview = reviews.find(r => r.user_id === userId);
      setUserReview(foundReview || null);
    } else {
      setUserReview(null);
    }
  }, [reviews, auth.session]);

  
  // Dynamic Price Calculation Logic
  useEffect(() => {
    if (dates.from && dates.to && hotel && selectedRoom) {
      const roomModifier = selectedRoom.base_price_modifier || 1;
      const effectiveBasePrice = hotel.base_price * roomModifier;

      const breakdown = calculatePrice(
        effectiveBasePrice,
        dates.from,
        dates.to,
        hotel.currency
      );
      setPriceBreakdown(breakdown);
    } else {
      setPriceBreakdown({
        ...defaultPriceBreakdown,
        base_price_per_night: (hotel?.base_price || 0) * (selectedRoom?.base_price_modifier || 1),
        currency: hotel?.currency || 'INR',
      });
    }
  }, [dates, hotel, selectedRoom]);

  // REAL Availability Check Logic
  useEffect(() => {
    if (!dates.from || !dates.to || !selectedRoom || !hotel) {
      setAvailabilityStatus('idle');
      return;
    }

    const totalGuests = guests.adults + guests.children;
    if (totalGuests > selectedRoom.capacity) {
      setAvailabilityStatus('unavailable');
      setAvailabilityError(`This room only supports ${selectedRoom.capacity} guest(s).`);
      return;
    }

    const checkAvailability = async () => {
      setAvailabilityStatus('checking');
      setAvailabilityError(null);

      const { data, error } = await supabase.rpc('check_room_availability', {
        p_room_id: selectedRoom.id,
        p_check_in: dates.from!.toISOString().split('T')[0], 
        p_check_out: dates.to!.toISOString().split('T')[0],
      });

      if (error) {
        console.error("Availability check error:", error);
        setAvailabilityStatus('error');
        setAvailabilityError('Could not check availability.');
      } else if (data === true) {
        setAvailabilityStatus('available');
      } else if (data === false) {
        setAvailabilityStatus('unavailable');
        setAvailabilityError('This room is not available for the selected dates.');
      }
    };
    
    const timer = setTimeout(() => {
      checkAvailability();
    }, 500);

    return () => clearTimeout(timer);

  }, [dates, selectedRoom, guests, hotel]);


  // Handle Book Now Click
  const handleBookNow = () => {
    if (!hotel || !selectedRoom || !dates.from || !dates.to || priceBreakdown.nights <= 0) {
      alert("Please select dates and a room.");
      return;
    }
    
    if (availabilityStatus !== 'available') {
      alert(availabilityError || "This room is not available.");
      return;
    }

    navigate('/booking/preview', {
      state: {
        hotel: { 
          id: hotel.id,
          name: hotel.name,
          address: `${hotel.address.street}, ${hotel.address.city}`,
          city: hotel.address.city,
          thumbnail: hotel.thumbnail,
        },
        room: {
          name: selectedRoom.name,
        },
        check_in: dates.from.toISOString(),
        check_out: dates.to.toISOString(),
        guests: guests,
        price_breakdown: priceBreakdown, 
      },
    });
  };

  // (NEW) Callback to optimistically update UI
  const handleReviewSubmit = (newReview: Review) => {
    // Add new review to the top of the list
    setReviews(prevReviews => [newReview, ...prevReviews]);
    // Set userReview state so the form is replaced with "Already reviewed" message
    setUserReview(newReview); 
  };
  
  // --- Loading and Error States ---
  if (isLoading) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <Header />
        <div className="flex justify-center items-center h-96">
          <Loader2 size={48} className="animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <Header />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold">Hotel not found</h1>
          <p className="text-gray-600">The hotel you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }
  
  // --- Render page with fetched data ---
  const { nights, subtotal, taxes, service_fee, total, base_price_per_night } = priceBreakdown;

  // Helper component for availability status
  const AvailabilityStatusMessage = () => {
    if (availabilityStatus === 'checking') {
      return (
        <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
          <Loader2 size={16} className="animate-spin" />
          Checking availability...
        </div>
      );
    }
    if (availabilityStatus === 'available') {
      return (
        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
          <CheckCircle size={16} />
          This room is available!
        </div>
      );
    }
    if (availabilityStatus === 'unavailable') {
      return (
        <div className="flex items-center justify-center gap-2 text-sm text-red-600 text-center">
          <AlertCircle size={16} />
          {availabilityError || 'Unavailable for selected dates.'}
        </div>
      );
    }
    if (availabilityStatus === 'error') {
       return (
        <div className="flex items-center justify-center gap-2 text-sm text-red-600 text-center">
          <AlertCircle size={16} />
          {availabilityError || 'Error checking availability.'}
        </div>
      );
    }
    return <p className="text-center text-gray-500">Select dates to check price & availability</p>;
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />

      <main className="container mx-auto max-w-7xl p-4 mt-6">
        {/* --- Hero Gallery --- */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[500px] rounded-xl overflow-hidden shadow-lg">
          <img src={hotel.gallery?.[0] || 'https://placehold.co/800x600'} alt="Main" className="col-span-2 row-span-2 w-full h-full object-cover" />
          <img src={hotel.gallery?.[1] || 'https://placehold.co/400x300'} alt="Sub 1" className="w-full h-full object-cover" />
          <img src={hotel.gallery?.[2] || 'https://placehold.co/400x300'} alt="Sub 2" className="w-full h-full object-cover" />
          <img src={hotel.gallery?.[3] || 'https://placehold.co/400x300'} alt="Sub 3" className="w-full h-full object-cover" />
          <img src={hotel.gallery?.[4] || 'https://placehold.co/400x300'} alt="Sub 4" className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          {/* --- Left Column (Details) --- */}
          <div className="w-full lg:w-[60%]">
            {/* Hotel Summary */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              {/* ... (Hotel Summary JSX unchanged) ... */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
                  <p className="text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin size={16} />
                    {hotel.address?.street}, {hotel.address?.city}
                  </p>
                </div>
                <button className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600">
                  <Share2 size={16} />
                  Share
                </button>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center text-yellow-500">
                  {Array.from({ length: hotel.stars }).map((_, i) => (
                    <Star size={18} fill="currentColor" key={i} />
                  ))}
                </div>
                <div className="flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded-md">
                  <Star size={14} fill="white" />
                  <span className="font-bold">{hotel.popularity_score?.toFixed(1) || 'N/A'}</span>
                </div>
                <span className="text-sm text-gray-600">({reviews.length} reviews)</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">About this hotel</h3>
              <p className="text-gray-700 leading-relaxed">{hotel.description}</p>
            </div>

            {/* Amenities */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-800">
                {hotel.amenities?.map(amenity => (
                  <AmenityIcon key={amenity} amenity={amenity} />
                ))}
              </div>
            </div>

            {/* Map */}
            {hotel.address?.lat && hotel.address?.lng && (
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Location</h3>
                <div className="h-80 rounded-lg overflow-hidden z-0">
                  <MapContainer 
                    center={[hotel.address.lat, hotel.address.lng]} 
                    zoom={15} 
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[hotel.address.lat, hotel.address.lng]}>
                      <Popup>{hotel.name}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}

            {/* --- (NEW) Reviews Section with Summary --- */}
            <ReviewSummary reviews={reviews} />
            
            {/* Individual Reviews (if any exist) */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">What guests are saying</h3>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center mb-2">
                        <img src={review.user_avatar || 'https://placehold.co/40x40'} alt={review.user_name} className="w-10 h-10 rounded-full" />
                        <div className="ml-3">
                          <p className="font-semibold text-gray-800">{review.user_name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-500">{format(new Date(review.created_at!), 'dd MMM yyyy')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500 mb-1">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star size={16} fill="currentColor" key={i} />
                        ))}
                      </div>
                      <h5 className="font-semibold text-gray-800">{review.title}</h5>
                      <p className="text-gray-600 text-sm mt-1">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Be the first to review this hotel!</p>
              )}

              {/* --- (NEW) Auth-Aware Review Form Logic --- */}
              <div className="mt-6">
                {!auth.isAuthenticated && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg border">
                    <p className="font-medium text-gray-700">Want to share your experience?</p>
                    <p className="text-sm text-gray-500 mb-3">Please log in to leave a review.</p>
                    <button 
                      onClick={() => navigate('/login')}
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Log In
                    </button>
                  </div>
                )}
                {auth.isAuthenticated && userReview && (
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-medium text-green-700 flex items-center justify-center gap-2">
                      <CheckCircle size={18} /> You've reviewed this hotel.
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      You can edit your review from the "My Stays" page.
                    </p>
                  </div>
                )}
                {auth.isAuthenticated && !userReview && (
                  <ReviewForm hotelId={hotel.id} onReviewSubmit={handleReviewSubmit} />
                )}
              </div>

            </div>


            {/* Similar Hotels */}
            {similarHotels.length > 0 && (
              <div className="mt-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Similar Stays in {hotel.address.city}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {similarHotels.map(similarHotel => (
                    <HotelCard 
                      key={similarHotel.id}
                      hotel={similarHotel}
                      onClick={(h) => navigate(`/hotel/${h.slug}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* --- Right Column (Booking Panel) --- */}
          <div className="w-full lg:w-[40%]">
            <div className="sticky top-24 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Book your stay</h2>
              <div className="space-y-4">
                <DateRangePicker range={dates} onRangeChange={setDates} />
                
                <GuestSelector count={guests} onChange={setGuests} />
                
                <div>
                  <label className="text-sm font-semibold text-gray-700">Room Type</label>
                  <select 
                    value={selectedRoom?.id || ''}
                    onChange={(e) => setSelectedRoom(hotel.rooms!.find(r => r.id === e.target.value) || null)}
                    className="w-full p-3 mt-1 border border-gray-300 rounded-lg shadow-sm"
                  >
                    {hotel.rooms!.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.name} (Max {room.capacity} guests)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Preview */}
                <div className="pt-4 border-t border-gray-200">
                  {nights > 0 ? (
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{formatCurrency(base_price_per_night, hotel.currency, 0)} x {nights} night(s)</span>
                        <span className="text-gray-800">{formatCurrency(subtotal, hotel.currency, 0)}</span>
                      </div>
                      {priceBreakdown.seasonal_mod !== 0 && (
                         <div className="flex justify-between">
                          <span className="text-gray-600">Adjustments</span>
                          <span className="text-gray-800">
                            {priceBreakdown.seasonal_mod > 0 ? '+' : ''}
                            {formatCurrency(priceBreakdown.seasonal_mod, hotel.currency, 0)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taxes & fees</span>
                        <span className="text-gray-800">{formatCurrency(taxes + service_fee, hotel.currency, 0)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-blue-600">{formatCurrency(total, hotel.currency, 0)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 pt-2">Select dates to see price</p>
                  )}
                </div>

                {/* (NEW) Availability Status & Book Button */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <div className="h-6 text-center">
                    <AvailabilityStatusMessage />
                  </div>
                  <button 
                    disabled={availabilityStatus !== 'available'}
                    className="w-full bg-blue-600 text-white p-3.5 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={handleBookNow} 
                  >
                    {availabilityStatus === 'checking' ? 'Checking...' : 'Book Now'}
                  </button>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  // This will need to be rendered within a Router context to work
  // due to the use of 'useParams'
  return <HotelDetailPage />;
}