'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getVehicle, getVehicles, getLocations, getVehicleBlockedDates } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import VehicleCard from '@/components/VehicleCard';
import { getImageUrl } from '@/lib/utils';

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;
  const [vehicle, setVehicle] = useState<any>(null);
  const [similarVehicles, setSimilarVehicles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const specsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  
  // Booking form state
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [dropoffDate, setDropoffDate] = useState<Date | null>(null);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [showReturnLocation, setShowReturnLocation] = useState(false);
  
  // Blocked dates state
  const [blockedDatesData, setBlockedDatesData] = useState<any>(null);

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 40;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 40;
        setMousePosition({ x, y });
      }
    };

    if (heroRef.current) {
      heroRef.current.addEventListener('mousemove', handleMouseMove);
      return () => {
        if (heroRef.current) {
          heroRef.current.removeEventListener('mousemove', handleMouseMove);
        }
      };
    }
  }, [vehicle]);

  // Intersection Observer with stagger
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const createObserver = (ref: React.RefObject<HTMLDivElement | null>, id: string, delay = 0) => {
      if (!ref.current) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                setVisibleSections((prev) => new Set(prev).add(id));
              }, delay);
            }
          });
        },
        { threshold: 0.1, rootMargin: '-50px' }
      );
      observer.observe(ref.current);
      observers.push(observer);
    };

    createObserver(specsRef, 'specs', 0);
    createObserver(featuresRef, 'features', 200);

    return () => observers.forEach((observer) => observer.disconnect());
  }, [vehicle]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen || !vehicle) return;
    
    const vehicleImages = Array.isArray(vehicle.images) ? vehicle.images : vehicle.images ? [vehicle.images] : [];
    if (vehicleImages.length === 0) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev - 1 + vehicleImages.length) % vehicleImages.length);
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev + 1) % vehicleImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, vehicle]);

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
      loadBlockedDates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  useEffect(() => {
    if (locations.length > 0) {
      loadSavedSearchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  useEffect(() => {
    if (!showReturnLocation && pickupLocation) {
      setDropoffLocation(pickupLocation);
    }
  }, [showReturnLocation, pickupLocation]);

  const loadSavedSearchData = () => {
    try {
      let pickupLocationId = '';
      let dropoffLocationId = '';
      let wasShowReturnLocation = false;
      
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const locationParam = urlParams.get('location');
        const fromParam = urlParams.get('available_from');
        const toParam = urlParams.get('available_to');
        
        if (locationParam && locations.length > 0) {
          const locationExists = locations.some((loc: any) => String(loc.id) === String(locationParam));
          if (locationExists) {
            pickupLocationId = locationParam;
            setPickupLocation(locationParam);
          }
        }
        if (fromParam) {
          const date = new Date(fromParam);
          if (!isNaN(date.getTime())) {
            setPickupDate(date);
          }
        }
        if (toParam) {
          const date = new Date(toParam);
          if (!isNaN(date.getTime())) {
            setDropoffDate(date);
          }
        }
      }
      
      const savedData = localStorage.getItem('carSearchData');
      if (savedData) {
        const searchData = JSON.parse(savedData);
        wasShowReturnLocation = searchData.showReturnLocation || false;
        
        if (!pickupLocationId && searchData.pickup_location_id && locations.length > 0) {
          const locationExists = locations.some((loc: any) => String(loc.id) === String(searchData.pickup_location_id));
          if (locationExists) {
            pickupLocationId = searchData.pickup_location_id;
            setPickupLocation(searchData.pickup_location_id);
          }
        }
        
        if (searchData.dropoff_location_id && locations.length > 0) {
          const locationExists = locations.some((loc: any) => String(loc.id) === String(searchData.dropoff_location_id));
          if (locationExists) {
            dropoffLocationId = searchData.dropoff_location_id;
            setDropoffLocation(searchData.dropoff_location_id);
          }
        }
        
        setShowReturnLocation(searchData.showReturnLocation || false);
        
        if (!pickupDate && searchData.pickup_date) {
          const date = new Date(searchData.pickup_date);
          if (!isNaN(date.getTime())) {
            setPickupDate(date);
          }
        }
        if (!dropoffDate && searchData.dropoff_date) {
          const date = new Date(searchData.dropoff_date);
          if (!isNaN(date.getTime())) {
            setDropoffDate(date);
          }
        }
      }
      
      setShowReturnLocation(wasShowReturnLocation);
      
      if (!wasShowReturnLocation && pickupLocationId && !dropoffLocationId) {
        setDropoffLocation(pickupLocationId);
      }
    } catch (error) {
      console.error('Error loading saved search data:', error);
    }
  };

  const loadVehicle = async () => {
    try {
      const [vehicleData, locationsData, allVehiclesData] = await Promise.all([
        getVehicle(vehicleId),
        getLocations(),
        getVehicles({ category: '' }),
      ]);
      setVehicle(vehicleData);
      setLocations(locationsData);
      const images = Array.isArray(vehicleData.images) ? vehicleData.images : vehicleData.images ? [vehicleData.images] : [];
      setSelectedImageIndex(images.length > 0 ? 0 : 0);
      
      const similar = allVehiclesData
        .filter((v: any) => v.id !== vehicleId && v.category === vehicleData.category)
        .slice(0, 3);
      setSimilarVehicles(similar);
    } catch (error: any) {
      console.error('Error loading vehicle:', error);
      if (error.response?.status === 404) {
        alert('Vehicle not found');
      } else if (error.response?.status === 500) {
        alert('Server error. Please try again later.');
      } else {
        alert(`Error: ${error.response?.data?.error || error.message || 'Failed to load vehicle'}`);
      }
      router.push('/cars');
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedDates = async () => {
    try {
      const data = await getVehicleBlockedDates(vehicleId);
      setBlockedDatesData(data);
    } catch (error) {
      console.error('Error loading blocked dates:', error);
    }
  };

  const isDateAvailable = (date: Date): boolean => {
    if (!blockedDatesData) return true;
    const dateStr = date.toISOString().split('T')[0];
    
    if (blockedDatesData.blocked_dates) {
      const isBlocked = blockedDatesData.blocked_dates.some((note: any) => {
        const noteDate = new Date(note.note_date).toISOString().split('T')[0];
        return dateStr === noteDate;
      });
      if (isBlocked) return false;
    }
    
    if (blockedDatesData.bookings) {
      const isBooked = blockedDatesData.bookings.some((booking: any) => {
        const pickupDate = new Date(booking.pickup_date).toISOString().split('T')[0];
        const dropoffDate = new Date(booking.dropoff_date).toISOString().split('T')[0];
        return dateStr >= pickupDate && dateStr <= dropoffDate;
      });
      if (isBooked) return false;
    }
    
    return true;
  };


  const handleCalculatePrice = () => {
    if (pickupDate && dropoffDate && pickupLocation) {
      let dropoffLocationId;
      if (showReturnLocation) {
        dropoffLocationId = dropoffLocation || '';
      } else {
        dropoffLocationId = pickupLocation;
      }
      
      if (!dropoffLocationId) return;
      
      const params = new URLSearchParams({
        vehicle_id: vehicleId,
        pickup_date: pickupDate.toISOString().split('T')[0],
        dropoff_date: dropoffDate.toISOString().split('T')[0],
        pickup_location: pickupLocation,
      });
      params.append('dropoff_location', dropoffLocationId);
      router.push(`/booking?${params.toString()}`);
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
          <p className="text-white text-2xl md:text-4xl font-light tracking-wider mb-6 md:mb-8">Loading vehicle details</p>
          <div className="flex gap-3 md:gap-4 justify-center">
            <div className="w-4 h-4 md:w-5 md:h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-4 h-4 md:w-5 md:h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 md:w-5 md:h-5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-8 md:mb-12 transform hover:scale-110 transition-transform duration-300">
            <svg className="w-32 h-32 md:w-48 md:h-48 mx-auto text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl md:text-6xl font-black text-white mb-4 md:mb-8">Vehicle not found</h2>
          <p className="text-gray-400 mb-8 md:mb-12 text-base md:text-2xl">The vehicle you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/cars" 
            className="inline-flex items-center gap-2 md:gap-4 px-6 md:px-14 py-3 md:py-7 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-2xl md:rounded-3xl transition-all shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 text-base md:text-2xl"
          >
            <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Fleet
          </Link>
        </div>
      </div>
    );
  }

  const vehicleImages = Array.isArray(vehicle.images) ? vehicle.images : vehicle.images ? [vehicle.images] : [];
  const vehicleFeatures = Array.isArray(vehicle.features) ? vehicle.features : vehicle.features ? [vehicle.features] : [];
  const safeImageIndex = vehicleImages.length > 0 ? Math.min(selectedImageIndex, vehicleImages.length - 1) : 0;

  const getCategoryLabel = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'luxury_sedans': 'Luxury Sedans', 'luxury-sedans': 'Luxury Sedans',
      'economic': 'Economic', 'sportscars': 'Sportscars', 'sports-cars': 'Sportscars',
      'supercars': 'Supercars', 'suvs': 'SUVs', 'luxury': 'Luxury',
      'super_luxury': 'Super Luxury', 'exotic': 'Exotic',
    };
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
  };

  const specItems = [
    { label: 'Seats', value: vehicle.seats || 'N/A', icon: (
      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    ) },
    { label: 'Transmission', value: (vehicle.transmission || 'N/A').toUpperCase(), icon: (
      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    ) },
    { label: 'Fuel Type', value: (vehicle.fuel_type || 'N/A').toUpperCase(), icon: (
      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    ) },
    { label: 'Horsepower', value: vehicle.power ? `${vehicle.power} HP` : 'N/A', icon: (
      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
    ) },
    { label: 'Year', value: vehicle.year || 'N/A', icon: (
      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    ) },
    { label: 'Color', value: (vehicle.color || 'N/A').toUpperCase(), icon: (
      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h14a2 2 0 012 2v12a4 4 0 01-4 4H7z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 10h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    ) },
  ];

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* DatePicker Portal Container */}
      <div id="datepicker-portal"></div>
      
      {/* Sticky Header - Always Visible */}
      <div className="fixed top-0 left-0 right-0 z-40">
        {/* Scroll Progress Bar - At top of header */}
        <div className="h-1 bg-black">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          ></div>
        </div>
        <div className="bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="container mx-auto max-w-7xl px-4 md:px-10 py-3 md:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-8">
                <button
                  onClick={() => router.back()}
                  className="p-2 md:p-3.5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all group"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-sm md:text-2xl font-bold text-white leading-tight">{vehicle.make} {vehicle.model}</h1>
                  <p className="text-xs md:text-sm text-white/50 font-light hidden sm:block">{getCategoryLabel(vehicle.category)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-6">
                <div className="text-right">
                  <p className="text-xl md:text-4xl font-black text-orange-500">€{Number(vehicle.base_price_daily || 0).toFixed(0)}</p>
                  <p className="text-xs md:text-sm text-white/50 font-light hidden sm:block">per day</p>
                </div>
                <button
                  onClick={() => {
                    const bookingForm = document.getElementById('booking-form');
                    if (bookingForm) {
                      bookingForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="px-3 py-2 md:px-6 md:py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs md:text-base font-bold rounded-lg md:rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Book Now</span>
                  <span className="sm:hidden">Book</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Hero Section */}
      <section 
        ref={heroRef}
        className="relative w-full overflow-hidden"
        style={{
          height: 'clamp(500px, calc(100vh - 100px), 900px)',
          minHeight: '500px',
          maxHeight: '900px',
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          transition: 'transform 0.2s ease-out'
        }}
      >
        {vehicleImages && vehicleImages.length > 0 ? (
          <>
            <div className="absolute inset-0">
              <Image
                src={getImageUrl(vehicleImages[safeImageIndex]) || '/placeholder-car.jpg'}
                alt={`${vehicle.make} ${vehicle.model}`}
                fill
                className="object-cover"
                priority
                quality={100}
                unoptimized
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src && !target.src.includes('placeholder-car.jpg')) {
                    target.src = '/placeholder-car.jpg';
                  }
                }}
                onClick={() => {
                  setLightboxOpen(true);
                  setLightboxIndex(safeImageIndex);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/60"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50"></div>
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10"></div>
            </div>
            
            {/* Animated Grid */}
            <div className="absolute inset-0 opacity-[0.02]">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '80px 80px'
              }}></div>
            </div>
            
            {/* Navigation Arrows - Far Left and Right */}
            {vehicleImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex((prev) => (prev - 1 + vehicleImages.length) % vehicleImages.length)}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 group bg-black/60 hover:bg-black/80 backdrop-blur-xl text-white p-2 md:p-3 rounded-lg transition-all shadow-lg hover:scale-105 z-30 border border-white/20"
                  aria-label="Previous image"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedImageIndex((prev) => (prev + 1) % vehicleImages.length)}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 group bg-black/60 hover:bg-black/80 backdrop-blur-xl text-white p-2 md:p-3 rounded-lg transition-all shadow-lg hover:scale-105 z-30 border border-white/20"
                  aria-label="Next image"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Page Indicator - Bottom Right */}
            {vehicleImages.length > 1 && (
              <div className="absolute bottom-4 md:bottom-6 right-2 md:right-6 bg-black/80 backdrop-blur-xl text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-black border border-white/20 shadow-xl z-30">
                <span className="text-orange-500">{safeImageIndex + 1}</span>
                <span className="text-white/40 mx-1 md:mx-2">/</span>
                <span>{vehicleImages.length}</span>
              </div>
            )}

          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-40 h-40 mx-auto text-gray-800 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600 text-xl">No Image Available</p>
            </div>
          </div>
        )}

        {/* Scroll Indicator - Bottom Center */}
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 animate-bounce hidden sm:flex">
          <div className="flex flex-col items-center gap-1.5 text-white/80">
            <span className="text-xs font-bold uppercase tracking-wider">Scroll</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative bg-black">
        <div className="container mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-16">
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-start lg:min-w-0">
            {/* Left Content */}
            <div className="min-w-0 flex-1 space-y-8 md:space-y-16 w-full">
              {/* Gallery */}
              {vehicleImages.length > 0 && (
                <div className="min-w-0 max-w-full">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Gallery</h3>
                  <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 min-w-0">
                    {vehicleImages.map((image: string, index: number) => {
                      const isSelected = index === safeImageIndex;
                      const imageUrl = getImageUrl(image);
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            setSelectedImageIndex(index);
                            setLightboxOpen(true);
                            setLightboxIndex(index);
                          }}
                          className={`relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                            isSelected
                              ? 'border-orange-500'
                              : 'border-white/20 hover:border-white/40'
                          }`}
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={`${vehicle.make} ${vehicle.model} - Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Hide image and show placeholder on error
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const placeholder = target.nextElementSibling as HTMLElement;
                                if (placeholder && placeholder.classList.contains('image-placeholder')) {
                                  placeholder.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div className="image-placeholder w-full h-full bg-gray-800 flex items-center justify-center" style={{ display: imageUrl ? 'none' : 'flex' }}>
                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Specifications */}
              <div ref={specsRef} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Specifications</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                  {specItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-white/5 rounded-lg">
                      <div className="text-white/70 flex-shrink-0">{item.icon}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] md:text-xs text-white/60 font-medium">{item.label}</p>
                        <p className="text-xs md:text-base font-bold text-white truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              {vehicleFeatures && vehicleFeatures.length > 0 && (
                <div ref={featuresRef} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Features & Amenities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    {vehicleFeatures.map((feature: string, index: number) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-white/5 rounded-lg"
                      >
                        <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-white text-xs md:text-sm font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Booking Widget - Sticky */}
            <div className="w-full lg:w-[480px] lg:min-w-[480px] lg:max-w-[480px] lg:shrink-0 lg:sticky lg:top-12 lg:self-start">
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 md:p-6 border border-white/20 shadow-xl">
                <form
                  id="booking-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCalculatePrice();
                  }}
                  className="space-y-4 md:space-y-6"
                >
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Book This Vehicle</h3>
                    <p className="text-white/60 text-xs md:text-sm">Select your dates and location</p>
                  </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-white mb-2">Pickup Location</label>
                      <div className="relative">
                        <select
                          value={pickupLocation}
                          onChange={(e) => setPickupLocation(e.target.value)}
                          className="w-full pl-3 md:pl-4 pr-8 md:pr-10 py-2.5 md:py-3 text-sm md:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 backdrop-blur-sm text-white font-medium transition-all border border-white/10 hover:border-white/20"
                          required
                        >
                          <option value="" className="bg-gray-900">Select pickup location</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id} className="bg-gray-900">
                              {loc.name} - {loc.city}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setShowReturnLocation(!showReturnLocation)}
                        className="w-full flex items-center justify-between p-2.5 md:p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10 hover:border-white/20 text-xs md:text-sm text-white/80"
                      >
                        <span>
                          {showReturnLocation ? 'Return to same location' : 'Different return location'}
                        </span>
                        <svg 
                          className={`w-4 h-4 text-white/50 transition-transform duration-300 ${showReturnLocation ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showReturnLocation && (
                        <div className="mt-2 md:mt-3">
                          <label className="block text-xs md:text-sm font-semibold text-white mb-2">Return Location</label>
                          <select
                            value={dropoffLocation}
                            onChange={(e) => setDropoffLocation(e.target.value)}
                            className="w-full pl-3 md:pl-4 pr-8 md:pr-10 py-2.5 md:py-3 text-sm md:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 backdrop-blur-sm text-white font-medium transition-all border border-white/10 hover:border-white/20"
                          >
                            <option value="" className="bg-gray-900">Select return location</option>
                            {locations.map((loc) => (
                              <option key={loc.id} value={loc.id} className="bg-gray-900">
                                {loc.name} - {loc.city}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-white mb-2">Rental Period</label>
                      <div className="space-y-2 md:space-y-3">
                        <div className="relative">
                          <DatePicker
                            selected={pickupDate}
                            onChange={(date: Date | null) => {
                              setPickupDate(date);
                              if (date && dropoffDate && dropoffDate <= date) {
                                setDropoffDate(null);
                              }
                            }}
                            minDate={new Date()}
                            filterDate={isDateAvailable}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={30}
                            timeCaption="Time"
                            dateFormat="MMM dd, yyyy HH:mm"
                            className="w-full pl-3 md:pl-4 pr-8 md:pr-10 py-2.5 md:py-3 text-sm md:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 backdrop-blur-sm text-white font-medium transition-all border border-white/10 hover:border-white/20"
                            placeholderText="Pickup date & time"
                            withPortal
                            portalId="datepicker-portal"
                            popperClassName="!fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !z-[9999]"
                            required
                          />
                        </div>
                        <div className="relative">
                          <DatePicker
                            selected={dropoffDate}
                            onChange={(date: Date | null) => {
                              if (date && pickupDate) {
                                const timeDiff = date.getTime() - pickupDate.getTime();
                                const hoursDiff = timeDiff / (1000 * 60 * 60);
                                if (hoursDiff < 24) {
                                  const minDropoffDate = new Date(pickupDate.getTime() + 24 * 60 * 60 * 1000);
                                  setDropoffDate(minDropoffDate);
                                  return;
                                }
                              }
                              setDropoffDate(date);
                            }}
                            minDate={pickupDate || new Date()}
                            filterDate={(date: Date) => {
                              if (!pickupDate) return isDateAvailable(date);
                              if (date.toDateString() === pickupDate.toDateString()) {
                                return false;
                              }
                              return isDateAvailable(date);
                            }}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={30}
                            timeCaption="Time"
                            dateFormat="MMM dd, yyyy HH:mm"
                            className="w-full pl-3 md:pl-4 pr-8 md:pr-10 py-2.5 md:py-3 text-sm md:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 backdrop-blur-sm text-white font-medium transition-all border border-white/10 hover:border-white/20"
                            placeholderText="Return date & time"
                            withPortal
                            portalId="datepicker-portal"
                            popperClassName="!fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !z-[9999]"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!pickupDate || !dropoffDate || !pickupLocation || (showReturnLocation && !dropoffLocation)}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-bold text-sm md:text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                    >
                      Calculate Price & Book
                    </button>
                </form>
              </div>
            </div>
          </div>

          {/* Description - Full Width */}
          {vehicle.description && (
            <div ref={descriptionRef} className="mt-8 md:mt-16 bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">About This Vehicle</h2>
              <p className="text-white/70 leading-relaxed text-xs md:text-sm">{vehicle.description}</p>
            </div>
          )}

          {/* Similar Vehicles */}
          {similarVehicles.length > 0 && (
            <div className="mt-8 md:mt-16 pt-8 md:pt-16 border-t border-white/10">
              <div className="mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Similar Vehicles</h2>
                <p className="text-white/60 text-xs md:text-sm">Explore other vehicles in the same category</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {similarVehicles.map((v: any) => (
                  <VehicleCard 
                    key={v.id}
                    vehicle={v}
                    searchParams={undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && vehicleImages.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8 animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 md:top-10 right-4 md:right-10 text-white hover:text-orange-500 transition-colors z-10 p-2 md:p-4 hover:bg-white/10 rounded-xl md:rounded-2xl"
          >
            <svg className="w-6 h-6 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={getImageUrl(vehicleImages[lightboxIndex]) || '/placeholder-car.jpg'}
              alt={`${vehicle.make} ${vehicle.model} - Fullscreen ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              quality={100}
              unoptimized
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.currentTarget as HTMLImageElement;
                if (target.src && !target.src.includes('placeholder-car.jpg')) {
                  target.src = '/placeholder-car.jpg';
                }
              }}
            />
          </div>

          {vehicleImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev - 1 + vehicleImages.length) % vehicleImages.length);
                }}
                className="absolute left-2 md:left-10 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white p-3 md:p-8 rounded-2xl md:rounded-3xl transition-all z-10 border border-white/20"
              >
                <svg className="w-5 h-5 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev + 1) % vehicleImages.length);
                }}
                className="absolute right-2 md:right-10 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white p-3 md:p-8 rounded-2xl md:rounded-3xl transition-all z-10 border border-white/20"
              >
                <svg className="w-5 h-5 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-4 md:bottom-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl text-white px-4 md:px-10 py-2 md:py-5 rounded-2xl md:rounded-3xl text-sm md:text-xl font-black border border-white/20 z-10">
                <span className="text-orange-500">{lightboxIndex + 1}</span>
                <span className="text-white/40 mx-2 md:mx-5">/</span>
                <span>{vehicleImages.length}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
