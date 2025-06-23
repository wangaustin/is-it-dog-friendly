"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

// Create a custom event for resetting search
export const searchResetEvent = new Event('resetSearch');

const menuItems = [
  { label: "Search", href: "/" },
  { label: "My Votes", href: "/my-votes" },
];

export default function NavBar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (href: string) => {
    setMenuOpen(false);
    if (href === "/" && pathname === "/") {
      // If we're already on the home page, dispatch the reset event
      window.dispatchEvent(searchResetEvent);
    } else {
      router.push(href);
    }
  };

  return (
    <nav className="w-full bg-white border-b shadow-sm">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-16">
        {/* App Name */}
        <Link href="/" onClick={() => handleNavigation("/")} className="text-xl font-bold text-blue-700">Is It Pet-Friendly?</Link>
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              {item.label}
            </button>
          ))}
          {status === "loading" ? null : session ? (
            <div className="flex items-center gap-2">
              {session.user?.image && (
                <Image src={session.user.image} alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full" />
              )}
              <span className="text-gray-700">{session.user?.name || session.user?.email}</span>
              <button onClick={() => signOut()} className="ml-2 px-3 py-1 text-sm bg-gray-100 border rounded hover:bg-gray-200">Sign out</button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-white border rounded shadow hover:shadow-md transition text-gray-700 font-medium"
            >
              <Image src="/google-logo.svg" alt="Google logo" width={18} height={18} />
              Sign in
            </button>
          )}
        </div>
        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex items-center p-2 focus:outline-none"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t shadow-sm px-4 pb-4">
          <div className="flex flex-col gap-4 mt-2">
            {menuItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className="text-gray-700 hover:text-blue-600 font-medium text-left"
              >
                {item.label}
              </button>
            ))}
            {status === "loading" ? null : session ? (
              <div className="flex items-center gap-2 mt-2">
                {session.user?.image && (
                  <Image src={session.user.image} alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full" />
                )}
                <span className="text-gray-700">{session.user?.name || session.user?.email}</span>
                <button onClick={() => { setMenuOpen(false); signOut(); }} className="ml-2 px-3 py-1 text-sm bg-gray-100 border rounded hover:bg-gray-200">Sign out</button>
              </div>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); signIn("google"); }}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-white border rounded shadow hover:shadow-md transition text-gray-700 font-medium mt-2"
              >
                <Image src="/google-logo.svg" alt="Google logo" width={18} height={18} />
                Sign in
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 