import React from 'react';
import { 
  Star, 
  MapPin, 
  Wifi, 
  Utensils, 
  Wind,
  ParkingCircle 
} from 'lucide-react';
import { motion } from 'framer-motion'; 
import type { Hotel } from '../data/data.tsx';
import { formatCurrency } from '../data/data.tsx'; 

// --- TYPE DEFINITIONS ---
type HotelCardProps = {
  hotel: Hotel;
  onClick: (hotel: Hotel) => void;
};

// --- Helper to get Amenities Icon (MODIFIED) ---
// Now returns the Lucide element ready to be styled by the wrapper div
 const getAmenityIcon = (amenity: string) => {
  const name = (amenity || '').toLowerCase();
  let IconComponent;

  if (name.includes('wifi')) {
    IconComponent = Wifi;
  } else if (name.includes('pool')) {
    // Using a different icon for pool since the text was being used previously
    IconComponent = Utensils; 
  } else if (name.includes('restaurant') || name.includes('dining')) {
    IconComponent = Utensils;
  } else if (name.includes('ac') || name.includes('air')) {
    IconComponent = Wind;
  } else if (name.includes('parking')) {
    IconComponent = ParkingCircle;
  } else {
    // Fallback icon
    IconComponent = Star; 
  }
  
  // Return a cloned element with necessary props for visibility
  return <IconComponent size={16} />;
 };


// --- HotelCard Component (MODIFIED) ---
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


  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl cursor-pointer"
      onClick={() => onClick(hotel)}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      
      {/* --- Image and Overlay --- */}
      <div className="relative h-48 overflow-hidden"> 
        <img 
          src={thumbnail} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        
        <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start">
            
            {/* --- Amenities (FIX APPLIED HERE) --- */}
            <div className="flex items-center gap-2">
                {amenities?.slice(0, 4).map((a, i) => (
                    // FIX: Wrapper for high visibility
                    <div 
                        key={i} 
                        className="p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center"
                    >
                        {/* Render the icon inside the wrapper */}
                        {getAmenityIcon(a)}
                    </div>
                ))}
                {amenities?.length > 4 && (
                    <span className="text-xs font-medium bg-black/50 text-white backdrop-blur-sm px-2 py-0.5 rounded-full">
                        +{amenities.length - 4} more
                    </span>
                )}
            </div>

            {/* --- Rating Badge --- */}
            <div className="bg-blue-600 text-white text-sm font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Star size={14} fill="white" />
                <span>{popularity_score?.toFixed(1) || 'N/A'}</span>
            </div>
            
        </div>
        
      </div>
      
      {/* --- Content section (p-4) --- */}
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
        
        <div className="flex justify-between items-center mt-4 border-t border-gray-100 pt-3">
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

// --- Default Export Wrapper (for running in Canvas) ---
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
    amenities: ["wifi", "pool", "ac", "parking", "restaurant"],
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