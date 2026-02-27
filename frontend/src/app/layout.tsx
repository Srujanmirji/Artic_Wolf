import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Aagam AI',
  description: 'Intelligent Inventory Forecasting and Optimization Engine',
  manifest: '/manifest.json',
  themeColor: '#ffffff',
  viewport: 'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png"></link>
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
