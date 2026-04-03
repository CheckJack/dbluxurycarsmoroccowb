'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getVehicle } from '@/lib/api';
import BookingForm from '@/components/BookingForm';
import Link from 'next/link';
import Image from 'next/image';

function BookingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vehicleId = searchParams.get('vehicle_id');
  const pickupDateParam = searchParams.get('pickup_date');
  const dropoffDateParam = searchParams.get('dropoff_date');
  const pickupLocationParam = searchParams.get('pickup_location');
  const dropoffLocationParam = searchParams.get('dropoff_location');
  
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Stable callback for step changes
  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);
  
  // Get dropoff location from URL params or localStorage as fallback
  const getDropoffLocation = () => {
    if (dropoffLocationParam) {
      return dropoffLocationParam;
    }
    // Fallback to localStorage
    try {
      const savedData = localStorage.getItem('carSearchData');
      if (savedData) {
        const searchData = JSON.parse(savedData);
        return searchData.dropoff_location_id || '';
      }
    } catch (error) {
      console.error('Error reading localStorage:', error);
    }
    return '';
  };

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
    } else {
      // Redirect to cars page if no vehicle ID
      router.push('/cars');
    }
  }, [vehicleId, router]);

  const loadVehicle = async () => {
    try {
      const data = await getVehicle(vehicleId!);
      setVehicle(data);
    } catch (error) {
      console.error('Error loading vehicle:', error);
      router.push('/cars');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-40 h-40 mx-auto mb-12">
            <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 border-4 border-transparent border-r-orange-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-0 border-4 border-transparent border-b-orange-300 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
          </div>
          <p className="text-white text-4xl font-light tracking-wider mb-8">Loading booking form</p>
          <div className="flex gap-4 justify-center">
            <div className="w-5 h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-5 h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-5 h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to get full image URL
  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-12 transform hover:scale-110 transition-transform duration-300">
            <svg className="w-48 h-48 mx-auto text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-6xl font-black text-white mb-8">Vehicle not found</h2>
          <p className="text-gray-400 mb-12 text-2xl">The vehicle you're trying to book doesn't exist or has been removed.</p>
          <Link 
            href="/cars" 
            className="inline-flex items-center gap-4 px-14 py-7 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-3xl transition-all shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 text-2xl"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Fleet
          </Link>
        </div>
      </div>
    );
  }

  // Get vehicle images
  const vehicleImages = Array.isArray(vehicle.images) ? vehicle.images : vehicle.images ? [vehicle.images] : [];
  const mainImage = vehicleImages.length > 0 ? vehicleImages[0] : null;
  const showVehicleCard = currentStep === 1;

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-8 pb-16">
        {/* Breadcrumbs */}
        <nav className="mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm overflow-x-auto scrollbar-hide pb-2">
            <Link href="/cars" className="text-white/60 hover:text-white transition-colors font-medium whitespace-nowrap flex-shrink-0">
              Home
            </Link>
            <svg className="w-3 h-3 md:w-4 md:h-4 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/cars" className="text-white/60 hover:text-white transition-colors font-medium whitespace-nowrap flex-shrink-0">
              Fleet
            </Link>
            <svg className="w-3 h-3 md:w-4 md:h-4 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href={`/cars/${vehicle.id}`} className="text-white/60 hover:text-white transition-colors font-medium whitespace-nowrap flex-shrink-0 max-w-[120px] md:max-w-none truncate">
              <span className="hidden md:inline">{vehicle.make} {vehicle.model}</span>
              <span className="md:hidden">{vehicle.make}</span>
            </Link>
            <svg className="w-3 h-3 md:w-4 md:h-4 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white font-semibold whitespace-nowrap flex-shrink-0">Booking</span>
          </div>
        </nav>

        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Complete Your Booking</h1>
          <p className="text-xl text-white/70">
            Booking: <span className="font-bold bg-gradient-to-r from-orange-400 via-orange-300 to-orange-400 bg-clip-text text-transparent">{vehicle.make} {vehicle.model}</span>
          </p>
        </div>

        {/* Main Content: Image + Form */}
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          {/* Left Side - Vehicle Image (only on step 1) */}
          {showVehicleCard && (
            <div className="w-full lg:w-1/2 lg:self-start">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col">
                {mainImage ? (
                  <div className="relative w-full h-[280px] overflow-hidden">
                    <Image
                      src={getImageUrl(mainImage) || '/placeholder-car.jpg'}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-700"
                      priority
                      quality={95}
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
                  </div>
                ) : (
                  <div className="w-full h-[280px] bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-32 h-32 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-500 text-lg">No Image Available</span>
                    </div>
                  </div>
                )}
                
                {/* Vehicle Info Card */}
                <div className="p-6 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        {vehicle.make} {vehicle.model}
                      </h2>
                      {vehicle.year && (
                        <p className="text-white/50 text-base font-light">{vehicle.year}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-orange-400">
                        €{Number(vehicle.base_price_daily || 0).toFixed(0)}
                      </p>
                      <p className="text-sm text-white/70 font-medium">per day</p>
                    </div>
                  </div>

                  {/* Quick Specs */}
                  <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/10 mt-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-all">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-bold text-white text-sm">{vehicle.seats || 'N/A'}</span>
                        <span className="text-xs text-white/50">Seats</span>
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-all">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="font-bold text-white text-sm capitalize">{vehicle.transmission || 'N/A'}</span>
                        <span className="text-xs text-white/50">Transmission</span>
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-all">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="font-bold text-white text-sm capitalize">{vehicle.fuel_type || 'N/A'}</span>
                        <span className="text-xs text-white/50">Fuel</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Side - Booking Form */}
          <div className={`w-full ${showVehicleCard ? 'lg:w-1/2' : 'lg:w-full'} flex flex-col`}>
            <BookingForm 
              vehicle={vehicle}
              initialPickupDate={pickupDateParam ? new Date(pickupDateParam) : null}
              initialDropoffDate={dropoffDateParam ? new Date(dropoffDateParam) : null}
              initialPickupLocation={pickupLocationParam || ''}
              initialDropoffLocation={getDropoffLocation()}
              onStepChange={handleStepChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-40 h-40 mx-auto mb-12">
            <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 border-4 border-transparent border-r-orange-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-0 border-4 border-transparent border-b-orange-300 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
          </div>
          <p className="text-white text-4xl font-light tracking-wider mb-8">Loading</p>
          <div className="flex gap-4 justify-center">
            <div className="w-5 h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-5 h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-5 h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}

