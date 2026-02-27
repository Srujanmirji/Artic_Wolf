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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
