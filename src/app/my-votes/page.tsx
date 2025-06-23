"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

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

  if (status === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center p-8">
        <div className="text-gray-600">Loading...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center p-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to View Your Votes</h2>
          <p className="text-gray-600 mb-6">Please sign in to see your voting history.</p>
          <button
            onClick={() => signIn("google")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded shadow hover:shadow-md transition text-gray-700 font-medium mx-auto"
          >
            <img src="/google-logo.svg" alt="Google logo" width={20} height={20} />
            <span>Sign in with Google</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">My Votes</h1>
      
      {loading ? (
        <div className="text-gray-600">Loading your votes...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : votes.length === 0 ? (
        <div className="text-gray-600">You haven&apos;t voted on any places yet.</div>
      ) : (
        <div className="w-full max-w-3xl space-y-4">
          {votes.map((vote) => (
            <div
              key={vote.id}
              className="bg-white rounded-lg shadow-md p-6 transition hover:shadow-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">
                    <a
                      href={`/?place_id=${encodeURIComponent(vote.place_id)}`}
                      className="text-blue-700 hover:underline cursor-pointer"
                    >
                      {vote.place_name}
                    </a>
                  </h3>
                  <p className="text-gray-600 mt-1">{vote.place_address}</p>
                </div>
                {editId === vote.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={editValue}
                      onChange={e => setEditValue(e.target.value as "yes" | "no")}
                      className="border rounded px-2 py-1"
                      disabled={actionLoading}
                    >
                      <option value="yes">YES</option>
                      <option value="no">NO</option>
                    </select>
                    <button
                      onClick={() => handleEditSave(vote.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      disabled={actionLoading}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      disabled={actionLoading}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(vote)}
                      className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                      disabled={actionLoading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vote.id)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                      disabled={actionLoading}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-blue-600">
                    {vote.question_type === "dog" ? "Dog-friendly?" : "Pet-friendly? (excluding dogs)"}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    vote.vote_type === "yes"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {vote.vote_type.toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-400 text-xs ml-1">
                  {new Date(vote.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
} 