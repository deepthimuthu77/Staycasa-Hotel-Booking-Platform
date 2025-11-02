// src/pages/BrowsePage.tsx

import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal,
  Loader2,
  ChevronDown // For the sort dropdown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // (NEW) For navigation

// Import the official stylesheet for react-day-picker
import 'react-day-picker/dist/style.css';

// Import your Supabase client
import { supabase } from '../lib/supabaseClient';

// Import types and helpers from the central data file
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

// --- (NEW) Constants ---
const PAGE_SIZE = 9; // Number of hotels to fetch per page

// --- (NEW) Sort Options ---
const sortOptions = [
  { label: 'Popularity', value: 'popularity_score.desc' },
  { label: 'Price (Low to High)', value: 'base_price.asc' },
  { label: 'Price (High to Low)', value: 'base_price.desc' },
];

// --- PAGE COMPONENT: BrowsePage (UPDATED) ---
export const BrowsePage = () => {
  const [query, setQuery] = useState("");
  const [dates, setDates] = useState<DateRange>({ from: undefined, to: undefined });
  const [filters, setFilters] = useState<Filters>({
    priceRange: { min: 0, max: 20000 }, // Increased default max
    stars: [],
    rating: 0, // Changed default to 0
    amenities: []
  });
  
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false); // (NEW) For pagination
  const [page, setPage] = useState(0); // (NEW) Pagination state
  const [hasMore, setHasMore] = useState(true); // (NEW) To know when to stop loading
  const [sortBy, setSortBy] = useState(sortOptions[0].value); // (NEW) Sorting state

  const navigate = useNavigate(); // (NEW) For navigation

  // Function to search/fetch data
  const fetchHotels = async (isNewSearch = false) => {
    if (isNewSearch) {
      setIsLoading(true);
      setPage(0); // Reset page for new search
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }
    
    const currentPage = isNewSearch ? 0 : page;
    const [sortColumn, sortOrder] = sortBy.split('.');

    let queryBuilder;

    // --- (NEW) DATE AVAILABILITY FILTER ---
    if (dates.from && dates.to) {
      // If dates are selected, call the database function
      // This assumes you created a Postgres function `get_available_hotels` in Supabase
      // as specified in the JSON.
      queryBuilder = supabase.rpc('get_available_hotels', {
        check_in_date: dates.from.toISOString().split('T')[0],
        check_out_date: dates.to.toISOString().split('T')[0],
      });
      
    } else {
      // If no dates, just query the hotels table
      queryBuilder = supabase.from('hotels').select('*');
    }

    // 1. Apply Search Query (on name OR city)
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,address->>city.ilike.%${query}%`);
    }

    // 2. Apply Price Filter (Max Price)
    queryBuilder = queryBuilder.lte('base_price', filters.priceRange.max);
    
    // (NEW) Apply Price Filter (Min Price)
    queryBuilder = queryBuilder.gte('base_price', filters.priceRange.min);

    // 3. Apply Star Filter
    if (filters.stars.length > 0) {
      queryBuilder = queryBuilder.in('stars', filters.stars);
    }
    
    // (NEW) Apply Rating Filter
    if (filters.rating > 0) {
      queryBuilder = queryBuilder.gte('popularity_score', filters.rating);
    }
    
    // 4. Apply Amenities Filter
    if (filters.amenities.length > 0) {
        queryBuilder = queryBuilder.contains('amenities', filters.amenities);
    }

    // 5. --- (NEW) Apply Sorting ---
    queryBuilder = queryBuilder.order(sortColumn, { ascending: sortOrder === 'asc' });

    // 6. --- (NEW) Apply Pagination ---
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    queryBuilder = queryBuilder.range(from, to);

    // Execute the final query
    const { data, error } = await queryBuilder;

    if (error) {
      console.error("Error fetching hotels:", error);
      setHotels([]);
      setHasMore(false);
    } else if (data) {
      // (NEW) Handle pagination state
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
      
      if (isNewSearch) {
        setHotels(data as Hotel[]);
      } else {
        // Append new data for "Load More"
        setHotels(prev => [...prev, ...(data as Hotel[])]);
      }
      
      setPage(currentPage + 1);
    }

    setIsLoading(false);
    setIsLoadingMore(false);
  };
  
  // Trigger fetch when query, filters, or sorting change
  useEffect(() => {
    // Debounce user input
    const timerId = setTimeout(() => {
      fetchHotels(true); // 'true' indicates a new search
    }, 500); 

    return () => clearTimeout(timerId);
  }, [query, filters, sortBy, dates]); // (NEW) Re-fetch on date change


  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    // fetchHotels(true) is already called by the useEffect
  };
  
  // (NEW) Handle "Load More" click
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchHotels(false); // 'false' indicates loading more, not a new search
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      
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
            {/* --- (NEW) Header with Sorting --- */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {isLoading 
                  ? 'Searching...' 
                  : `${hotels.length} results found`
                }
              </h2>
              
              {/* --- (NEW) Sort Dropdown --- */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* --- Results Grid --- */}
            {isLoading ? (
              // Main loading spinner for new search
              <div className="col-span-full text-center py-16 text-gray-500">
                <Loader2 size={32} className="mx-auto animate-spin" />
                <p className="mt-2">Fetching hotels from the database...</p>
              </div>
            ) : (
              <>
                {hotels.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {hotels.map(hotel => (
                      <HotelCard 
                        key={hotel.id} 
                        hotel={hotel} 
                        onClick={(h) => navigate(`/hotel/${h.slug}`)} // (NEW) Navigate on click
                      />
                    ))}
                  </div>
                ) : (
                  // No results found
                  <div className="col-span-full text-center py-16 bg-white rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">No hotels found</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
                  </div>
                )}
                
                {/* --- (NEW) Load More Button --- */}
                <div className="mt-8 text-center">
                  {hasMore ? (
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center mx-auto"
                    >
                      {isLoadingMore ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        'Load More Results'
                      )}
                    </button>
                  ) : (
                    <p className="text-gray-500">You've reached the end of the results.</p>
                  )}
                </div>
              </>
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