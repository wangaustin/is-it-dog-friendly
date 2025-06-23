"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";

export default function SignInPrompt({ message = "Sign in to continue" }: { message?: string }) {
  return (
    <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl shadow-xl p-8 text-center">
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-4xl">🔐</span>
          <h2 className="text-3xl font-bold text-gray-900">Sign in Required</h2>
        </div>
      </div>
      <p className="text-gray-700 mb-8 text-lg leading-relaxed">{message}</p>
      <button
        onClick={() => signIn("google")}
        className="flex items-center justify-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-gray-700 font-semibold mx-auto hover:bg-gray-50"
      >
        <Image src="/google-logo.svg" alt="Google logo" width={24} height={24} />
        <span>Sign in with Google</span>
      </button>
    </div>
  );
} 