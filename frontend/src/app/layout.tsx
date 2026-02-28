import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const siteUrl =
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.aagam.pro";

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
const verificationOther: Record<string, string> = {};
if (bingVerification) {
  verificationOther["msvalidate.01"] = bingVerification;
}

const verification =
  googleVerification || Object.keys(verificationOther).length > 0
    ? {
      ...(googleVerification ? { google: googleVerification } : {}),
      ...(Object.keys(verificationOther).length > 0
        ? { other: verificationOther }
        : {}),
    }
    : undefined;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aagam AI | Inventory Intelligence",
    template: "%s | Aagam AI",
  },
  description:
    "Aagam AI helps supply chain teams forecast demand, optimize inventory, and act faster with intelligent recommendations.",
  applicationName: "Aagam AI",
  category: "Technology",
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
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  themeColor: "#11212D",
  robots: {
    index: true,
    follow: true,
  },
  verification,
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
        url: "/opengraph-image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aagam AI | Inventory Intelligence",
    description:
      "Forecast demand, optimize inventory, and drive smarter supply chain decisions.",
    images: ["/twitter-image"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/aagam-logo.png",
  },
};

import { I18nProvider } from "@/components/I18nProvider";
import { ReactQueryProvider } from "@/components/ReactQueryProvider";
import { GoogleAuthProviderWrapper } from "@/components/GoogleAuthProvider";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}#organization`,
        name: "Aagam AI",
        url: siteUrl,
        logo: `${siteUrl}/aagam-logo.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: "Aagam AI",
        publisher: {
          "@id": `${siteUrl}#organization`,
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "Aagam AI",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: siteUrl,
        description:
          "Aagam AI helps supply chain teams forecast demand, optimize inventory, and act faster with intelligent recommendations.",
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#11212D" />
        <link rel="apple-touch-icon" href="/aagam-logo.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <I18nProvider>
          <GoogleAuthProviderWrapper>
            <ReactQueryProvider>
              {children}
            </ReactQueryProvider>
          </GoogleAuthProviderWrapper>
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
