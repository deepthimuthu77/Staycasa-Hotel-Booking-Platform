// src/components/FilterBar.tsx

import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Star, 
  DollarSign, 
  Wifi, 
  ParkingCircle, 
  Wind,
  ChevronDown,
  ChevronUp,
  Utensils,
  Waves,
  Dumbbell,
  Bath,     // <-- (FIX) Replaced 'Spa' with 'Bath'
  Coffee,
  UserCheck
} from 'lucide-react';

// --- HELPER FUNCTION ---
// ... (formatCurrency function is unchanged) ...
export const formatCurrency = (amount: number, currency: string = "INR"): string => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: currency, 
    minimumFractionDigits: 0
  }).format(amount);
};

// --- TYPE DEFINITIONS ---
// ... (Types are unchanged) ...
export type Filters = {
  priceRange: { min: number; max: number };
  stars: number[];
  rating: number;
  amenities: string[];
};
type FilterBarProps = {
  filters: Filters;
  onFilterChange: (newFilters: Filters) => void;
};
const clearedFilters: Filters = {
  priceRange: { min: 0, max: 50000 },
  stars: [],
  rating: 0,
  amenities: [],
};

// --- (MODIFIED) Master list of all filterable amenities ---
const allAmenities = [
  { name: 'wifi', icon: <Wifi size={16} /> },
  { name: 'parking', icon: <ParkingCircle size={16} /> },
  { name: 'ac', icon: <Wind size={16} /> },
  { name: 'restaurant', icon: <Utensils size={16} /> },
  { name: 'pool', icon: <Waves size={16} /> },
  { name: 'gym', icon: <Dumbbell size={16} /> },
  { name: 'spa', icon: <Bath size={16} /> }, // <-- (FIX) Using 'Bath' here
  { name: 'breakfast', icon: <Coffee size={16} /> },
  { name: 'butler service', icon: <UserCheck size={16} /> },
];

const topAmenities = allAmenities.slice(0, 4);
const otherAmenities = allAmenities.slice(4);


// --- FilterBar Component ---
// ... (The rest of the FilterBar component is unchanged) ...
export const FilterBar = ({ filters, onFilterChange }: FilterBarProps) => {
  // ... (all internal logic is unchanged) ...
  const [showAll, setShowAll] = useState(false);

  const handleClearAll = () => {
    onFilterChange(clearedFilters);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      priceRange: { ...filters.priceRange, max: Number(e.target.value) }
    });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({
      ...filters,
      rating: filters.rating === rating ? 0 : rating 
    });
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

  const AmenityCheckbox = ({ name, icon }: { name: string, icon: React.ReactNode }) => (
    <label 
      key={name} 
      className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
    >
      <input
        type="checkbox"
        checked={filters.amenities.includes(name)}
        onChange={() => handleAmenityToggle(name)}
        className="rounded text-blue-600 focus:ring-blue-500"
      />
      {icon}
      <span className="text-sm capitalize">{name}</span>
    </label>
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal size={20} />
          Filters
        </h3>
        <button 
          type="button"
          onClick={handleClearAll}
          className="text-sm text-blue-600 font-medium hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-6">
        {/* --- Price Range Filter --- */}
        <div>
          <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
            Price Range (max)
          </label>
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-gray-400" />
            <input
              type="range"
              id="price"
              min={500}
              max={50000}
              step={100}
              value={filters.priceRange.max}
              onChange={handlePriceChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
          </div>
          <div className="text-right text-sm text-gray-600 mt-1">
            Up to {formatCurrency(filters.priceRange.max, "INR")}
          </div>
        </div>

        {/* --- Star Rating Filter --- */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Star Rating
          </label>
          <div className="flex justify-between gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => handleStarToggle(star)}
                className={`flex-1 p-2 rounded-lg border-2 transition-colors duration-200
                  ${filters.stars.includes(star) 
                    ? 'bg-blue-100 border-blue-600 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}
                `}
              >
                <div className="flex justify-center items-center gap-0.5">
                  <span className="font-semibold">{star}</span>
                  <Star size={14} fill="currentColor" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* --- (MODIFIED) Amenities Filter --- */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Amenities
          </label>
          <div className="grid grid-cols-2 gap-2">
            {topAmenities.map(amenity => (
              <AmenityCheckbox key={amenity.name} name={amenity.name} icon={amenity.icon} />
            ))}
          </div>
        </div>
        
        {/* --- (MODIFIED) Show More Section --- */}
        {showAll && (
          <div className="pt-4 border-t border-gray-100 space-y-6">
            
            {/* --- (MODIFIED) More Amenities --- */}
            {otherAmenities.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  More Amenities
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {otherAmenities.map(amenity => (
                    <AmenityCheckbox key={amenity.name} name={amenity.name} icon={amenity.icon} />
                  ))}
                </div>
              </div>
            )}

            {/* --- User Rating Filter --- */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                User Rating
              </label>
              <div className="flex justify-between gap-1">
                {[1, 2, 3, 4].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingChange(rating)}
                    className={`flex-1 p-2 rounded-lg border-2 transition-colors duration-200
                      ${filters.rating === rating
                        ? 'bg-blue-100 border-blue-600 text-blue-700' 
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}
                    `}
                  >
                    <span className="font-semibold">{rating}+</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- More Filters Button --- */}
        <button 
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="w-full p-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors"
        >
          {showAll ? 'Show less filters' : 'Show all filters'}
          {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  );
};

// --- Main App (for Demo) ---
// ... (Default export is unchanged) ...
export default function App() {
  const [currentFilters, setCurrentFilters] = useState<Filters>({
    priceRange: { min: 0, max: 7500 },
    stars: [4, 5],
    rating: 4.0,
    amenities: ['wifi']
  });

  return (
    <div className="bg-gray-100 p-8 min-h-screen font-sans">
      <div className="max-w-md mx-auto grid grid-cols-1 gap-6">
        <FilterBar 
          filters={currentFilters} 
          onFilterChange={setCurrentFilters} 
        />
        <div className="bg-gray-800 text-white rounded-lg p-4">
          <pre className="text-xs">
            {JSON.stringify(currentFilters, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}