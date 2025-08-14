import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { Providers } from "./providers";
import Header from '@/components/Header';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zen Flow",
  description: "A social media app for sharing your thoughts.",
  icons: {
    icon: '/zenlogo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-primary-bg text-primary-text`}
      >
        <Providers>
          <Header />
          <main className="container mx-auto p-4">
            {children}
          </main>
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
