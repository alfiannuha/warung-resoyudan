import { Hanken_Grotesk } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/shared/toast-provider";
import FirestoreProvider from "@/components/shared/firestore-provider";
import SyncStatus from "@/components/shared/sync-status";
import { SerwistProvider } from "@serwist/turbopack/react";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
});

const APP_NAME = "Warung Resoyudan";
const APP_DEFAULT_TITLE = "Warung Resoyudan";
const APP_DESCRIPTION = "Aplikasi kasir dan pembukuan sederhana untuk warung kecil.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: "%s - Warung Resoyudan",
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: "%s - Warung Resoyudan",
    },
    description: APP_DESCRIPTION,
    images: "/icons/logo_warung_resoyudan.png",
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: "%s - Warung Resoyudan",
    },
    description: APP_DESCRIPTION,
    images: "/icons/logo_warung_resoyudan.png",
  },
  icons: {
    icon: [
      { url: "/icons/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon_io/favicon.ico", sizes: "48x48" },
    ],
    apple: [
      { url: "/icons/favicon_io/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
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
    <html lang="id" className={`h-full antialiased ${hanken.className}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        <SerwistProvider swUrl="/serwist/sw.js">
          <ToastProvider>
            <FirestoreProvider>
              {children}
              <SyncStatus />
            </FirestoreProvider>
          </ToastProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
