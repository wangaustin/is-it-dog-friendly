"use client";
import { useState, useEffect, useCallback } from "react";
import PlaceSearch from "@/components/PlaceSearch";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import SignInPrompt from "@/components/SignInPrompt";

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
      {/* Hero Section: Only show when no place is selected */}
      {!searchParams.get("place_id") && !place && (
        <section className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center py-20 px-8 bg-gradient-to-br from-blue-50 via-white to-blue-100 shadow-2xl mb-10 rounded-2xl">
          <span className="text-5xl md:text-6xl mb-6">🐾</span>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-gray-900 tracking-tight">Is It Pet-Friendly?</h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed">Find and share pet-friendly places in your city!</p>
          <div className="w-full max-w-md mx-auto">
            <PlaceSearch onPlaceSelect={handlePlaceSelect} onReset={resetSearch} />
          </div>
        </section>
      )}
      {/* Show description only if there is no place_id in the URL */}
      {!searchParams.get("place_id") && !place && (
        <div className="relative w-full max-w-4xl mx-auto mt-8 text-center bg-white border border-gray-200 rounded-xl shadow-xl p-10">
          <div className="flex items-center justify-center mb-6">
            <span className="text-4xl mr-3">👋</span>
            <h2 className="text-3xl font-bold text-gray-900">Welcome!</h2>
          </div>
          <div className="space-y-6 text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto">
            <p>
              Search for a place using the bar above to see if it&apos;s <span className="font-semibold text-blue-600">dog- or pet-friendly</span>, view community votes, and add your own vote!
            </p>
          </div>
        </div>
      )}
      {/* Show sign-in prompt if user is not signed in and no place is selected */}
      {!searchParams.get("place_id") && !place && !session && (
        <div className="w-full max-w-2xl mx-auto mt-8 flex justify-center">
          <SignInPrompt message="Sign in to start voting and contributing to the community!" />
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
        <div className="w-full max-w-5xl mx-auto mt-8 px-2 sm:px-8">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl px-4 sm:px-6 py-4 sm:py-6 w-full sm:max-w-2xl">
              <div className="text-2xl sm:text-3xl font-bold mb-3 text-center text-gray-900">{place.displayName.text}</div>
              <div className="flex items-center justify-center text-gray-600 text-sm sm:text-base mt-2">
                <Image src="/address.svg" alt="Address" width={16} height={16} className="mr-1" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.formattedAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-blue-600 cursor-pointer transition-colors text-center"
                  title="Open in Maps"
                >
                  {place.formattedAddress}
                </a>
              </div>
              {place.nationalPhoneNumber && (
                <div className="flex items-center justify-center text-gray-600 text-sm sm:text-base mt-2">
                  <Image src="/phone.svg" alt="Phone" width={16} height={16} className="mr-1" />
                  <a
                    href={`tel:${place.nationalPhoneNumber.replace(/[^\d+]/g, "")}`}
                    className="hover:underline hover:text-blue-600 cursor-pointer transition-colors"
                    title="Call this place"
                  >
                    {place.nationalPhoneNumber}
                  </a>
                </div>
              )}
              {place.types && place.types.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {place.types?.map((type) => (
                    <span key={type} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium uppercase tracking-wide border border-blue-200">
                      {type.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {!session && (
            <div className="mb-6">
              <SignInPrompt message="Please sign in to vote, edit, or delete your votes." />
            </div>
          )}
          {/* Dog-friendly question */}
          <div className="mb-8">
            <div className="text-xl sm:text-2xl font-bold mb-6 bg-blue-50 py-3 sm:py-4 px-4 sm:px-6 rounded-xl border border-blue-200">
              Is it dog-friendly?
            </div>
            {session && userVotes.dog && !dogEditMode ? (
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className={`font-medium text-sm ${userVotes.dog.vote_type === 'yes' ? 'text-green-600' : 'text-red-600'}`}>You voted: {userVotes.dog.vote_type.toUpperCase()}</div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDogEditMode(true)}
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVote('dog', userVotes.dog!.id)}
                    className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
                    disabled={actionLoading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : session && userVotes.dog && dogEditMode ? (
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setDogEditValue('yes')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${dogEditValue === 'yes' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    disabled={actionLoading}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDogEditValue('no')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${dogEditValue === 'no' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    disabled={actionLoading}
                  >
                    No
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEditVote('dog', userVotes.dog!.id, dogEditValue)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setDogEditMode(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => session && handleVote("yes", "dog")}
                    className="px-8 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 shadow-md"
                    disabled={dogVoting || !session}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => session && handleVote("no", "dog")}
                    className="px-8 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 shadow-md"
                    disabled={dogVoting || !session}
                  >
                    No
                  </button>
                </div>
              </div>
            )}
            {dogVoteError && (
              <div className="mt-3 text-yellow-600 font-semibold text-center">{dogVoteError}</div>
            )}
            {loadingVotes ? (
              <div className="mt-6 text-gray-500 text-center">Loading votes...</div>
            ) : dogVotes && (
              <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-lg p-4 sm:p-6 max-w-md mx-auto">
                <div className="text-center text-lg mb-2">Community Votes</div>
                <div className="flex justify-center gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{dogVotes.yes}</div>
                    <div className="text-sm text-gray-600">Yes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{dogVotes.no}</div>
                    <div className="text-sm text-gray-600">No</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Pet-friendly (excluding dogs) question */}
          <div>
            <div className="text-xl sm:text-2xl font-bold mb-6 bg-pink-50 py-3 sm:py-4 px-4 sm:px-6 rounded-xl border border-pink-200">
              Is it pet-friendly (excluding dogs)?
            </div>
            {session && userVotes.pet && !petEditMode ? (
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className={`font-medium text-sm ${userVotes.pet.vote_type === 'yes' ? 'text-green-600' : 'text-red-600'}`}>You voted: {userVotes.pet.vote_type.toUpperCase()}</div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPetEditMode(true)}
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVote('pet', userVotes.pet!.id)}
                    className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
                    disabled={actionLoading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : session && userVotes.pet && petEditMode ? (
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setPetEditValue('yes')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${petEditValue === 'yes' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    disabled={actionLoading}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setPetEditValue('no')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${petEditValue === 'no' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    disabled={actionLoading}
                  >
                    No
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEditVote('pet', userVotes.pet!.id, petEditValue)}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm font-medium transition-colors disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setPetEditMode(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => session && handleVote("yes", "pet")}
                    className="px-8 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 shadow-md"
                    disabled={petVoting || !session}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => session && handleVote("no", "pet")}
                    className="px-8 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 shadow-md"
                    disabled={petVoting || !session}
                  >
                    No
                  </button>
                </div>
              </div>
            )}
            {petVoteError && (
              <div className="mt-3 text-yellow-600 font-semibold text-center">{petVoteError}</div>
            )}
            {loadingVotes ? (
              <div className="mt-6 text-gray-500 text-center">Loading votes...</div>
            ) : petVotes && (
              <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-lg p-4 sm:p-6 max-w-md mx-auto">
                <div className="text-center text-lg mb-2">Community Votes</div>
                <div className="flex justify-center gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{petVotes.yes}</div>
                    <div className="text-sm text-gray-600">Yes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{petVotes.no}</div>
                    <div className="text-sm text-gray-600">No</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 