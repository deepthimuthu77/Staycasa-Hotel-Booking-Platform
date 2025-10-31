import React, { useState } from 'react';
import { 
  Star, 
  MapPin, 
  Wifi, 
  Utensils, 
  Wind,
  ParkingCircle,
  Search,
  SlidersHorizontal,
  DollarSign,
  ChevronDown,
  Calendar,
  X
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
// Note: 'react-day-picker/dist/style.css' is needed for styling.
// We'll add a minimal <style> block to make it work here.
import { format } from 'date-fns';

// --- STYLES for React-Day-Picker ---
// Added to make the component runnable
const dayPickerStyles = `
  .rdp {
    --rdp-cell-size: 40px;
    --rdp-accent-color: #2563eb;
    margin: 1em 0;
  }
  .rdp-day_selected {
    background-color: #2563eb;
    color: white;
  }
  .rdp-day_today {
    font-weight: bold;
    color: #2563eb;
  }
`;

// --- TYPE DEFINITIONS ---
export type Hotel = {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: { street: string; city: string; country: string; lat: number; lng: number };
  description: string;
  stars: number;
  rating: number;
  min_price: number;
  currency: string;
  thumbnail: string;
  amenities: string[];
  is_featured: boolean;
  gallery: string[];
};

export type Filters = {
  priceRange: { min: number; max: number };
  stars: number[];
  rating: number;
  amenities: string[];
};

export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
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
export const mockHotelList: Hotel[] = [
  {
    id: "h-1",
    name: "Seaside Panorama Hotel",
    slug: "seaside-panorama-hotel",
    city: "Pondicherry",
    address: { street: "Beach Road 12", city: "Pondicherry", country: "India", lat: 11.926, lng: 79.8083 },
    description: "Experience breathtaking ocean views and unparalleled comfort.",
    stars: 5,
    rating: 4.8,
    min_price: 7999,
    currency: "INR",
    thumbnail: "https://placehold.co/400x300/3498db/ffffff?text=Seaside+Hotel",
    amenities: ["wifi", "pool", "ac", "breakfast"],
    is_featured: true,
    gallery: []
  },
  {
    id: "h-2",
    name: "Urban Oasis Suites",
    slug: "urban-oasis-suites",
    city: "Bangalore",
    address: { street: "MG Road 45", city: "Bangalore", country: "India", lat: 12.9716, lng: 77.5946 },
    description: "A modern retreat in the heart of the bustling city.",
    stars: 4,
    rating: 4.5,
    min_price: 5499,
    currency: "INR",
    thumbnail: "https://placehold.co/400x300/2ecc71/ffffff?text=Urban+Oasis",
    amenities: ["wifi", "gym", "ac", "parking"],
    is_featured: false,
    gallery: []
  },
  {
    id: "h-3",
    name: "Goa Beachfront Villa",
    slug: "goa-beachfront-villa",
    city: "Goa",
    address: { street: "Baga Beach", city: "Goa", country: "India", lat: 15.557, lng: 73.751 },
    description: "Your private paradise right on the sands of Baga beach.",
    stars: 5,
    rating: 4.9,
    min_price: 12500,
    currency: "INR",
    thumbnail: "https://placehold.co/400x300/e74c3c/ffffff?text=Goa+Villa",
    amenities: ["wifi", "pool", "ac", "breakfast"],
    is_featured: true,
    gallery: []
  },
  {
    id: "h-4",
    name: "The Heritage Inn",
    slug: "the-heritage-inn",
    city: "Jaipur",
    address: { street: "Old City", city: "Jaipur", country: "India", lat: 26.9124, lng: 75.7873 },
    description: "Stay in a beautifully restored haveli with royal charm.",
    stars: 3,
    rating: 4.3,
    min_price: 3200,
    currency: "INR",
    thumbnail: "https://placehold.co/400x300/f39c12/ffffff?text=Heritage+Inn",
    amenities: ["wifi", "ac", "breakfast"],
    is_featured: false,
    gallery: []
  }
];


// --- CHILD COMPONENT: HotelCard ---
type HotelCardProps = { hotel: Hotel; onClick: (hotel: Hotel) => void; };
export const HotelCard = ({ hotel, onClick }: HotelCardProps) => {
  const { name, city, rating, stars, min_price, currency, thumbnail, amenities, is_featured } = hotel;
  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'wifi': return <Wifi size={16} key="wifi" title="Free WiFi" />;
      case 'breakfast': return <Utensils size={16} key="breakfast" title="Breakfast Included" />;
      case 'pool': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10zm0 0v5m0 5a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 0v5"/></svg>; // Placeholder pool icon
      case 'ac': return <Wind size={16} key="ac" title="Air Conditioning" />;
      case 'gym': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10.1A1 1 0 0 1 3 9h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zm16 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zM8 5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z"/></svg>; // Placeholder gym icon
      case 'parking': return <ParkingCircle size={16} key="parking" title="Parking" />;
      default: return null;
    }
  };
  return (
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
      onClick={() => onClick(hotel)}
    >
      <div className="relative">
        <img className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105" src={thumbnail} alt={`Exterior of ${name}`} />
        {is_featured && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md">
            Featured
          </span>
        )}
        <div className="absolute top-3 right-3 bg-blue-600 text-white text-sm font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Star size={14} fill="white" />
          <span>{rating.toFixed(1)}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{name}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <MapPin size={14} />
              {city}
            </p>
          </div>
          <div className="flex items-center text-yellow-500">
            {Array.from({ length: stars }).map((_, i) => (
              <Star size={16} fill="currentColor" key={i} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-gray-600 my-3">
          {amenities.slice(0, 4).map(getAmenityIcon)}
          {amenities.length > 4 && (
            <span className="text-xs font-medium">+{amenities.length - 4} more</span>
          )}
        </div>
        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(min_price, currency)}
            </span>
            <span className="text-sm text-gray-500">/ night</span>
          </div>
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200">
            View
          </button>
        </div>
      </div>
    </div>
  );
};


// --- CHILD COMPONENT: SearchBar ---
type SearchBarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
};
export const SearchBar = ({ query, onQueryChange, onSearch, placeholder = "Search hotels or cities..." }: SearchBarProps) => {
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSearch(query); };
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-24 py-3 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={20} />
        </div>
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
};


// --- CHILD COMPONENT: DateRangePicker ---
type DateRangePickerProps = { range: DateRange; onRangeChange: (range: DateRange) => void; };
export const DateRangePicker = ({ range, onRangeChange }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleDayClick = (day: Date) => {
    let newRange: DateRange;
    if (range.from && !range.to && day > range.from) {
      newRange = { from: range.from, to: day };
      setIsOpen(false);
    } else {
      newRange = { from: day, to: undefined };
    }
    onRangeChange(newRange);
  };
  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRangeChange({ from: undefined, to: undefined });
  };
  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full h-full p-3 bg-white border border-gray-300 rounded-full shadow-sm text-left"
      >
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-500 ml-2" />
          <div className="text-sm font-medium text-gray-800">
            {range.from ? format(range.from, 'dd LLL') : 'Check-in'}
            {' – '}
            {range.to ? format(range.to, 'dd LLL') : 'Check-out'}
          </div>
        </div>
        {range.from && (
          <X size={16} className="text-gray-400 hover:text-gray-600 mr-2" onClick={handleReset} />
        )}
      </button>
      {isOpen && (
        <div className="absolute z-20 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl -translate-x-1/2 left-1/2">
          <DayPicker
            mode="range"
            selected={range}
            onDayClick={handleDayClick}
            numberOfMonths={2}
            disabled={{ before: new Date() }}
          />
        </div>
      )}
    </div>
  );
};


// --- CHILD COMPONENT: FilterBar ---
type FilterBarProps = { filters: Filters; onFilterChange: (newFilters: Filters) => void; };
export const FilterBar = ({ filters, onFilterChange }: FilterBarProps) => {
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, priceRange: { ...filters.priceRange, max: Number(e.target.value) } });
  };
  const handleStarToggle = (star: number) => {
    const newStars = filters.stars.includes(star)
      ? filters.stars.filter(s => s !== star)
      : [...filters.stars, star];
    onFilterChange({ ...filters, stars: newStars });
  };
  const handleAmenityToggle = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    onFilterChange({ ...filters, amenities: newAmenities });
  };
  return (
    <div className="bg-white rounded-xl shadow-md p-4 w-full lg:w-72 xl:w-80">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
        <SlidersHorizontal size={20} />
        Filters
      </h3>
      <div className="space-y-6">
        <div>
          <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">Max Price</label>
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-gray-400" />
            <input
              type="range" id="price" min={2000} max={15000} step={100}
              value={filters.priceRange.max} onChange={handlePriceChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
          <div className="text-right text-sm text-gray-600 mt-1">
            Up to {formatCurrency(filters.priceRange.max, "INR")}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Star Rating</label>
          <div className="flex justify-between gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star} onClick={() => handleStarToggle(star)}
                className={`flex-1 p-2 rounded-lg border-2 transition-colors duration-200 ${
                  filters.stars.includes(star) 
                    ? 'bg-blue-100 border-blue-600 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="flex justify-center items-center gap-0.5">
                  <span className="font-semibold">{star}</span>
                  <Star size={14} fill="currentColor" />
                </div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Amenities</label>
          <div className="grid grid-cols-2 gap-2">
            {['wifi', 'pool', 'ac', 'parking'].map(amenity => (
              <label key={amenity} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={filters.amenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm capitalize">{amenity}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


// --- PAGE COMPONENT: BrowsePage ---
/**
 * Main homepage where users browse hotels.
 */
export const BrowsePage = () => {
  const [query, setQuery] = useState("");
  const [dates, setDates] = useState<DateRange>({ from: undefined, to: undefined });
  const [filters, setFilters] = useState<Filters>({
    priceRange: { min: 0, max: 15000 },
    stars: [4, 5],
    rating: 4.0,
    amenities: ['wifi']
  });

  const handleSearch = (searchQuery: string) => {
    console.log("Searching for:", searchQuery, dates, filters);
  };
  
  // Apply filters to mock data for demo
  const filteredHotels = mockHotelList.filter(hotel => {
    const nameMatch = hotel.name.toLowerCase().includes(query.toLowerCase()) || 
                      hotel.city.toLowerCase().includes(query.toLowerCase());
    const priceMatch = hotel.min_price <= filters.priceRange.max;
    const starMatch = filters.stars.length === 0 || filters.stars.includes(hotel.stars);
    const amenityMatch = filters.amenities.every(amenity => hotel.amenities.includes(amenity));

    return nameMatch && priceMatch && starMatch && amenityMatch;
  });

  return (
    <div className="bg-gray-100 min-h-screen">
      <style>{dayPickerStyles}</style>
      
      {/* --- Header & Search Bar --- */}
      <header className="sticky top-0 z-30 bg-white shadow-sm p-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <h1 className="text-2xl font-bold text-blue-600">ProBooker</h1>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-3xl">
              <SearchBar 
                query={query} 
                onQueryChange={setQuery} 
                onSearch={handleSearch} 
              />
              <DateRangePicker range={dates} onRangeChange={setDates} />
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="container mx-auto max-w-7xl p-4 mt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* --- Filters (Sidebar) --- */}
          <aside className="w-full lg:w-1/4">
            <div className="sticky top-24">
              <FilterBar filters={filters} onFilterChange={setFilters} />
            </div>
          </aside>

          {/* --- Hotel Grid (Main) --- */}
          <section className="w-full lg:w-3/4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {filteredHotels.length} results found
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredHotels.map(hotel => (
                <HotelCard 
                  key={hotel.id} 
                  hotel={hotel} 
                  onClick={(h) => console.log("Navigating to hotel:", h.slug)} 
                />
              ))}
            </div>
            {filteredHotels.length === 0 && (
              <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-700">No hotels found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

// --- Default Export Wrapper (for running in Canvas) ---
export default function App() {
  return <BrowsePage />;
}

