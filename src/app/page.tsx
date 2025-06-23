"use client";

import { useState, useEffect } from "react";
import PlaceSearch from "@/components/PlaceSearch";
import { useSession, signIn, signOut } from "next-auth/react";

interface Place {
  id: string;
  displayName: {
    text: string;
  };
  formattedAddress: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [place, setPlace] = useState<Place | null>(null);
  const [votes, setVotes] = useState<{ yes: number; no: number } | null>(null);
  const [loadingVotes, setLoadingVotes] = useState(false);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!place) {
      setVotes(null);
      setVoteError(null);
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
    setVoteError(null);
  }, [place]);

  const handleVote = async (vote: "yes" | "no") => {
    if (!place || !session?.user?.email) return;
    setVoting(true);
    setVoteError(null);
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        place_id: place.id,
        place_name: place.displayName.text,
        place_address: place.formattedAddress,
        vote_type: vote,
        user_email: session.user.email,
      }),
    });
    setVoting(false);
    if (res.status === 409) {
      setVoteError("You have already voted for this place.");
      return;
    }
    if (!res.ok) {
      setVoteError("An error occurred. Please try again.");
      return;
    }
    // Refresh votes
    const votesRes = await fetch(`/api/votes?place_id=${encodeURIComponent(place.id)}`);
    const votesData = await votesRes.json();
    setVotes(votesData);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Is It Dog-Friendly?</h1>
      <div className="mb-4 w-full flex justify-end">
        {status === "loading" ? (
          <span>Loading...</span>
        ) : session ? (
          <>
            <span className="mr-4">Welcome, {session.user?.name || session.user?.email}!</span>
            <button onClick={() => signOut()} className="text-blue-600 underline">Sign out</button>
          </>
        ) : (
          <button onClick={() => signIn("google")}
            className="text-blue-600 underline">Sign in with Google</button>
        )}
      </div>
      <PlaceSearch onPlaceSelect={setPlace} />
      {place && (
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold">{place.displayName.text}</h2>
          <p className="mb-4">{place.formattedAddress}</p>
          {session ? (
            <>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleVote("yes")}
                  className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
                  disabled={voting}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleVote("no")}
                  className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                  disabled={voting}
                >
                  No
                </button>
              </div>
              {voteError && (
                <div className="mt-2 text-yellow-600 font-semibold">{voteError}</div>
              )}
            </>
          ) : (
            <div className="mt-2 text-yellow-600 font-semibold">Sign in to vote!</div>
          )}
          {loadingVotes ? (
            <div className="mt-4 text-gray-500">Loading votes...</div>
          ) : votes && (
            <div className="mt-4">
              <div className="text-lg">Yes: <span className="font-bold">{votes.yes}</span></div>
              <div className="text-lg">No: <span className="font-bold">{votes.no}</span></div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
