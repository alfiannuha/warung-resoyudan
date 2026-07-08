import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/shared/toast-provider";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`h-full antialiased ${hanken.className}`} suppressHydrationWarning>
      <head>
        <title>Warung Resoyudan</title>
        <meta name="description" content="Aplikasi kasir dan pembukuan sederhana untuk warung kecil." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#0F172A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
