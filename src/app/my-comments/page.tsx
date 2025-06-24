"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import SignInPrompt from "@/components/SignInPrompt";

interface Comment {
  id: number;
  place_id: string;
  place_name: string;
  place_address: string;
  comment_text: string;
  user_email: string;
  display_name: string;
  created_at: string;
}

export default function MyComments() {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const fetchComments = async () => {
    if (!session?.user?.email) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/comments/user");
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      setComments(data);
    } catch {
      setError("Failed to load your comments. Please try again later.");
      console.error("Error fetching comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchComments();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [session?.user?.email, status]);

  // Reset to first page when comments change
  useEffect(() => {
    setCurrentPage(1);
  }, [comments.length]);

  const handleEdit = (comment: Comment) => {
    setEditId(comment.id);
    setEditText(comment.comment_text);
  };

  const handleEditSave = async (id: number) => {
    if (!editText.trim()) return;
    
    setActionLoading(true);
    try {
      const res = await fetch("/api/comments/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, comment_text: editText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update comment");
      setEditId(null);
      setEditText("");
      await fetchComments();
    } catch {
      alert("Failed to update comment. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/comments/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete comment");
      await fetchComments();
    } catch {
      alert("Failed to delete comment. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    setEditId(null);
    setEditText("");
  };

  // Pagination logic
  const totalPages = Math.ceil(comments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentComments = comments.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        <SignInPrompt message="Please sign in to see your comment history." />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8">
      <h1 className="text-4xl font-bold mb-10 text-gray-900">My Comments</h1>
      
      {loading ? (
        <div className="text-gray-600 text-lg">Loading your comments...</div>
      ) : error ? (
        <div className="text-red-600 text-lg">{error}</div>
      ) : comments.length === 0 ? (
        <div className="text-gray-600 text-lg">You haven&apos;t commented on any places yet.</div>
      ) : (
        <>
          <div className="w-full max-w-5xl space-y-6 sm:space-y-8">
            {currentComments.map((comment) => (
              <div
                key={comment.id}
                className="relative bg-white border border-gray-200 rounded-2xl shadow-xl p-4 sm:p-8 transition-all duration-200 hover:shadow-2xl hover:scale-[1.01]"
              >
                <div className="flex items-center gap-4 mb-3 sm:mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                      <a
                        href={`/?place_id=${encodeURIComponent(comment.place_id)}`}
                        className="hover:underline focus:underline outline-none transition-colors hover:text-blue-600"
                      >
                        {comment.place_name}
                      </a>
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base mt-1">{comment.place_address}</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 sm:p-6 w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">💬</span>
                    <span className="font-semibold text-blue-600 text-base sm:text-lg">Your Comment</span>
                    <span className="bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                      <svg xmlns='http://www.w3.org/2000/svg' className='h-3 w-3 inline' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10m-9 4h6m-7 4h8a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z' />
                      </svg>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {editId === comment.id ? (
                    <div className="space-y-4 w-full max-w-full overflow-hidden flex-shrink-0">
                      <div className="w-full max-w-full overflow-hidden flex-shrink-0">
                        <div
                          contentEditable
                          onInput={(e) => setEditText(e.currentTarget.textContent || '')}
                          className="w-full max-w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px] bg-white"
                          style={{ 
                            minWidth: '100%', 
                            width: '100%', 
                            maxWidth: '100%',
                            flexShrink: 0,
                            boxSizing: 'border-box',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'
                          }}
                          suppressContentEditableWarning={true}
                        >
                          {editText}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {editText.length}/1000 characters
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSave(comment.id)}
                            disabled={!editText.trim() || actionLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-gray-700 leading-relaxed break-words">
                        {comment.comment_text}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(comment)}
                          className="p-2 rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-2 focus:ring-yellow-400 transition-colors cursor-pointer"
                          disabled={actionLoading}
                          title="Edit"
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13h6m2 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6' />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="p-2 rounded-full bg-red-100 text-red-800 hover:bg-red-200 focus:ring-2 focus:ring-red-400 transition-colors cursor-pointer"
                          disabled={actionLoading}
                          title="Delete"
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-2">
                {/* Previous button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    const shouldShow = 
                      page === 1 || 
                      page === totalPages || 
                      Math.abs(page - currentPage) <= 1;
                    
                    if (!shouldShow) {
                      // Show ellipsis if there's a gap
                      const prevPage = page - 1;
                      if (prevPage === 1 || Math.abs(prevPage - currentPage) <= 1) {
                        return <span key={`ellipsis-${page}`} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                {/* Next button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Results info */}
          {comments.length > 0 && (
            <div className="mt-4 text-center text-gray-600 text-sm">
              Showing {startIndex + 1}-{Math.min(endIndex, comments.length)} of {comments.length} comments
            </div>
          )}
        </>
      )}
    </main>
  );
} 