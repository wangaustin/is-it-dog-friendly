import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Is It Pet-Friendly?",
  description: "Vote on whether a place is pet-friendly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <SessionProviderWrapper>
          <NavBar />
          <main className="flex-1 flex flex-col items-center p-8 w-full">
            {children}
            <Analytics />
          </main>
          <footer className="w-full text-center text-gray-400 text-xs py-6 mt-auto border-t bg-white">
            @ Austin Wang
          </footer>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
