"use client";
import { useState, useEffect, useCallback } from "react";
import PlaceSearch from "@/components/PlaceSearch";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

interface Place {
  id: string;
  displayName: {
    text: string;
  };
  formattedAddress: string;
  types?: string[];
  nationalPhoneNumber?: string;
}

export default function HomeContent() {
  const { data: session } = useSession();
  const [place, setPlace] = useState<Place | null>(null);
  const [dogVotes, setDogVotes] = useState<{ yes: number; no: number } | null>(null);
  const [petVotes, setPetVotes] = useState<{ yes: number; no: number } | null>(null);
  const [loadingVotes, setLoadingVotes] = useState(false);
  const [dogVoteError, setDogVoteError] = useState<string | null>(null);
  const [petVoteError, setPetVoteError] = useState<string | null>(null);
  const [dogVoting, setDogVoting] = useState(false);
  const [petVoting, setPetVoting] = useState(false);
  const [dogEditMode, setDogEditMode] = useState(false);
  const [petEditMode, setPetEditMode] = useState(false);
  const [dogEditValue, setDogEditValue] = useState<'yes' | 'no'>('yes');
  const [petEditValue, setPetEditValue] = useState<'yes' | 'no'>('yes');
  const [actionLoading, setActionLoading] = useState(false);
  const [userVotes, setUserVotes] = useState<{ dog: { vote_type: 'yes' | 'no'; id: number } | null; pet: { vote_type: 'yes' | 'no'; id: number } | null }>({ dog: null, pet: null });

  const searchParams = useSearchParams();
  const router = useRouter();

  // Reset function to clear all state
  const resetSearch = useCallback(() => {
    setPlace(null);
    setDogVotes(null);
    setPetVotes(null);
    setDogVoteError(null);
    setPetVoteError(null);
  }, []);

  // Listen for reset event
  useEffect(() => {
    window.addEventListener('resetSearch', resetSearch);
    return () => window.removeEventListener('resetSearch', resetSearch);
  }, [resetSearch]);

  // If place_id is in the URL, fetch and display that place
  useEffect(() => {
    const placeId = searchParams.get("place_id");
    if (placeId) {
      (async () => {
        const res = await fetch(`/api/places/${placeId}`);
        if (res.ok) {
          const placeDetails = await res.json();
          setPlace(placeDetails);
        } 
      })();
    }
  }, [searchParams]);

  useEffect(() => {
    if (!place) {
      setDogVotes(null);
      setPetVotes(null);
      setDogVoteError(null);
      setPetVoteError(null);
      setUserVotes({ dog: null, pet: null });
      return;
    }
    const fetchVotes = async () => {
      setLoadingVotes(true);
      const res = await fetch(`/api/votes?place_id=${encodeURIComponent(place.id)}`);
      const data = await res.json();
      setDogVotes(data.dog);
      setPetVotes(data.pet);
      setDogEditMode(false);
      setPetEditMode(false);
      setUserVotes(data.userVotes);
      if (data.userVotes?.dog) setDogEditValue(data.userVotes.dog.vote_type);
      if (data.userVotes?.pet) setPetEditValue(data.userVotes.pet.vote_type);
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
    setUserVotes(votesData.userVotes);
  };

  // Edit vote handlers
  const handleEditVote = async (questionType: 'dog' | 'pet', voteId: number, newValue: 'yes' | 'no') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/votes/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: voteId, vote_type: newValue }),
      });
      if (!res.ok) throw new Error('Failed to update vote');
      if (questionType === 'dog') setDogEditMode(false);
      if (questionType === 'pet') setPetEditMode(false);
      // Refresh votes
      const votesRes = await fetch(`/api/votes?place_id=${encodeURIComponent(place!.id)}`);
      const votesData = await votesRes.json();
      setDogVotes(votesData.dog);
      setPetVotes(votesData.pet);
      if (votesData.userVotes?.dog) setDogEditValue(votesData.userVotes.dog.vote_type);
      if (votesData.userVotes?.pet) setPetEditValue(votesData.userVotes.pet.vote_type);
      // Update userVotes state with the new vote value
      setUserVotes(votesData.userVotes);
    } catch {
      alert('Failed to update vote. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete vote handler
  const handleDeleteVote = async (questionType: 'dog' | 'pet', voteId: number) => {
    if (!window.confirm('Are you sure you want to delete your vote?')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/votes/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: voteId }),
      });
      if (!res.ok) throw new Error('Failed to delete vote');
      // Refresh votes
      const votesRes = await fetch(`/api/votes?place_id=${encodeURIComponent(place!.id)}`);
      const votesData = await votesRes.json();
      setDogVotes(votesData.dog);
      setPetVotes(votesData.pet);
      setUserVotes(votesData.userVotes);
    } catch {
      alert('Failed to delete vote. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Custom place select handler to prevent description flash
  const handlePlaceSelect = (placeDetails: Place) => {
    // Only update the URL with the new place_id
    router.push(`/?place_id=${encodeURIComponent(placeDetails.id)}`);
  };

  return (
    <>
      <h1 className="text-4xl font-bold mb-8">Is It Pet-Friendly?</h1>
      <PlaceSearch onPlaceSelect={handlePlaceSelect} onReset={resetSearch} />
      {/* Show description only if there is no place_id in the URL */}
      {!searchParams.get("place_id") && !place && (
        <div className="max-w-xl mx-auto mt-8 text-center text-gray-600 text-base bg-white/80 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
          <p>
            Search for a place using the bar above to see if it&apos;s dog- or pet-friendly, view community votes, and add your own vote!<br/>
            <br/>
            Sign in to vote, edit, or delete your votes. Click on a place to see details, vote counts, and more information like address, phone, and place type labels.
          </p>
        </div>
      )}
      {/* Show loading spinner if place_id exists but place is not loaded or mismatched */}
      {searchParams.get("place_id") && (!place || place.id !== searchParams.get("place_id")) && (
        <div className="flex justify-center items-center mt-12 text-gray-400">
          <svg className="animate-spin h-6 w-6 mr-2 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
          Loading place details...
        </div>
      )}
      {place && (
        <div className="mt-8 text-center">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-white shadow-md rounded-lg px-6 py-4 w-full max-w-md">
              <div className="text-2xl font-bold mb-1 text-center">{place.displayName.text}</div>
              <div className="flex items-center justify-center text-gray-500 text-sm mt-1">
                <Image src="/address.svg" alt="Address" width={16} height={16} className="mr-1" />
                {place.formattedAddress}
              </div>
              {place.nationalPhoneNumber && (
                <div className="flex items-center justify-center text-gray-700 text-sm mt-1">
                  <Image src="/phone.svg" alt="Phone" width={16} height={16} className="mr-1" />
                  <span>{place.nationalPhoneNumber}</span>
                </div>
              )}
              {place.types && place.types.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {place.types?.map((type) => (
                    <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium uppercase tracking-wide">
                      {type.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {!session && (
            <div className="mb-4 text-yellow-700 font-semibold">Please sign in to vote.</div>
          )}
          {/* Dog-friendly question */}
          <div className="mb-6">
            <div className="text-xl font-bold mb-4 bg-gray-50 py-3 px-4 rounded-lg shadow-sm">
              Is it dog-friendly?
            </div>
            {session && userVotes.dog && !dogEditMode ? (
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className={`font-semibold ${userVotes.dog.vote_type === 'yes' ? 'text-green-700' : 'text-red-700'}`}>You have already voted: {userVotes.dog.vote_type.toUpperCase()}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDogEditMode(true)}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVote('dog', userVotes.dog!.id)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
                    disabled={actionLoading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : session && userVotes.dog && dogEditMode ? (
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setDogEditValue('yes')}
                    className={`px-4 py-2 rounded ${dogEditValue === 'yes' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    disabled={actionLoading}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDogEditValue('no')}
                    className={`px-4 py-2 rounded ${dogEditValue === 'no' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    disabled={actionLoading}
                  >
                    No
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditVote('dog', userVotes.dog!.id, dogEditValue)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setDogEditMode(false)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="flex justify-center gap-4 mb-2">
                  <button
                    onClick={() => session && handleVote("yes", "dog")}
                    className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
                    disabled={dogVoting || !session}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => session && handleVote("no", "dog")}
                    className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                    disabled={dogVoting || !session}
                  >
                    No
                  </button>
                </div>
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
            <div className="text-xl font-bold mb-4 bg-gray-50 py-3 px-4 rounded-lg shadow-sm">
              Is it pet-friendly (excluding dogs)?
            </div>
            {session && userVotes.pet && !petEditMode ? (
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className={`font-semibold ${userVotes.pet.vote_type === 'yes' ? 'text-green-700' : 'text-red-700'}`}>You have already voted: {userVotes.pet.vote_type.toUpperCase()}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPetEditMode(true)}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVote('pet', userVotes.pet!.id)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
                    disabled={actionLoading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : session && userVotes.pet && petEditMode ? (
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPetEditValue('yes')}
                    className={`px-4 py-2 rounded ${petEditValue === 'yes' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    disabled={actionLoading}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setPetEditValue('no')}
                    className={`px-4 py-2 rounded ${petEditValue === 'no' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    disabled={actionLoading}
                  >
                    No
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditVote('pet', userVotes.pet!.id, petEditValue)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setPetEditMode(false)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="flex justify-center gap-4 mb-2">
                  <button
                    onClick={() => session && handleVote("yes", "pet")}
                    className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
                    disabled={petVoting || !session}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => session && handleVote("no", "pet")}
                    className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                    disabled={petVoting || !session}
                  >
                    No
                  </button>
                </div>
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
    </>
  );
} 