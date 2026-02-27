import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ),
  title: {
    default: "Aagam AI | Inventory Intelligence",
    template: "%s | Aagam AI",
  },
  description:
    "Aagam AI helps supply chain teams forecast demand, optimize inventory, and act faster with intelligent recommendations.",
  applicationName: "Aagam AI",
  keywords: [
    "inventory intelligence",
    "demand forecasting",
    "supply chain",
    "inventory optimization",
    "AI recommendations",
  ],
  authors: [{ name: "Aagam AI" }],
  creator: "Aagam AI",
  publisher: "Aagam AI",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Aagam AI",
    title: "Aagam AI | Inventory Intelligence",
    description:
      "Forecast demand, optimize inventory, and drive smarter supply chain decisions.",
    images: [
      {
        url: "/aagam-logo.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aagam AI | Inventory Intelligence",
    description:
      "Forecast demand, optimize inventory, and drive smarter supply chain decisions.",
    images: ["/aagam-logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

import { I18nProvider } from "@/components/I18nProvider";

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e293b" />
        <link rel="apple-touch-icon" href="/aagam-logo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <I18nProvider>
          {children}
        </I18nProvider>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('PWA Service Worker registration successful with scope: ', registration.scope);
                  },
                  function(err) {
                    console.log('PWA Service Worker registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
