"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";

export default function SignInPrompt({ message = "Sign in to continue" }: { message?: string }) {
  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
      <h2 className="text-xl font-bold mb-4">Sign in Required</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      <button
        onClick={() => signIn("google")}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded shadow hover:shadow-md transition text-gray-700 font-medium mx-auto"
      >
        <Image src="/google-logo.svg" alt="Google logo" width={20} height={20} />
        <span>Sign in with Google</span>
      </button>
    </div>
  );
} 