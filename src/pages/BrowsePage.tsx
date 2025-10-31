import React, { useState } from 'react';
import { 
  Star, 
  MapPin, 
  SlidersHorizontal,
  DollarSign,
  ChevronDown,
  Calendar,
  X
} from 'lucide-react';

// Import the official stylesheet for react-day-picker
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

// Import types, data, and helpers from the central data file
import { 
  mockHotelList, 
  formatCurrency 
} from '../data/data';
import type { 
  Hotel, 
  Filters, 
  DateRange 
} from '../data/data';

// Import reusable components
import { HotelCard } from '../components/HotelCard';
import { SearchBar } from '../components/SearchBar';
import { DateRangePicker } from '../components/DateRangePicker';
import { FilterBar } from '../components/FilterBar';


// --- CHILD COMPONENT: HotelCard (REMOVED) ---
// This component is now imported from ../components/HotelCard.tsx

// --- CHILD COMPONENT: SearchBar (REMOVED) ---
// This component is now imported from ../components/SearchBar.tsx

// --- CHILD COMPONENT: DateRangePicker (REMOVED) ---
// This component is now imported from ../components/DateRangePicker.tsx

// --- CHILD COMPONENT: FilterBar (REMOVED) ---
// This component is now imported from ../components/FilterBar.tsx


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
      {/* <style>{dayPickerStyles}</style> <-- This has been removed */}
      
      {/* --- Header & Search Bar --- */}
      <header className="sticky top-0 z-30 bg-white shadow-sm p-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <h1 className="text-2xl font-bold text-blue-600">ProBooker</h1>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-3xl">
              {/* Use the imported SearchBar component */}
              <SearchBar 
                query={query} 
                onQueryChange={setQuery} 
                onSearch={handleSearch} 
              />
              {/* Use the imported DateRangePicker component */}
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
              {/* Use the imported FilterBar component */}
              <FilterBar filters={filters} onFilterChange={setFilters} />
            </div>
          </aside>

          {/* --- Hotel Grid (Main) --- */}
          <section className="w-full lg:w-3/4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {filteredHotels.length} results found
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Use the imported HotelCard component */}
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