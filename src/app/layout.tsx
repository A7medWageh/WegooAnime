import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wego Anime - Watch Anime Online Free",
  description: "Watch thousands of anime series and movies in HD quality with subtitles on Wego Anime. Your ultimate destination for anime streaming.",
  keywords: ["anime", "streaming", "watch anime", "anime online", "free anime", "subbed anime", "wego anime"],
  authors: [{ name: "Wego Anime Team" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "Wego Anime - Watch Anime Online",
    description: "Your ultimate destination for anime streaming on Wego Anime",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wego Anime - Watch Anime Online",
    description: "Your ultimate destination for anime streaming on Wego Anime",
  },
};

import { FavoritesProvider } from "@/context/FavoritesContext";
import { HistoryProvider } from "@/context/HistoryContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f0f0f] text-white overflow-x-hidden`}
      >
        <div className="bg-pattern-logo" />
        <div className="relative z-10 flex flex-col min-h-screen">
          <HistoryProvider>
            <FavoritesProvider>
              {children}
              <Toaster />
            </FavoritesProvider>
          </HistoryProvider>
        </div>
      </body>
    </html>
  );
}
