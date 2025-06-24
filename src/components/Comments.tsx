"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Comment {
  id: number;
  place_id: string;
  comment_text: string;
  user_email: string;
  display_name: string;
  created_at: string;
  isOwnComment: boolean;
}

interface CommentsProps {
  placeId: string;
  placeName: string;
  placeAddress: string;
}

export default function Comments({ placeId, placeName, placeAddress }: CommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!placeId) return;
    
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/comments?place_id=${encodeURIComponent(placeId)}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      setComments(data);
    } catch {
      setError("Failed to load comments. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  // Fetch comments
  useEffect(() => {
    if (placeId) {
      fetchComments();
    }
  }, [placeId, fetchComments]);

  // Submit new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: placeId,
          place_name: placeName,
          place_address: placeAddress,
          comment_text: newComment.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to create comment");

      setNewComment("");
      await fetchComments();
    } catch {
      alert("Failed to create comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit comment
  const handleEditComment = async (id: number) => {
    if (!editText.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/comments/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, comment_text: editText.trim() }),
      });

      if (!res.ok) throw new Error("Failed to update comment");

      setEditingId(null);
      setEditText("");
      await fetchComments();
    } catch {
      alert("Failed to update comment. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (id: number) => {
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

  // Start editing
  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.comment_text);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <h3 className="text-xl font-bold mb-4 text-gray-900">Comments</h3>
      
      {/* Comment form for signed-in users */}
      {session ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-full max-w-full overflow-hidden">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience with this place..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={1000}
              disabled={submitting}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-gray-500">
                {newComment.length}/1000 characters
              </span>
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-gray-600">Please sign in to leave a comment.</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="text-center text-gray-500">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No comments yet. Be the first to share your experience!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-full max-w-full overflow-hidden">
              {editingId === comment.id ? (
                // Edit mode
                <div className="w-full max-w-full overflow-hidden">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    maxLength={1000}
                    disabled={actionLoading}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm text-gray-500">
                      {editText.length}/1000 characters
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editText.trim() || actionLoading}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={actionLoading}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Display mode
                <div className="w-full max-w-full overflow-hidden">
                  <div className="flex justify-between items-start mb-2 w-full">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-medium text-gray-900 truncate">
                        {comment.display_name}
                      </span>
                      <span className="text-sm text-gray-500 flex-shrink-0">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {comment.isOwnComment && (
                      <div className="flex gap-2 flex-shrink-0 ml-2">
                        <button
                          onClick={() => startEdit(comment)}
                          disabled={actionLoading}
                          className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13h6m2 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={actionLoading}
                          className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="w-full max-w-full overflow-hidden">
                    <p className="text-gray-700 leading-relaxed break-words">
                      {comment.comment_text}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 