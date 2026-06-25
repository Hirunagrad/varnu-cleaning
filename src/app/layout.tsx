import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { getCurrentUser } from "@/app/actions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Roommate Schedule",
  description: "Roommate Cleaning Schedule App",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cleaning",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-gray-50 text-gray-900 pb-20" suppressHydrationWarning>
        <main className="max-w-md mx-auto min-h-screen bg-white shadow-xl overflow-hidden relative">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
