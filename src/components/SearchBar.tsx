import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

// --- TYPE DEFINITIONS ---
type SearchBarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
};

// Mock suggestions for demo
const mockSuggestions = [
  "Seaside Panorama Hotel",
  "Pondicherry",
  "Goa",
  "The Grand Palace",
  "Mumbai"
];

// --- SearchBar Component ---
/**
 * Search input for hotels/cities with auto-suggestions.
 */
export const SearchBar = ({ 
  query, 
  onQueryChange, 
  onSearch, 
  placeholder = "Search hotels or cities..." 
}: SearchBarProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = mockSuggestions.filter(s => 
    s.toLowerCase().includes(query.toLowerCase())
  );

  const handleSuggestionClick = (suggestion: string) => {
    onQueryChange(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              onQueryChange(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
            placeholder={placeholder}
            className="w-full pl-10 pr-20 py-3 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      
      {showSuggestions && query && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {filteredSuggestions.map(suggestion => (
              <li
                key={suggestion}
                onMouseDown={() => handleSuggestionClick(suggestion)} // Use onMouseDown to fire before blur
                className="p-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50"
              >
                <MapPin size={16} className="text-gray-400" />
                <span className="text-gray-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- Main App (for Demo) ---
// This default export is included so you can run this file and see the component.
export default function App() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
  };

  return (
    <div className="bg-gray-100 p-8 min-h-screen font-sans flex justify-center pt-20">
      <SearchBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onSearch={handleSearch}
      />
    </div>
  );
}
