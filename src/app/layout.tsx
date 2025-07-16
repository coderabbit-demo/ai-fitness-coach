import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PWAProvider } from "@/components/providers/PWAProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Fitness Coach - Calorie Tracker",
  description: "Smart calorie tracking with AI photo analysis",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Calorie Tracker",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "AI Calorie Tracker",
    title: "AI Fitness Coach - Calorie Tracker",
    description: "Smart calorie tracking with AI photo analysis",
  },
  twitter: {
    card: "summary",
    title: "AI Fitness Coach - Calorie Tracker",
    description: "Smart calorie tracking with AI photo analysis",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWAProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </PWAProvider>
      </body>
    </html>
  );
}
