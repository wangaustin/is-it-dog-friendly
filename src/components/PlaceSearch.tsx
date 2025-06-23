"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";

interface PlacePrediction {
  placeId: string;
  text: { text: string };
}

interface PlaceDetails {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
}

interface PlaceSearchProps {
  onPlaceSelect: (place: PlaceDetails) => void;
  onReset?: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PlaceSearch: React.FC<PlaceSearchProps> = ({ onPlaceSelect, onReset }) => {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data, error } = useSWR(
    input.length > 2 ? `/api/places?input=${input}` : null,
    fetcher
  );

  const handleSelect = async (placePrediction: PlacePrediction) => {
    setInput(placePrediction.text.text);
    setShowSuggestions(false);
    const placeId = placePrediction.placeId;
    const res = await fetch(`/api/places/${placeId}`);
    const placeDetails: PlaceDetails = await res.json();
    onPlaceSelect(placeDetails);
  };

  const resetSearch = () => {
    setInput("");
    setShowSuggestions(false);
    onReset?.();
  };

  // Listen for reset event
  useEffect(() => {
    window.addEventListener('resetSearch', resetSearch);
    return () => window.removeEventListener('resetSearch', resetSearch);
  }, [resetSearch]);

  return (
    <div className="relative w-full max-w-md">
      <div className="flex gap-2">
        <input
          type="text"
          className="border p-2 w-full rounded"
          placeholder="Search for a place..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          autoComplete="off"
        />
        {input && (
          <button
            onClick={resetSearch}
            className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-gray-600"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      {showSuggestions && data && data.suggestions && (
        <ul className="absolute z-10 bg-white border w-full mt-1 rounded shadow">
          {data.suggestions.map((suggestion: { placePrediction: PlacePrediction }) => (
            <li
              key={suggestion.placePrediction.placeId}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(suggestion.placePrediction)}
            >
              {suggestion.placePrediction.text.text}
            </li>
          ))}
        </ul>
      )}
      {error && <div className="text-red-500 mt-2">Error loading suggestions</div>}
    </div>
  );
};

export default PlaceSearch; 