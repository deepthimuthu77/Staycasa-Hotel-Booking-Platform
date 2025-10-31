import React, { useState } from 'react';
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
  Share2
} from 'lucide-react';
// Import the DayPicker styles needed by the reusable component
import 'react-day-picker/dist/style.css';
import { format, differenceInCalendarDays } from 'date-fns';

// Import the reusable DateRangePicker component
import { DateRangePicker } from '../components/DateRangePicker';
// Import the reusable formatCurrency helper
import { formatCurrency } from '../data/data';

// --- STYLES for React-Day-Picker (REMOVED) ---
// No longer needed, as we import 'react-day-picker/dist/style.css'

// --- TYPE DEFINITIONS ---
export type Hotel = {
  id: string;
  name: string;
  slug: string;
  address: { street: string; city: string; country: string; zip: string; lat: number; lng: number };
  stars: number;
  rating: number;
  description: string;
  amenities: string[];
  policies: { checkIn: string; checkOut: string; cancellation: string; };
  gallery: string[];
  rooms: Room[];
  base_price: number;
  currency: string;
};

export type Room = {
  id: string;
  name: string;
  description: string;
  capacity: number;
  bed_type: string;
  base_price_modifier: number; // e.g., 1.2 for 20% more than hotel base
  amenities: string[];
  photos: string[];
};

export type Review = {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  rating: number;
  title: string;
  comment: string;
  photos: string[];
  created_at: string;
};

// DateRange type is imported by the reusable component, but we
// can keep it here for local state typing.
export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export type GuestCount = {
  adults: number;
  children: number;
};

// --- HELPER FUNCTIONS (REMOVED) ---
// formatCurrency is now imported from ../data/data

// --- MOCK DATA ---
// TODO: This data should also be moved to src/data/data.tsx
export const mockHotelDetail: Hotel = {
  id: "h-1",
  name: "Seaside Panorama Hotel",
  slug: "seaside-panorama-hotel",
  address: { street: "12 Beach Road", city: "Pondicherry", country: "India", zip: "605001", lat: 11.926, lng: 79.8083 },
  stars: 5,
  rating: 4.8,
  description: "Experience breathtaking ocean views and unparalleled comfort in our 5-star resort. Located on the main promenade, the Seaside Panorama Hotel offers luxury rooms, a rooftop infinity pool, and world-class dining. Perfect for both leisure and business travelers seeking an unforgettable stay.",
  amenities: ["wifi", "pool", "ac", "breakfast", "gym", "parking", "spa", "room_service"],
  policies: {
    checkIn: "14:00",
    checkOut: "11:00",
    cancellation: "Free cancellation up to 48 hours before check-in. 50% charge if cancelled within 48 hours. No refund for no-shows."
  },
  gallery: [
    "https://placehold.co/800x600/3498db/ffffff?text=Main+View",
    "https://placehold.co/400x300/2ecc71/ffffff?text=Poolside",
    "https://placehold.co/400x300/e74c3c/ffffff?text=Lobby",
    "https://placehold.co/400x300/f39c12/ffffff?text=Deluxe+Room",
    "https://placehold.co/400x300/9b59b6/ffffff?text=Restaurant",
  ],
  rooms: [
    { id: "r-1", name: "Deluxe Ocean View", description: "King bed with balcony.", capacity: 2, bed_type: "King", base_price_modifier: 1.0, amenities: ["minibar", "balcony"], photos: [] },
    { id: "r-2", name: "Executive Suite", description: "King bed, separate living area.", capacity: 3, bed_type: "King", base_price_modifier: 1.5, amenities: ["minibar", "balcony", "living_room"], photos: [] },
    { id: "r-3", name: "Family Room", description: "Two queen beds.", capacity: 4, bed_type: "Queen", base_price_modifier: 1.3, amenities: ["minibar"], photos: [] },
  ],
  base_price: 7999,
  currency: "INR",
};

export const mockReviews: Review[] = [
  {
    id: "rev-1",
    user_id: "u-1",
    user_name: "Anita Desai",
    user_avatar: "https://placehold.co/40x40/9CA3AF/FFFFFF?text=AD",
    rating: 5,
    title: "Absolutely stunning!",
    comment: "The view was incredible, and the service was top-notch. The infinity pool is a must-see. We will definitely be back.",
    photos: ["https://placehold.co/100x100/3498db/ffffff?text=View"],
    created_at: "2025-10-15T09:30:00Z"
  },
  {
    id: "rev-2",
    user_id: "u-2",
    user_name: "Rohan Gupta",
    user_avatar: "https://placehold.co/40x40/2ECC71/FFFFFF?text=RG",
    rating: 4,
    title: "Great location, good food",
    comment: "Very convenient location on Beach Road. The breakfast spread was fantastic. Room was clean, but a bit smaller than expected.",
    photos: [],
    created_at: "2025-10-12T14:45:00Z"
  }
];

// --- CHILD COMPONENT: Header ---
const Header = () => (
  <header className="sticky top-0 z-30 bg-white shadow-sm p-4 border-b border-gray-200">
    <div className="container mx-auto max-w-7xl flex justify-between items-center">
      <a href="#" className="text-2xl font-bold text-blue-600">ProBooker</a>
      <a href="#" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600">
        <ChevronLeft size={16} />
        Back to search
      </a>
    </div>
  </header>
);

// --- CHILD COMPONENT: DateRangePicker (REMOVED) ---
// We now import this from ../components/DateRangePicker

// --- CHILD COMPONENT: GuestSelector ---
type GuestSelectorProps = { count: GuestCount; onChange: (count: GuestCount) => void; };
export const GuestSelector = ({ count, onChange }: GuestSelectorProps) => {
  const updateCount = (type: 'adults' | 'children', delta: number) => {
    const newCount = { ...count, [type]: Math.max(type === 'adults' ? 1 : 0, count[type] + delta) };
    onChange(newCount);
  };
  return (
    <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-sm">
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

// --- CHILD COMPONENT: ReviewForm ---
const ReviewForm = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
      <h4 className="font-semibold text-lg text-gray-800 mb-2">Leave a Review</h4>
      <p className="text-sm text-gray-600 mb-3">You must have a confirmed stay to leave a review.</p>
      <div className="flex items-center mb-3">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            className="text-gray-300 hover:text-yellow-500"
          >
            <Star size={24} fill={(hoverRating || rating) >= star ? '#f59e0b' : 'currentColor'} className={(hoverRating || rating) >= star ? 'text-yellow-500' : 'text-gray-300'} />
          </button>
        ))}
      </div>
      <textarea
        className="w-full p-2 border border-gray-300 rounded-lg"
        rows={3}
        placeholder="Share your thoughts..."
      ></textarea>
      <button className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-2">
        Submit Review
      </button>
    </div>
  );
};

// --- CHILD COMPONENT: AmenityIcon ---
const AmenityIcon = ({ amenity }: { amenity: string }) => {
  const iconProps = { size: 20, className: "text-gray-700" };
  switch (amenity) {
    case 'wifi': return <div className="flex items-center gap-3"><Wifi {...iconProps} /><span>Free WiFi</span></div>;
    case 'pool': return <div className="flex items-center gap-3"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10zm0 0v5m0 5a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 0v5"/></svg><span>Pool</span></div>;
    case 'ac': return <div className="flex items-center gap-3"><Wind {...iconProps} /><span>Air Conditioning</span></div>;
    case 'breakfast': return <div className="flex items-center gap-3"><Utensils {...iconProps} /><span>Breakfast</span></div>;
    case 'gym': return <div className="flex items-center gap-3"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10.1A1 1 0 0 1 3 9h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zm16 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zM8 5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z"/></svg><span>Gym</span></div>;
    case 'parking': return <div className="flex items-center gap-3"><ParkingCircle {...iconProps} /><span>Parking</span></div>;
    case 'spa': return <div className="flex items-center gap-3"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2Z"/><path d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z"/><path d="M12 12h.01"/></svg><span>Spa</span></div>;
    case 'room_service': return <div className="flex items-center gap-3"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"/><path d="M7 8h10M7 12h10M7 16h10"/></svg><span>Room Service</span></div>;
    default: return null;
  }
};

// --- PAGE COMPONENT: HotelDetailPage ---
/**
 * Details of one specific hotel.
 */
export const HotelDetailPage = () => {
  const [hotel] = useState<Hotel>(mockHotelDetail);
  const [dates, setDates] = useState<DateRange>({ from: undefined, to: undefined });
  const [guests, setGuests] = useState<GuestCount>({ adults: 2, children: 0 });
  const [selectedRoom, setSelectedRoom] = useState<Room>(hotel.rooms[0]);

  const nights = (dates.from && dates.to) ? differenceInCalendarDays(dates.to, dates.from) : 0;
  const basePrice = hotel.base_price * selectedRoom.base_price_modifier;
  const subtotal = basePrice * nights;
  const taxes = subtotal * 0.18; // 18% tax
  const fees = 500; // Flat service fee
  const total = subtotal + taxes + fees;

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />

      <main className="container mx-auto max-w-7xl p-4 mt-6">
        {/* --- Hero Gallery --- */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[500px] rounded-xl overflow-hidden shadow-lg">
          <img src={hotel.gallery[0]} alt="Main" className="col-span-2 row-span-2 w-full h-full object-cover" />
          <img src={hotel.gallery[1]} alt="Sub 1" className="w-full h-full object-cover" />
          <img src={hotel.gallery[2]} alt="Sub 2" className="w-full h-full object-cover" />
          <img src={hotel.gallery[3]} alt="Sub 3" className="w-full h-full object-cover" />
          <img src={hotel.gallery[4]} alt="Sub 4" className="w-full h-full object-cover" />
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
                    {hotel.address.street}, {hotel.address.city}, {hotel.address.zip}
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
                  <span className="font-bold">{hotel.rating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-gray-600">({mockReviews.length} reviews)</span>
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
                {hotel.amenities.map(amenity => (
                  <AmenityIcon key={amenity} amenity={amenity} />
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Reviews</h3>
              {mockReviews.map(review => (
                <div key={review.id} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:mb-0">
                  <div className="flex items-center mb-2">
                    <img src={review.user_avatar} alt={review.user_name} className="w-10 h-10 rounded-full" />
                    <div className="ml-3">
                      <p className="font-semibold text-gray-800">{review.user_name}</p>
                      <p className="text-xs text-gray-500">{format(new Date(review.created_at), 'dd MMM yyyy')}</p>
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
                    value={selectedRoom.id}
                    onChange={(e) => setSelectedRoom(hotel.rooms.find(r => r.id === e.target.value) || hotel.rooms[0])}
                    className="w-full p-3 mt-1 border border-gray-300 rounded-lg shadow-sm"
                  >
                    {hotel.rooms.map(room => (
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
                        <span className="text-gray-600">{formatCurrency(basePrice, hotel.currency)} x {nights} night(s)</span>
                        <span className="text-gray-800">{formatCurrency(subtotal, hotel.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taxes (18%)</span>
                        <span className="text-gray-800">{formatCurrency(taxes, hotel.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Fee</span>
                        <span className="text-gray-800">{formatCurrency(fees, hotel.currency)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-blue-600">{formatCurrency(total, hotel.currency)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 pt-4">Select dates to see price</p>
                )}

                <button 
                  disabled={nights <= 0}
                  className="w-full bg-blue-600 text-white p-3.5 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  onClick={() => console.log("Proceeding to book:", { hotel: hotel.id, room: selectedRoom.id, dates, guests, total })}
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
  return <HotelDetailPage />;
}