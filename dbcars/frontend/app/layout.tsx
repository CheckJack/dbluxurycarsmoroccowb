import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Header from '@/components/Header';
import ConditionalFooter from '@/components/ConditionalFooter';
import CookieBanner from '@/components/CookieBanner';

export const metadata: Metadata = {
  title: 'DB Luxury Cars - Premium Car Rental',
  description: 'Experience luxury car rentals with our premium fleet of vehicles',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <main>{children}</main>
        <ConditionalFooter />
        <CookieBanner />
      </body>
    </html>
  );
}
