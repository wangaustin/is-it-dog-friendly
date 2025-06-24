"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface UserProfile {
  display_name: string;
  email: string;
  created_at?: string;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch user profile
  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setDisplayName(data.display_name);
      }
    } catch {
      setError("Failed to load profile");
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError("Display name cannot be empty");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setSuccess("Display name updated successfully!");
        setIsEditing(false);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to update display name");
      }
    } catch {
      setError("Failed to update display name");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(profile?.display_name || "");
    setIsEditing(false);
    setError("");
  };

  if (status === "loading") {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>
        
        {/* Profile Section */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 sm:gap-6">
            {session.user?.image && (
              <Image 
                src={session.user.image} 
                alt="Profile" 
                width={80}
                height={80}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-2 ring-gray-200"
              />
            )}
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {session.user?.name || session.user?.email}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">{session.user?.email}</p>
            </div>
          </div>

          {/* Display Name Section */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="text-lg sm:text-xl font-medium text-gray-900">Display Name</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-3">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="Enter your display name"
                    maxLength={50}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {displayName.length}/50 characters
                  </p>
                </div>
                
                {error && (
                  <div className="p-4 bg-red-100 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="p-4 bg-green-100 border border-green-200 rounded-lg text-green-700">
                    {success}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-lg">
                <span className="text-gray-900 font-medium text-base sm:text-lg">
                  {profile?.display_name || "Not set"}
                </span>
              </div>
            )}
          </div>

          {/* Account Info */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-6">Account Information</h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="text-gray-900 break-all">{session.user?.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-gray-600 font-medium">Account Created:</span>
                <span className="text-gray-900">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 