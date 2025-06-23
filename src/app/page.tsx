"use client";

import { useState, useEffect } from "react";
import PlaceSearch from "@/components/PlaceSearch";

interface Place {
  id: string;
  displayName: {
    text: string;
  };
  formattedAddress: string;
}

export default function Home() {
  const [place, setPlace] = useState<Place | null>(null);
  const [votes, setVotes] = useState<{ yes: number; no: number } | null>(null);
  const [loadingVotes, setLoadingVotes] = useState(false);
  const [voting, setVoting] = useState(false);

  // Fetch votes when place changes
  useEffect(() => {
    if (!place) {
      setVotes(null);
      return;
    }
    const fetchVotes = async () => {
      setLoadingVotes(true);
      const res = await fetch(`/api/votes?place_id=${encodeURIComponent(place.id)}`);
      const data = await res.json();
      setVotes(data);
      setLoadingVotes(false);
    };
    fetchVotes();
  }, [place]);

  const handleVote = async (vote: "yes" | "no") => {
    if (!place) return;
    setVoting(true);
    await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        place_id: place.id,
        place_name: place.displayName.text,
        place_address: place.formattedAddress,
        vote_type: vote,
      }),
    });
    // Refresh votes
    const res = await fetch(`/api/votes?place_id=${encodeURIComponent(place.id)}`);
    const data = await res.json();
    setVotes(data);
    setVoting(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Is It Dog-Friendly?</h1>
      <PlaceSearch onPlaceSelect={setPlace} />
      {place && (
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold">{place.displayName.text}</h2>
          <p className="mb-4">{place.formattedAddress}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleVote("yes")}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              disabled={voting}
            >
              Yes
            </button>
            <button
              onClick={() => handleVote("no")}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              disabled={voting}
            >
              No
            </button>
          </div>
          {loadingVotes ? (
            <div className="mt-4 text-gray-500">Loading votes...</div>
          ) : votes && (
            <div className="mt-4">
              <p>Yes: {votes.yes}</p>
              <p>No: {votes.no}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
