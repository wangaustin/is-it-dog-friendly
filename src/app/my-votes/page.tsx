"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import SignInPrompt from "@/components/SignInPrompt";

interface Vote {
  id: number;
  place_id: string;
  place_name: string;
  place_address: string;
  vote_type: "yes" | "no";
  question_type: "dog" | "pet";
  created_at: string;
}

export default function MyVotes() {
  const { data: session, status } = useSession();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<"yes" | "no">("yes");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVotes = async () => {
    if (!session?.user?.email) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/votes/user?email=${encodeURIComponent(session.user.email)}`);
      if (!res.ok) throw new Error("Failed to fetch votes");
      const data = await res.json();
      setVotes(data);
    } catch {
      setError("Failed to load your votes. Please try again later.");
      console.error("Error fetching votes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchVotes();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [session?.user?.email, status]);

  const handleEdit = (vote: Vote) => {
    setEditId(vote.id);
    setEditValue(vote.vote_type);
  };

  const handleEditSave = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/votes/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, vote_type: editValue }),
      });
      if (!res.ok) throw new Error("Failed to update vote");
      setEditId(null);
      await fetchVotes();
    } catch {
      alert("Failed to update vote. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this vote?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/votes/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete vote");
      await fetchVotes();
    } catch {
      alert("Failed to delete vote. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Group votes by place_id
  const groupedVotes = votes.reduce<Record<string, { place_name: string; place_address: string; dog?: Vote; pet?: Vote }>>((acc, vote) => {
    if (!acc[vote.place_id]) {
      acc[vote.place_id] = {
        place_name: vote.place_name,
        place_address: vote.place_address,
      };
    }
    if (vote.question_type === "dog") {
      acc[vote.place_id].dog = vote;
    } else if (vote.question_type === "pet") {
      acc[vote.place_id].pet = vote;
    }
    return acc;
  }, {});

  if (status === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 sm:p-8">
        <div className="text-gray-600 text-lg">Loading...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 sm:p-8">
        <SignInPrompt message="Please sign in to see your voting history." />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8">
      <h1 className="text-4xl font-bold mb-10 text-gray-900">My Votes</h1>
      
      {loading ? (
        <div className="text-gray-600 text-lg">Loading your votes...</div>
      ) : error ? (
        <div className="text-red-600 text-lg">{error}</div>
      ) : votes.length === 0 ? (
        <div className="text-gray-600 text-lg">You haven&apos;t voted on any places yet.</div>
      ) : (
        <div className="w-full max-w-5xl space-y-6 sm:space-y-8">
          {Object.entries(groupedVotes).map(([place_id, { place_name, place_address, dog, pet }]) => (
            <div
              key={place_id}
              className="relative bg-white border border-gray-200 rounded-2xl shadow-xl p-4 sm:p-8 transition-all duration-200 hover:shadow-2xl hover:scale-[1.01]"
            >
              <div className="flex items-center gap-4 mb-3 sm:mb-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                    <a
                      href={`/?place_id=${encodeURIComponent(place_id)}`}
                      className="hover:underline focus:underline outline-none transition-colors hover:text-blue-600"
                    >
                      {place_name}
                    </a>
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base mt-1">{place_address}</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 sm:gap-6 mt-4 sm:mt-6">
                {dog && (
                  <div className="bg-blue-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">🐶</span>
                      <span className="font-semibold text-blue-600 text-base sm:text-lg">Dog-friendly?</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold shrink-0 ${dog.vote_type === "yes" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{dog.vote_type.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 text-xs flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' className='h-3 w-3 inline' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10m-9 4h6m-7 4h8a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z' /></svg>{new Date(dog.created_at).toLocaleDateString()}</span>
                    {editId === dog.id ? (
                      <>
                        <select
                          value={editValue}
                          onChange={e => setEditValue(e.target.value as "yes" | "no")}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20 shrink-0 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                          disabled={actionLoading}
                        >
                          <option value="yes">YES</option>
                          <option value="no">NO</option>
                        </select>
                        <button
                          onClick={() => handleEditSave(dog.id)}
                          className="ml-2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition-colors"
                          disabled={actionLoading}
                          title="Save"
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="ml-2 p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 transition-colors"
                          disabled={actionLoading}
                          title="Cancel"
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(dog)}
                          className="ml-2 p-2 rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-2 focus:ring-yellow-400 transition-colors"
                          disabled={actionLoading}
                          title="Edit"
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13h6m2 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6' /></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(dog.id)}
                          className="ml-2 p-2 rounded-full bg-red-100 text-red-800 hover:bg-red-200 focus:ring-2 focus:ring-red-400 transition-colors"
                          disabled={actionLoading}
                          title="Delete"
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
                        </button>
                      </>
                    )}
                    </div>
                  </div>
                )}
                {pet && (
                  <div className="bg-pink-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">🐾</span>
                      <span className="font-semibold text-pink-600 text-base sm:text-lg">Pet-friendly?</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold shrink-0 ${pet.vote_type === "yes" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{pet.vote_type.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 text-xs flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' className='h-3 w-3 inline' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10m-9 4h6m-7 4h8a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z' /></svg>{new Date(pet.created_at).toLocaleDateString()}</span>
                    {editId === pet.id ? (
                      <>
                        <select
                          value={editValue}
                          onChange={e => setEditValue(e.target.value as "yes" | "no")}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20 shrink-0 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                          disabled={actionLoading}
                        >
                          <option value="yes">YES</option>
                          <option value="no">NO</option>
                        </select>
                        <button
                          onClick={() => handleEditSave(pet.id)}
                          className="ml-2 p-2 rounded-full bg-pink-600 text-white hover:bg-pink-700 focus:ring-2 focus:ring-pink-400 transition-colors"
                          disabled={actionLoading}
                          title="Save"
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="ml-2 p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 transition-colors"
                          disabled={actionLoading}
                          title="Cancel"
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(pet)}
                          className="ml-2 p-2 rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-2 focus:ring-yellow-400 transition-colors"
                          disabled={actionLoading}
                          title="Edit"
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13h6m2 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6' /></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(pet.id)}
                          className="ml-2 p-2 rounded-full bg-red-100 text-red-800 hover:bg-red-200 focus:ring-2 focus:ring-red-400 transition-colors"
                          disabled={actionLoading}
                          title="Delete"
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
                        </button>
                      </>
                    )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
} 