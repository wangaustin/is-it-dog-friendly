"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";

interface PlaceSearchProps {
  onPlaceSelect: (place: any) => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PlaceSearch: React.FC<PlaceSearchProps> = ({ onPlaceSelect }) => {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data, error } = useSWR(
    input.length > 2 ? `/api/places?input=${input}` : null,
    fetcher
  );

  const handleSelect = async (placePrediction: any) => {
    setInput(placePrediction.text.text);
    setShowSuggestions(false);
    
    const placeId = placePrediction.placeId;
    const res = await fetch(`/api/places/details?placeId=${placeId}`);
    const placeDetails = await res.json();
    onPlaceSelect(placeDetails);
  };
  
  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setShowSuggestions(true);
        }}
        placeholder="Search for a place"
        className="w-full p-2 border border-gray-300 rounded-md"
      />
      {showSuggestions && data && data.suggestions && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {data.suggestions.map((suggestion: any) => (
            <li
              key={suggestion.placePrediction.placeId}
              onClick={() => handleSelect(suggestion.placePrediction)}
              className="p-2 cursor-pointer hover:bg-gray-100"
            >
              {suggestion.placePrediction.text.text}
            </li>
          ))}
        </ul>
      )}
      {error && <p>Error fetching suggestions</p>}
    </div>
  );
};

export default PlaceSearch; 