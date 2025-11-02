import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal,
  Loader2 // Using Loader2 as a standard loading icon
} from 'lucide-react';

// Import the official stylesheet for react-day-picker
import 'react-day-picker/dist/style.css';

// Import your Supabase client
import { supabase } from '../lib/supabaseClient';

// Import types and helpers from the central data file
// NOTE: We keep the types, but remove the mock data imports
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


// --- PAGE COMPONENT: BrowsePage ---
/**
 * Main homepage where users browse hotels, now connected to Supabase.
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
  
  // --- NEW: State for live data ---
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to search/fetch data
  const fetchHotels = async () => {
    setIsLoading(true);

    // Start with a basic query to the 'hotels' table
    let queryBuilder = supabase
      .from('hotels')
      .select('*');

    // 1. Apply Search Query (on name OR city)
    if (query) {
      // Use 'or' to search across multiple columns
      // Note: Supabase 'or' needs the full query string for each part
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,address->>city.ilike.%${query}%`);
    }

    // 2. Apply Price Filter (Max Price)
    // We assume the column is `base_price` as in the schema
    queryBuilder = queryBuilder.lte('base_price', filters.priceRange.max);

    // 3. Apply Star Filter
    if (filters.stars.length > 0) {
      queryBuilder = queryBuilder.in('stars', filters.stars);
    }
    
    // 4. Apply Amenities Filter
    if (filters.amenities.length > 0) {
        // Use the 'contains' operator on the text[] column
        queryBuilder = queryBuilder.contains('amenities', filters.amenities);
    }

    // --- NOTE: Add Date Availability Filter here in a real app ---
    // This requires complex Postgres functions/views to check rooms/bookings.
    // We skip the date filter for this basic connection step.

    // Execute the final query
    const { data, error } = await queryBuilder;

    if (error) {
      console.error("Error fetching hotels:", error);
      setHotels([]); // Clear data on error
    } else {
      // Supabase v2 returns data directly, ensure it's not null
      setHotels((data as Hotel[]) || []);
    }
    setIsLoading(false);
  };
  
  // Trigger fetch when query or filters change
  useEffect(() => {
    // We wrap fetchHotels in a timeout to "debounce" user input
    // This prevents firing an API call on every single key press
    const timerId = setTimeout(() => {
      fetchHotels();
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timerId); // Cleanup
  }, [query, filters]);

  // Handle search button click
  const handleSearch = (searchQuery: string) => {
    // setQuery(searchQuery) is already called by the SearchBar's onQueryChange
    // This function can just trigger an immediate fetch if needed,
    // but the useEffect already handles it.
    console.log("Search triggered for:", searchQuery);
    fetchHotels(); // Trigger an immediate fetch on button click
  };
  
  // The filtering logic is now handled in the Supabase query above.
  // We just map over the 'hotels' state.

  return (
    <div className="bg-gray-100 min-h-screen">
      
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
          <aside className="w-full lg:w-1D4">
            <div className="sticky top-24">
              {/* Use the imported FilterBar component */}
              <FilterBar filters={filters} onFilterChange={setFilters} />
            </div>
          </aside>

          {/* --- Hotel Grid (Main) --- */}
          <section className="w-full lg:w-3/4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isLoading 
                ? 'Searching...' 
                : `${hotels.length} results found`
              }
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {isLoading ? (
                // Simple loading placeholder
                <div className="col-span-full text-center py-16 text-gray-500">
                  <Loader2 size={32} className="mx-auto animate-spin" />
                  <p className="mt-2">Fetching hotels from the database...</p>
                </div>
              ) : (
                <>
                  {hotels.map(hotel => (
                    <HotelCard 
                      key={hotel.id} 
                      hotel={hotel} 
                      onClick={(h) => console.log("Navigating to hotel:", h.slug)} 
                    />
                  ))}
                  {hotels.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-white rounded-lg shadow-md">
                      <h3 className="text-xl font-semibold text-gray-700">No hotels found</h3>
                      <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
                    </div>
                  )}
                </>
              )}
            </div >
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