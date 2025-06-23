"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = async (placePrediction: PlacePrediction) => {
    setInput(placePrediction.text.text);
    setShowSuggestions(false);
    const placeId = placePrediction.placeId;
    const res = await fetch(`/api/places/${placeId}`);
    const placeDetails: PlaceDetails = await res.json();
    onPlaceSelect(placeDetails);
  };

  const resetSearch = useCallback(() => {
    setInput("");
    setShowSuggestions(false);
    if (searchParams.get("place_id")) {
      router.push("/");
    }
    onReset?.();
  }, [onReset, router, searchParams]);

  // Listen for reset event
  useEffect(() => {
    window.addEventListener('resetSearch', resetSearch);
    return () => window.removeEventListener('resetSearch', resetSearch);
  }, [resetSearch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    if (!showSuggestions) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSuggestions]);

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <div className="flex gap-2">
        <input
          type="text"
          className="border border-gray-300 bg-white text-gray-900 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
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
            className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      {showSuggestions && data && data.suggestions && (
        <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded-lg shadow-xl">
          {data.suggestions.map((suggestion: { placePrediction: PlacePrediction }) => (
            <li
              key={suggestion.placePrediction.placeId}
              className="p-3 hover:bg-gray-100 cursor-pointer text-gray-900 border-b border-gray-200 last:border-b-0 transition-colors"
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