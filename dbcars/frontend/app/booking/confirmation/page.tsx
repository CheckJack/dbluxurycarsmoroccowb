'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getBooking } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

function BookingConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingNumber = searchParams.get('bookingNumber');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getImageUrl = useMemo(
    () => (url: string | null) => {
      if (!url) return null;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const baseUrl = apiUrl.replace('/api', '');
      return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    },
    []
  );

  useEffect(() => {
    if (bookingNumber) {
      loadBooking();
    }
  }, [bookingNumber]);

  const loadBooking = async () => {
    try {
      const data = await getBooking(bookingNumber!);
      setBooking(data);
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-8 md:mb-12">
            <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 border-4 border-transparent border-r-orange-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-0 border-4 border-transparent border-b-orange-300 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
          </div>
          <p className="text-white text-2xl md:text-4xl font-light tracking-wider mb-6 md:mb-8">Loading booking confirmation</p>
          <div className="flex gap-3 md:gap-4 justify-center">
            <div className="w-4 h-4 md:w-5 md:h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-4 h-4 md:w-5 md:h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 md:w-5 md:h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-8 md:mb-12 transform hover:scale-110 transition-transform duration-300">
            <svg className="w-32 h-32 md:w-48 md:h-48 mx-auto text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-6xl font-black text-white mb-6 md:mb-8">Booking Not Found</h1>
          <p className="text-gray-400 mb-8 md:mb-12 text-base md:text-2xl">
            We couldn&apos;t find a booking with that reference. Please check your link or contact our team.
          </p>
          <Link
            href="/cars"
            className="inline-flex items-center gap-2 md:gap-4 px-6 md:px-14 py-3 md:py-7 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-2xl md:rounded-3xl transition-all shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 text-base md:text-2xl"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-6 md:py-12">
      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-8 lg:p-10 border border-white/10">
          {/* Top: status + vehicle snapshot (stacked to optimize space) */}
          <div className="space-y-6 md:space-y-8 mb-8 md:mb-10">
            <div className="text-left">
          {booking.status === 'pending' ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold mb-3 md:mb-4 border border-orange-500/30">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                Pending Review
              </div>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-white">Booking Pending</h1>
              <p className="text-white/70 text-sm md:text-lg mb-2">
                Your request has been received and is currently being reviewed by our team.
              </p>
              <p className="text-white/70 text-sm md:text-lg">
                We&apos;ll confirm your booking shortly and send a detailed email with all the information you need.
              </p>
              <div className="mt-6 md:mt-8 inline-flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-600/20 backdrop-blur-xl border border-orange-500/30">
                <span className="text-xs md:text-sm uppercase tracking-wide text-white/80 font-semibold">Booking Number</span>
                <span className="text-xl md:text-2xl font-bold text-orange-400 break-all">{booking.booking_number}</span>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-green-500/20 text-green-300 text-xs font-bold mb-3 md:mb-4 border border-green-500/30">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Confirmed
              </div>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-white">Booking Confirmed</h1>
              <p className="text-white/70 text-sm md:text-lg">
                Thank you for choosing DB Luxury Cars. Your booking has been successfully confirmed.
              </p>
              <div className="mt-6 md:mt-8 inline-flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-xl border border-green-500/30">
                <span className="text-xs md:text-sm uppercase tracking-wide text-white/80 font-semibold">Booking Number</span>
                <span className="text-xl md:text-2xl font-bold text-green-400 break-all">{booking.booking_number}</span>
              </div>
            </>
          )}
            </div>

            {/* Vehicle snapshot card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl overflow-hidden shadow-2xl w-full border border-white/10">
              {(() => {
                const images = Array.isArray(booking.images)
                  ? booking.images
                  : booking.images
                  ? [booking.images]
                  : [];
                const mainImage = images.length > 0 ? images[0] : null;

                return (
                  <>
                    <div className="relative w-full h-48 md:h-64">
                      {mainImage ? (
                        <Image
                          src={getImageUrl(mainImage) || '/placeholder-car.jpg'}
                          alt={`${booking.make} ${booking.model}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-700"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                          <span className="text-gray-500 text-xs md:text-sm">DB Luxury Cars</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/60" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
                    </div>
                    <div className="p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/5 border-t border-white/10">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-white/60 mb-1 font-semibold">Vehicle</p>
                        <p className="font-bold text-white text-lg md:text-xl">
                          {booking.make} {booking.model}
                        </p>
                        {booking.year && (
                          <p className="text-xs md:text-sm text-white/60 mt-1">{booking.year}</p>
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs uppercase tracking-wider text-white/60 mb-1 font-semibold">Total</p>
                        <p className="text-2xl md:text-3xl font-bold text-orange-400">
                          €{parseFloat(booking.total_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Left column: vehicle & rental */}
          <div className="md:space-y-6">
            {/* Vehicle Information */}
            <div className="hidden md:block bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-lg md:rounded-xl border border-white/10 shadow-xl">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-white">Vehicle Information</h2>
              <div className="space-y-2 text-sm md:text-base">
                <div className="flex justify-between gap-2">
                  <span className="text-white/70">Vehicle</span>
                  <span className="font-bold text-white text-right break-words">
                    {booking.make} {booking.model} {booking.year && `(${booking.year})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Rental Details */}
            <div className="bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-lg md:rounded-xl border border-white/10 shadow-xl">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-white">Rental Details</h2>
              <div className="space-y-4 text-sm md:text-base">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white/70 mb-1 font-semibold text-xs md:text-sm">Pick-up Location</p>
                    <p className="font-bold text-white break-words">{booking.pickup_location_name}</p>
                    {booking.pickup_location_address && (
                      <p className="text-xs md:text-sm text-white/60 mt-1 break-words">
                        {booking.pickup_location_address}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 md:text-right">
                    <p className="text-white/70 mb-1 font-semibold text-xs md:text-sm">Drop-off Location</p>
                    <p className="font-bold text-white break-words">{booking.dropoff_location_name}</p>
                    {booking.dropoff_location_address && (
                      <p className="text-xs md:text-sm text-white/60 mt-1 break-words">
                        {booking.dropoff_location_address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between gap-4 pt-4 border-t border-white/10">
                  <div className="flex-1">
                    <p className="text-white/70 mb-1 font-semibold text-xs md:text-sm">Pick-up Date</p>
                    <p className="font-bold text-white text-xs md:text-base break-words">
                      {new Date(booking.pickup_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} {new Date(booking.pickup_date).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex-1 md:text-right">
                    <p className="text-white/70 mb-1 font-semibold text-xs md:text-sm">Drop-off Date</p>
                    <p className="font-bold text-white text-xs md:text-base break-words">
                      {new Date(booking.dropoff_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} {new Date(booking.dropoff_date).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: pricing, customer */}
          <div className="space-y-4 md:space-y-6">
            {/* Pricing Summary */}
            <div className="bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-lg md:rounded-xl border border-white/10 shadow-xl">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-white">Pricing Summary</h2>
              <div className="space-y-2 md:space-y-3 text-sm md:text-base">
                <div className="flex justify-between">
                  <span className="text-white/70">Base Price</span>
                  <span className="font-bold text-white">
                    €{parseFloat(booking.base_price).toFixed(2)}
                  </span>
                </div>
                {booking.extras_price > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Extras</span>
                    <span className="font-bold text-white">
                      €{parseFloat(booking.extras_price).toFixed(2)}
                    </span>
                  </div>
                )}
                {booking.discount_amount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span className="font-bold">
                      -€{parseFloat(booking.discount_amount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold text-lg md:text-xl border-t border-white/20 pt-3 md:pt-4 mt-3 md:mt-4">
                  <span className="text-white">Total</span>
                  <span className="text-orange-400">
                    €{parseFloat(booking.total_price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-lg md:rounded-xl border border-white/10 shadow-xl">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-white">Customer Information</h2>
              <div className="space-y-2 md:space-y-3 text-sm md:text-base">
                <div className="flex justify-between gap-2">
                  <span className="text-white/70 flex-shrink-0">Name</span>
                  <span className="font-bold text-white text-right break-words">
                    {booking.first_name} {booking.last_name}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-white/70 flex-shrink-0">Email</span>
                  <span className="font-bold text-white text-right break-all">
                    {booking.email}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-white/70 flex-shrink-0">Phone</span>
                  <span className="font-bold text-white text-right break-words">
                    {booking.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

          <div className="mt-8 md:mt-12 text-center">
            <Link
              href="/cars"
              className="inline-flex items-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-base md:text-lg rounded-lg md:rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-8 md:mb-12">
            <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 border-4 border-transparent border-r-orange-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-0 border-4 border-transparent border-b-orange-300 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
          </div>
          <p className="text-white text-2xl md:text-4xl font-light tracking-wider mb-6 md:mb-8">Loading booking confirmation</p>
          <div className="flex gap-3 md:gap-4 justify-center">
            <div className="w-4 h-4 md:w-5 md:h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-4 h-4 md:w-5 md:h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 md:w-5 md:h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    }>
      <BookingConfirmationContent />
    </Suspense>
  );
}

