"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Create a custom event for resetting search
export const searchResetEvent = new Event('resetSearch');

const menuItems = [
  { label: "Search", href: "/" },
  { label: "My Votes", href: "/my-votes" },
  { label: "My Comments", href: "/my-comments" },
];

export default function NavBar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleNavigation = (href: string) => {
    setMenuOpen(false);
    if (href === "/") {
      router.push("/"); // Always clear query params
      // Use a timeout to ensure navigation happens before reset
      setTimeout(() => {
        window.dispatchEvent(searchResetEvent);
      }, 0);
    } else {
      router.push(href);
    }
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* App Name */}
        <Link href="/" onClick={() => handleNavigation("/")} className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">Is It Pet-Friendly?</Link>
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className="text-gray-700 font-medium transition-all duration-200 hover:text-blue-600 hover:bg-blue-50 rounded-lg px-4 py-2 relative group cursor-pointer"
            >
              <span className="relative z-10">{item.label}</span>
              <span className="absolute inset-0 bg-blue-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
            </button>
          ))}
          {status === "loading" ? null : session ? (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2 border border-gray-200">
              <Link href="/account" className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-1 transition-colors cursor-pointer">
                {session.user?.image && (
                  <Image src={session.user.image} alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full ring-2 ring-white shadow-sm" />
                )}
                <span className="text-gray-700 font-medium text-sm">{session.user?.name || session.user?.email}</span>
              </Link>
              <button onClick={() => signOut()} className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium cursor-pointer">Sign out</button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="flex items-center gap-3 px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 text-gray-700 font-medium cursor-pointer"
            >
              <Image src="/google-logo.svg" alt="Google logo" width={20} height={20} />
              Sign in
            </button>
          )}
        </div>
        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg px-4 py-4">
          <div className="flex flex-col gap-3">
            {menuItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className="text-gray-700 font-medium text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 rounded-lg px-4 py-3 w-full text-left cursor-pointer"
              >
                {item.label}
              </button>
            ))}
            {status === "loading" ? null : session ? (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 mt-2">
                <Link href="/account" className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-1 transition-colors cursor-pointer flex-1">
                  {session.user?.image && (
                    <Image src={session.user.image} alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full ring-2 ring-white shadow-sm" />
                  )}
                  <span className="text-gray-700 font-medium text-sm">{session.user?.name || session.user?.email}</span>
                </Link>
                <button onClick={() => { setMenuOpen(false); signOut(); }} className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium cursor-pointer">Sign out</button>
              </div>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); signIn("google"); }}
                className="flex items-center justify-center gap-3 px-4 py-3 text-sm bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 text-gray-700 font-medium mt-2 w-full cursor-pointer"
              >
                <Image src="/google-logo.svg" alt="Google logo" width={20} height={20} />
                Sign in
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 