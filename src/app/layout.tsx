import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Casita",
  description: "Family Chore and Tracker app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden touch-pan-y touch-pan-x">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
