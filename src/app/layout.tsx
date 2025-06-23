import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Is It Dog-Friendly?",
  description: "Vote on whether a place is dog-friendly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
