import React from 'react';
import { 
  Star, 
  MapPin, 
  Wifi, 
  Utensils, 
  Wind,
  ParkingCircle 
} from 'lucide-react';
import type { Hotel } from '../data/data.tsx';
import { mockHotelList, formatCurrency } from '../data/data.tsx'; 

// --- TYPE DEFINITIONS ---
// 'Hotel' type is imported from './data/data.tsx'

type HotelCardProps = {
  hotel: Hotel;
  onClick: (hotel: Hotel) => void;
};

// --- MOCK DATA ---
// 'mockHotel' is imported from './data/data.tsx'

// --- HELPER FUNCTION ---
// 'formatCurrency' is imported from './data/data.tsx'


// --- HotelCard Component ---
/**
 * Displays a single hotel's information in a card format.
 * (As specified in json: animated, responsive, price, rating, location, badges)
 * Note: 'animated' is handled via CSS transitions.
 */
export const HotelCard = ({ hotel, onClick }: HotelCardProps) => {
  const { 
    name, 
    city, 
    rating, 
    stars, 
    min_price, 
    currency, 
    thumbnail, 
    amenities, 
    is_featured 
  } = hotel;

  // Helper to get amenities icons
 const getAmenityIcon = (amenity: string) => {
      switch (amenity) {
        case 'wifi':
          return (
            <span key="wifi" title="Free WiFi">
              <Wifi size={16} />
            </span>
          );

        case 'breakfast':
          return (
            <span key="breakfast" title="Breakfast Included">
              <Utensils size={16} />
            </span>
          );

        case 'pool':
          return (
            <span key="pool" title="Swimming Pool">
              <ParkingCircle size={16} />
            </span>
          );

        case 'ac':
          return (
            <span key="ac" title="Air Conditioning">
              <Wind size={16} />
            </span>
          );

        default:
          return null;
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
              {formatCurrency(min_price, currency).replace(/\.00$/, '')}
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
    </div>
  );
};

// --- Main App (for Demo) ---
// This default export is included so you can run this file and see the component.
export default function App() {
  const handleCardClick = (hotel: Hotel) => {
    console.log("Card clicked:", hotel.name);
  };

  return (
    <div className="bg-gray-100 p-8 min-h-screen">
      <div className="max-w-sm mx-auto">
        <HotelCard hotel={mockHotelList[0]} onClick={handleCardClick} />
      </div>
    </div>
  );
}

