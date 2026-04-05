import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Casita",
  description: "Family Chore and Tracker app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Casita",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
