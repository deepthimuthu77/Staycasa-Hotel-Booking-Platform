import React from 'react';
import { 
  Star, 
  MapPin, 
  Wifi, 
  Utensils, 
  Wind,
  ParkingCircle 
} from 'lucide-react';
import { motion } from 'framer-motion'; // <-- ADDED
import type { Hotel } from '../data/data.tsx';
import { formatCurrency } from '../data/data.tsx'; 

// --- TYPE DEFINITIONS ---
type HotelCardProps = {
  hotel: Hotel;
  onClick: (hotel: Hotel) => void;
};

// --- HotelCard Component (No changes here) ---
/**
 * Displays a single hotel's information in a card format.
 * (As specified in json: animated, responsive, price, rating, location, badges)
 * Note: 'animated' is now handled by Framer Motion.
 */
export const HotelCard = ({ hotel, onClick }: HotelCardProps) => {
  const { 
    name, 
    address,
    popularity_score, 
    stars, 
    base_price, 
    currency, 
    thumbnail, 
    amenities, 
    is_featured 
  } = hotel;

  // Helper to get amenities icons
 const getAmenityIcon = (amenity: string, i?: number) => {
  const key = `${amenity}-${i ?? amenity}`;
  const name = (amenity || '').toLowerCase();

  if (name.includes('wifi') || name === 'wifi') {
    return <Wifi key={key} size={16} className="text-gray-600" />;
  }

  if (name.includes('pool')) {
    return (
      <span key={key} className="text-gray-600 text-sm px-2 py-1 bg-gray-100 rounded">
        Pool
      </span>
    );
  }

  if (name.includes('restaurant') || name.includes('dining') || name.includes('utensils')) {
    return <Utensils key={key} size={16} className="text-gray-600" />;
  }

  if (name.includes('ac') || name.includes('air')) {
    return <Wind key={key} size={16} className="text-gray-600" />;
  }

  if (name.includes('parking')) {
    return <ParkingCircle key={key} size={16} className="text-gray-600" />;
  }

  // fallback: render the amenity text
  return <span key={key} className="text-xs text-gray-600">{amenity}</span>;
 };

  return (
    <motion.div // <-- CHANGED
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl cursor-pointer" // <-- EDITED
      onClick={() => onClick(hotel)}
      whileHover={{ y: -8, scale: 1.02 }} // <-- ADDED
      transition={{ type: "spring", stiffness: 400, damping: 17 }} // <-- ADDED
    >
      <div className="relative">
        <div className="flex items-center gap-3 text-gray-600 my-3">
          {amenities?.slice(0, 4).map((a, i) => getAmenityIcon(a, i))}
          {amenities?.length > 4 && (
            <span className="text-xs font-medium">+{amenities.length - 4} more</span>
          )}
        </div>
        <div className="absolute top-3 right-3 bg-blue-600 text-white text-sm font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Star size={14} fill="white" />
          <span>{popularity_score?.toFixed(1) || 'N/A'}</span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{name}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <MapPin size={14} />
              {address?.city || 'Unknown City'}
            </p>
          </div>
          <div className="flex items-center text-yellow-500">
            {Array.from({ length: stars }).map((_, i) => (
              <Star size={16} fill="currentColor" key={i} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-600 my-3">
          {amenities?.slice(0, 4).map(getAmenityIcon)}
          {amenities?.length > 4 && (
            <span className="text-xs font-medium">+{amenities.length - 4} more</span>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(base_price, currency).replace(/\.00$/, '')}
            </span>
            <span className="text-sm text-gray-500">/ night</span>
          </div>
          <button 
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              onClick(hotel);
            }}
          >
            View
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App (for Demo) ---
// This default export is included so you can run this file and see the component.
export default function App() {
  const handleCardClick = (hotel: Hotel) => {
    console.log("Card clicked:", hotel.name);
  };

  const demoHotel: Hotel = {
    id: "h-demo",
    name: "Demo Hotel Card",
    slug: "demo-hotel-card",
    city: "Demo City",
    address: { street: "123 Demo St", city: "Demo City", country: "DemoLand", lat: 0, lng: 0 },
    stars: 4,
    popularity_score: 4.5,
    description: "A demo hotel",
    amenities: ["wifi", "pool", "ac"],
    gallery: [],
    thumbnail: "https://placehold.co/400x300/3498db/ffffff?text=Demo+Hotel",
    base_price: 3000,
    currency: "INR",
    is_featured: true
  };

  return (
    <div className="bg-gray-100 p-8 min-h-screen">
      <div className="max-w-sm mx-auto">
        <HotelCard hotel={demoHotel} onClick={handleCardClick} />
      </div>
    </div>
  );
}