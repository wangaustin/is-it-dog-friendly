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
  const [dogVotes, setDogVotes] = useState<{ yes: number; no: number } | null>(null);
  const [petVotes, setPetVotes] = useState<{ yes: number; no: number } | null>(null);
  const [loadingVotes, setLoadingVotes] = useState(false);
  const [dogVoteError, setDogVoteError] = useState<string | null>(null);
  const [petVoteError, setPetVoteError] = useState<string | null>(null);
  const [dogVoting, setDogVoting] = useState(false);
  const [petVoting, setPetVoting] = useState(false);

  useEffect(() => {
    if (!place) {
      setDogVotes(null);
      setPetVotes(null);
      setDogVoteError(null);
      setPetVoteError(null);
      return;
    }
    const fetchVotes = async () => {
      setLoadingVotes(true);
      const res = await fetch(`/api/votes?place_id=${encodeURIComponent(place.id)}`);
      const data = await res.json();
      setDogVotes(data.dog);
      setPetVotes(data.pet);
      setLoadingVotes(false);
    };
    fetchVotes();
    setDogVoteError(null);
    setPetVoteError(null);
  }, [place]);

  const handleVote = async (vote: "yes" | "no", questionType: "dog" | "pet") => {
    if (!place || !session?.user?.email) return;
    if (questionType === "dog") setDogVoting(true);
    if (questionType === "pet") setPetVoting(true);
    if (questionType === "dog") setDogVoteError(null);
    if (questionType === "pet") setPetVoteError(null);
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        place_id: place.id,
        place_name: place.displayName.text,
        place_address: place.formattedAddress,
        vote_type: vote,
        user_email: session.user.email,
        question_type: questionType,
      }),
    });
    if (questionType === "dog") setDogVoting(false);
    if (questionType === "pet") setPetVoting(false);
    if (res.status === 409) {
      if (questionType === "dog") setDogVoteError("You have already voted for this question at this place.");
      if (questionType === "pet") setPetVoteError("You have already voted for this question at this place.");
      return;
    }
    if (!res.ok) {
      if (questionType === "dog") setDogVoteError("An error occurred. Please try again.");
      if (questionType === "pet") setPetVoteError("An error occurred. Please try again.");
      return;
    }
    // Refresh votes
    const votesRes = await fetch(`/api/votes?place_id=${encodeURIComponent(place.id)}`);
    const votesData = await votesRes.json();
    setDogVotes(votesData.dog);
    setPetVotes(votesData.pet);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Is It Pet-Friendly?</h1>
      <div className="mb-4 w-full flex justify-center">
        {status === "loading" ? (
          <span>Loading...</span>
        ) : session ? (
          <>
            <span className="mr-4">Welcome, {session.user?.name || session.user?.email}!</span>
            <button onClick={() => signOut()} className="text-blue-600 underline">Sign out</button>
          </>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded shadow hover:shadow-md transition text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ minWidth: 200 }}
          >
            <img src="/google-logo.svg" alt="Google logo" width={20} height={20} className="inline-block" />
            <span>Sign in with Google</span>
          </button>
        )}
      </div>
      <PlaceSearch onPlaceSelect={setPlace} />
      {place && (
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold">{place.displayName.text}</h2>
          <p className="mb-4">{place.formattedAddress}</p>
          {!session && (
            <div className="mb-4 text-yellow-600 font-semibold">Sign in to vote!</div>
          )}
          {/* Dog-friendly question */}
          <div className="mb-6">
            <div className="font-semibold mb-2">Is it <span className="text-blue-700">dog-friendly</span>?</div>
            {session && (
              <div className="flex justify-center gap-4 mb-2">
                <button
                  onClick={() => handleVote("yes", "dog")}
                  className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
                  disabled={dogVoting}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleVote("no", "dog")}
                  className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                  disabled={dogVoting}
                >
                  No
                </button>
              </div>
            )}
            {dogVoteError && (
              <div className="mt-2 text-yellow-600 font-semibold">{dogVoteError}</div>
            )}
            {loadingVotes ? (
              <div className="mt-4 text-gray-500">Loading votes...</div>
            ) : dogVotes && (
              <div className="mt-4">
                <div className="text-lg">Yes: <span className="font-bold">{dogVotes.yes}</span></div>
                <div className="text-lg">No: <span className="font-bold">{dogVotes.no}</span></div>
              </div>
            )}
          </div>
          {/* Pet-friendly (excluding dogs) question */}
          <div>
            <div className="font-semibold mb-2">Is it <span className="text-blue-700">pet-friendly (excluding dogs)</span>?</div>
            {session && (
              <div className="flex justify-center gap-4 mb-2">
                <button
                  onClick={() => handleVote("yes", "pet")}
                  className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
                  disabled={petVoting}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleVote("no", "pet")}
                  className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                  disabled={petVoting}
                >
                  No
                </button>
              </div>
            )}
            {petVoteError && (
              <div className="mt-2 text-yellow-600 font-semibold">{petVoteError}</div>
            )}
            {loadingVotes ? (
              <div className="mt-4 text-gray-500">Loading votes...</div>
            ) : petVotes && (
              <div className="mt-4">
                <div className="text-lg">Yes: <span className="font-bold">{petVotes.yes}</span></div>
                <div className="text-lg">No: <span className="font-bold">{petVotes.no}</span></div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
