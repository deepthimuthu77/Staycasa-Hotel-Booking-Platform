import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import hooks
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
  Loader2 // For loading
} from 'lucide-react';
// Import the DayPicker styles
import 'react-day-picker/dist/style.css';
import { format, differenceInCalendarDays } from 'date-fns';

// Import the reusable DateRangePicker component
import { DateRangePicker } from '../components/DateRangePicker';

// Import your Supabase client
import { supabase } from '../lib/supabaseClient';

// Import types, data, and helpers from the central data file
import { 
  formatCurrency, 
} from '../data/data';
import type { 
  Hotel, 
  Room, 
  Review, 
  DateRange, 
  GuestCount 
} from '../data/data';


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

// --- CHILD COMPONENT: ReviewForm (No change for now) ---
// (In a real app, this would also be connected to Supabase)
const ReviewForm = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
      {/* ... (rest of ReviewForm JSX is unchanged) ... */}
    </div>
  );
};

// --- CHILD COMPONENT: AmenityIcon (No change) ---
const AmenityIcon: React.FC<{ amenity: string }> = ({ amenity }) => {
  const iconSize = 18;
  // Map common amenity keywords to icons
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

// --- PAGE COMPONENT: HotelDetailPage ---
/**
 * Details of one specific hotel, now fetched from Supabase.
 */
export const HotelDetailPage = () => {
  const { slug } = useParams(); // Get URL parameter
  const navigate = useNavigate();

  // --- NEW: State for live data ---
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- State for booking panel ---
  const [dates, setDates] = useState<DateRange>({ from: undefined, to: undefined });
  const [guests, setGuests] = useState<GuestCount>({ adults: 2, children: 0 });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // --- NEW: Data fetching logic ---
  useEffect(() => {
    const fetchHotelData = async () => {
      if (!slug) return; // Exit if no slug

      setIsLoading(true);
      
      // 1. Fetch hotel details and its rooms
      //    We join 'rooms' table
      const { data: hotelData, error: hotelError } = await supabase
        .from('hotels')
        .select(`
          *,
          rooms (*)
        `)
        .eq('slug', slug)
        .single(); // Get one hotel

      if (hotelError || !hotelData) {
        console.error("Error fetching hotel:", hotelError);
        setIsLoading(false);
        // navigate('/404'); // Optional: redirect to a 404 page
        return;
      }

      setHotel(hotelData as Hotel);
      // Set the default selected room
      if (hotelData.rooms && hotelData.rooms.length > 0) {
        setSelectedRoom(hotelData.rooms[0]);
      }

      // 2. Fetch reviews for that hotel
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .eq('hotel_id', hotelData.id);

      if (reviewError) {
        console.error("Error fetching reviews:", reviewError);
      } else {
        setReviews(reviewData as Review[]);
      }

      setIsLoading(false);
    };

    fetchHotelData();
  }, [slug, navigate]); // Re-run if slug changes

  
  // --- Price calculation logic ---
  const nights = (dates.from && dates.to) ? differenceInCalendarDays(dates.to, dates.from) : 0;
  // Use `base_price` from DB, and ensure hotel/room are loaded
  const basePrice = (hotel?.base_price || 0) * (selectedRoom?.base_price_modifier || 1);
  const subtotal = basePrice * nights;
  const taxes = subtotal * 0.18; // 18% tax
  const fees = 500; // Flat service fee
  const total = subtotal + taxes + fees;


  // --- NEW: Loading and Error States ---
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
  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />

      <main className="container mx-auto max-w-7xl p-4 mt-6">
        {/* --- Hero Gallery --- */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[500px] rounded-xl overflow-hidden shadow-lg">
          {/* Use real gallery data, with placeholders if empty */}
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
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
                  <p className="text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin size={16} />
                    {/* Use 'address' JSONB field from DB */}
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
                {/* Use the new 'reviews' state */}
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

            {/* Reviews */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Reviews</h3>
              {/* Use the new 'reviews' state */}
              {reviews.map(review => (
                <div key={review.id} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:mb-0">
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
              <ReviewForm />
            </div>
          </div>

          {/* --- Right Column (Booking Panel) --- */}
          <div className="w-full lg:w-[40%]">
            <div className="sticky top-24 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Book your stay</h2>
              <div className="space-y-4">
                {/* Use the imported component */}
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
                {nights > 0 ? (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Price Breakdown</h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        {/* Use the imported formatCurrency */}
                        <span className="text-gray-600">{formatCurrency(basePrice, hotel.currency, 0)} x {nights} night(s)</span>
                        <span className="text-gray-800">{formatCurrency(subtotal, hotel.currency, 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taxes (18%)</span>
                        <span className="text-gray-800">{formatCurrency(taxes, hotel.currency, 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Fee</span>
                        <span className="text-gray-800">{formatCurrency(fees, hotel.currency, 0)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-blue-600">{formatCurrency(total, hotel.currency, 0)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 pt-4">Select dates to see price</p>
                )}

                <button 
                  disabled={nights <= 0 || !selectedRoom}
                  className="w-full bg-blue-600 text-white p-3.5 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  onClick={() => console.log("Proceeding to book:", { hotel: hotel.id, room: selectedRoom?.id, dates, guests, total })}
                >
                  Book Now
                </button>
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