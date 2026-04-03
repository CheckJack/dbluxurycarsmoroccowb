'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getVehicles, getLocations } from '@/lib/api';
import VehicleCard from '@/components/VehicleCard';
import FeaturedCarCard from '@/components/FeaturedCarCard';
import ReviewCarousel from '@/components/ReviewCarousel';
import Toast from '@/components/Toast';

// Car brand logos configuration
// Supports multiple image formats: .png, .jpg, .jpeg, .svg, .webp
const carBrands = [
  { name: 'Bugatti', logo: '/logos/bugatti.png' },
  { name: 'Pagani', logo: '/logos/pagani.png' },
  { name: 'Koenigsegg', logo: '/logos/koenigsegg.png' },
  { name: 'McLaren', logo: '/logos/mclaren.png' },
  { name: 'Rolls-Royce', logo: '/logos/rolls-royce.png' },
  { name: 'Lamborghini', logo: '/logos/lamborghini.png' },
  { name: 'Ferrari', logo: '/logos/ferrari.png' },
  { name: 'Mercedes-Benz', logo: '/logos/mercedes-benz.png' },
  { name: 'Aston Martin', logo: '/logos/aston-martin.png' },
];

// Helper function to try multiple image formats
function getLogoPath(baseName: string): string {
  const formats = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
  // Default to .png, but the component will try to load it
  return `/logos/${baseName}.png`;
}

// Brand Logo Component with fallback to text
function BrandLogo({ brand, isMercedes }: { brand: { name: string; logo: string }; isMercedes?: boolean }) {
  const [showImage, setShowImage] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Try multiple image formats
    const formats = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    const basePath = brand.logo.replace(/\.(png|jpg|jpeg|svg|webp)$/i, '');
    
    let formatIndex = 0;
    
    const tryLoadImage = () => {
      if (formatIndex >= formats.length) {
        setShowImage(false);
        return;
      }
      
      const testPath = `${basePath}${formats[formatIndex]}`;
      const img = new window.Image();
      
      img.onload = () => {
        setImageSrc(testPath);
        setShowImage(true);
      };
      
      img.onerror = () => {
        formatIndex++;
        tryLoadImage();
      };
      
      img.src = testPath;
    };
    
    tryLoadImage();
  }, [brand.logo]);

  return (
    <div className={`flex items-center justify-center h-24 md:h-32 w-48 md:w-56 opacity-80 hover:opacity-100 transition-opacity flex-shrink-0 ${isMercedes ? '-mr-2 md:-mr-3' : ''}`}>
      {showImage && imageSrc ? (
        <div className="relative w-full h-full max-w-full">
          <img
            ref={imgRef}
            src={imageSrc}
            alt={brand.name}
            className="object-contain w-full h-full"
            onError={() => setShowImage(false)}
          />
        </div>
      ) : (
        <span className="text-white text-lg md:text-xl font-semibold tracking-wider text-center whitespace-nowrap">
          {brand.name.toUpperCase()}
        </span>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [featuredVehicles, setFeaturedVehicles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [videoError, setVideoError] = useState(false);
  const [showReturnLocation, setShowReturnLocation] = useState(false);
  const [searchForm, setSearchForm] = useState({
    pickup_location_id: '',
    dropoff_location_id: '',
    pickup_date: null as Date | null,
    dropoff_date: null as Date | null,
  });
  const [toast, setToast] = useState<{ message: string; type?: 'error' | 'success' | 'info' } | null>(null);

  // REMOVED AUTO-SAVE to prevent race conditions
  // Data is now only saved when user clicks "Show Vehicles" button

  useEffect(() => {
    // Load data asynchronously without blocking render
    loadInitialData().catch(err => {
      console.error('Failed to load initial data:', err);
    });
  }, []);

  useEffect(() => {
    // Ensure video plays
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error('Error playing video:', error);
        setVideoError(true);
      });
    }
  }, []);


  const loadInitialData = async () => {
    try {
      const [vehiclesData, locationsData] = await Promise.all([
        getVehicles().catch(err => {
          console.error('Error loading vehicles:', err);
          if (err.name === 'NetworkError' || err.message?.includes('Cannot connect')) {
            console.error('Backend server is not running. Please start it with: cd dbcars/backend && npm run dev');
          }
          return [];
        }),
        getLocations().catch(err => {
          console.error('Error loading locations:', err);
          if (err.name === 'NetworkError' || err.message?.includes('Cannot connect')) {
            console.error('Backend server is not running. Please start it with: cd dbcars/backend && npm run dev');
          }
          return [];
        }),
      ]);
      setVehicles(vehiclesData.slice(0, 12));
      setLocations(locationsData);
      
      // Select featured vehicles - only Range Rovers, limit to 3
      const featured = vehiclesData
        .filter((v: any) => v.images && v.images.length > 0) // Only vehicles with images
        .filter((v: any) => v.make && v.make.toLowerCase().includes('range rover')) // Only Range Rovers
        .sort((a: any, b: any) => {
          // Sort by price (highest first)
          return (b.base_price_daily || 0) - (a.base_price_daily || 0);
        })
        .slice(0, 3); // Take top 3
      setFeaturedVehicles(featured);
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays to prevent hanging
      setVehicles([]);
      setFeaturedVehicles([]);
      setLocations([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that both dates are selected
    if (!searchForm.pickup_date || !searchForm.dropoff_date) {
      setToast({
        message: 'Please select both pickup and return dates to search for vehicles.',
        type: 'error',
      });
      return;
    }
    
    // Validate minimum 1 day (24 hours) rental period
    const timeDiff = searchForm.dropoff_date.getTime() - searchForm.pickup_date.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      const roundedHours = Math.round(hoursDiff * 10) / 10;
      setToast({
        message: `The minimum rental period is 1 full day (24 hours). Your selected period is only ${roundedHours} ${roundedHours === 1 ? 'hour' : 'hours'}. Please select a return date that is at least 24 hours after your pickup date.`,
        type: 'error',
      });
      return;
    }
    
    // Determine the dropoff location based on user's choice
    let dropoffLocationId;
    if (showReturnLocation) {
      // User clicked "Different return" - use their selected dropoff location
      dropoffLocationId = searchForm.dropoff_location_id || '';
    } else {
      // User wants same location - use pickup for dropoff
      dropoffLocationId = searchForm.pickup_location_id;
    }
    
    // Save to localStorage ONCE when form is submitted (no auto-save to prevent race conditions)
    const searchData = {
      pickup_location_id: searchForm.pickup_location_id,
      pickup_date: searchForm.pickup_date ? searchForm.pickup_date.toISOString() : null,
      dropoff_date: searchForm.dropoff_date ? searchForm.dropoff_date.toISOString() : null,
      dropoff_location_id: dropoffLocationId,
      showReturnLocation: showReturnLocation,
      savedAt: new Date().toISOString(),
    };
    
    localStorage.setItem('carSearchData', JSON.stringify(searchData));
    
    // Navigate
    const params = new URLSearchParams();
    
    if (searchForm.pickup_location_id) {
      params.append('location', searchForm.pickup_location_id);
    }
    if (searchForm.pickup_date) {
      params.append('available_from', searchForm.pickup_date.toISOString().split('T')[0]);
    }
    if (searchForm.dropoff_date) {
      params.append('available_to', searchForm.dropoff_date.toISOString().split('T')[0]);
    }
    
    router.push(`/cars?${params.toString()}`);
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Hero Section: video + logos = single 100vh viewport */}
      <section className="flex flex-col w-full bg-black overflow-hidden" style={{ height: '100vh' }}>
        {/* Video part - fills space above logo strip */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        {!videoError && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover z-0"
            onError={(e) => {
              const video = e.target as HTMLVideoElement;
              console.error('Video error:', {
                error: video.error,
                networkState: video.networkState,
                readyState: video.readyState,
                src: video.currentSrc || video.src,
              });
              setVideoError(true);
            }}
            onLoadedData={() => {
              // Video loaded successfully, try to play
              if (videoRef.current) {
                videoRef.current.play().catch((error) => {
                  console.error('Error playing video after load:', error);
                });
              }
            }}
          >
            <source src="/Design-sem-nome-7-1.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
        {/* Fallback gradient background if video doesn't load */}
        {videoError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0" />
        )}
        <div className="absolute inset-0 bg-black/40 z-10" />
        
        {/* Content Overlay - fills video area below fixed header */}
        <div className="absolute inset-0 z-20 flex items-center px-4 md:px-8 lg:px-12" style={{ top: '80px', left: 0, right: 0, bottom: 0 }}>
          <div className="container mx-auto w-full max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left Side - Title */}
              <div className="text-white">
                <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-none">
                  The Award-Winning Choice
                </h2>
              </div>

              {/* Right Side - Search Form Overlay */}
              <div className="w-full">
                <div className="glass-form-container">
                  <form
                    onSubmit={handleSearchSubmit}
                    className="glass-form-box p-6 md:p-8 space-y-5"
                  >
                    {/* Content wrapper */}
                    <div className="relative z-10">
                  {/* Location Section */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-1.5 uppercase tracking-wide">
                      Location
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <select
                        value={searchForm.pickup_location_id}
                        onChange={(e) =>
                          setSearchForm((prev) => ({
                            ...prev,
                            pickup_location_id: e.target.value,
                          }))
                        }
                        className="w-full pl-12 pr-32 py-3.5 text-base border-none rounded-xl focus:outline-none focus:border focus:border-white bg-[#3a3a3a] text-white font-medium transition-all"
                      >
                        <option value="">Select pickup location</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} - {loc.city}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowReturnLocation(!showReturnLocation)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-orange-400 hover:text-orange-300 font-medium underline"
                      >
                        + Different return
                      </button>
                    </div>
                    {showReturnLocation && (
                      <div className="mt-3">
                        <select
                          value={searchForm.dropoff_location_id}
                          onChange={(e) => {
                            console.log('Dropoff location changed to:', e.target.value);
                            setSearchForm((prev) => ({
                              ...prev,
                              dropoff_location_id: e.target.value,
                            }));
                          }}
                          className="w-full px-4 py-3.5 text-base border-none rounded-xl focus:outline-none focus:border focus:border-white bg-[#3a3a3a] text-white font-medium transition-all"
                        >
                          <option value="">Select return location</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name} - {loc.city}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Date Section */}
                  <div className="mt-5">
                    <label className="block text-sm font-semibold text-white mb-1 uppercase tracking-wide">
                      Dates
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Pick-up Date */}
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 z-10">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <DatePicker
                          selected={searchForm.pickup_date}
                          onChange={(date: Date | null) =>
                            setSearchForm((prev) => ({ ...prev, pickup_date: date }))
                          }
                          minDate={new Date()}
                          showTimeSelect
                          timeFormat="HH:mm"
                          timeIntervals={30}
                          timeCaption="Time"
                          dateFormat="MMM dd, yyyy HH:mm"
                          className="w-full pl-12 pr-4 py-3.5 text-base border-none rounded-xl focus:outline-none focus:border focus:border-white bg-[#3a3a3a] text-white font-medium transition-all"
                          placeholderText="Pickup date & time"
                          withPortal
                        />
                      </div>

                      {/* Return Date */}
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 z-10">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <DatePicker
                          selected={searchForm.dropoff_date}
                          onChange={(date: Date | null) =>
                            setSearchForm((prev) => ({ ...prev, dropoff_date: date }))
                          }
                          minDate={searchForm.pickup_date || new Date()}
                          showTimeSelect
                          timeFormat="HH:mm"
                          timeIntervals={30}
                          timeCaption="Time"
                          dateFormat="MMM dd, yyyy HH:mm"
                          className="w-full pl-12 pr-4 py-3.5 text-base border-none rounded-xl focus:outline-none focus:border focus:border-white bg-[#3a3a3a] text-white font-medium transition-all"
                          placeholderText="Return date & time"
                          withPortal
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Section */}
                  <div className="flex items-center justify-between pt-4">
                    <button
                      type="button"
                      className="text-sm text-white/70 hover:text-white font-medium underline transition-colors"
                    >
                      Search your car
                    </button>
                    <button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all duration-300"
                      style={{
                        boxShadow: 'inset 0px 3px 6px -4px rgba(255, 255, 255, 0.6), inset 0px -3px 6px -2px rgba(0, 0, 0, 0.8)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'inset 0px 3px 6px rgba(255, 255, 255, 0.6), inset 0px -3px 6px rgba(0, 0, 0, 0.8), 0px 0px 8px rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'inset 0px 3px 6px -4px rgba(255, 255, 255, 0.6), inset 0px -3px 6px -2px rgba(0, 0, 0, 0.8)';
                      }}
                    >
                      Show Vehicles
                    </button>
                  </div>
                  </div>
                </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Logo strip - same hero section, 100vh total */}
        <div className="flex-shrink-0 w-full bg-black overflow-hidden border-t border-gray-800" style={{ height: '15vh' }}>
          <div className="relative w-full h-full flex items-center">
            <div className="flex animate-scroll">
              <div className="flex items-center px-8 flex-shrink-0" style={{ gap: '0.5rem' }}>
                {carBrands.map((brand, index) => (
                  <BrandLogo key={`brand-1-${index}`} brand={brand} isMercedes={brand.name === 'Mercedes-Benz'} />
                ))}
              </div>
              <div className="flex items-center px-8 flex-shrink-0" style={{ gap: '0.5rem' }}>
                {carBrands.map((brand, index) => (
                  <BrandLogo key={`brand-2-${index}`} brand={brand} isMercedes={brand.name === 'Mercedes-Benz'} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search by Category Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 text-black">
            Search by Category
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto text-lg">
            Explore our premium vehicle collection by category
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 max-w-[90rem] mx-auto">
            {/* Luxury Sedans */}
            <Link
              href="/cars?category=luxury_sedans"
              className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{
                backgroundImage: 'url("/category-images/luxury-sedans.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-all duration-300"></div>
              <div className="aspect-square flex flex-col items-center justify-center p-6 text-white relative z-10">
                <h3 className="text-lg md:text-xl font-bold text-center">Luxury Sedans</h3>
                <p className="text-sm text-gray-200 text-center mt-2">Premium Comfort</p>
              </div>
            </Link>

            {/* Economic */}
            <Link
              href="/cars?category=economic"
              className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{
                backgroundImage: 'url("/category-images/economic.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-all duration-300"></div>
              <div className="aspect-square flex flex-col items-center justify-center p-6 text-white relative z-10">
                <h3 className="text-lg md:text-xl font-bold text-center">Economic</h3>
                <p className="text-sm text-gray-200 text-center mt-2">Affordable & Efficient</p>
              </div>
            </Link>

            {/* Sportscars */}
            <Link
              href="/cars?category=sportscars"
              className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{
                backgroundImage: 'url("/category-images/sports-cars.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-all duration-300"></div>
              <div className="aspect-square flex flex-col items-center justify-center p-6 text-white relative z-10">
                <h3 className="text-lg md:text-xl font-bold text-center">Sportscars</h3>
                <p className="text-sm text-gray-200 text-center mt-2">High Performance</p>
              </div>
            </Link>

            {/* Supercars */}
            <Link
              href="/cars?category=supercars"
              className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{
                backgroundImage: 'url("/category-images/supercars.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-all duration-300"></div>
              <div className="aspect-square flex flex-col items-center justify-center p-6 text-white relative z-10">
                <h3 className="text-lg md:text-xl font-bold text-center">Supercars</h3>
                <p className="text-sm text-gray-200 text-center mt-2">Ultimate Performance</p>
              </div>
            </Link>

            {/* SUVs */}
            <Link
              href="/cars?category=suvs"
              className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{
                backgroundImage: 'url("/category-images/suvs.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-all duration-300"></div>
              <div className="aspect-square flex flex-col items-center justify-center p-6 text-white relative z-10">
                <h3 className="text-lg md:text-xl font-bold text-center">SUVs</h3>
                <p className="text-sm text-gray-200 text-center mt-2">Spacious & Powerful</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section 
        className="py-32 md:py-40 lg:py-48 relative overflow-hidden"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/Untitled-design-85.png"
            alt="Luxury cars background"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-20">
          <div className="flex flex-col">
            {/* Left Side: Text Content */}
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
                Who we are
              </h2>
              <p className="text-white text-base md:text-lg leading-relaxed mb-8">
                DB Luxury Cars is Morocco's premier destination for ultra-luxury car rentals. We specialize in providing extraordinary mobility experiences through our curated fleet of world-class vehicles, combined with personalized service and unwavering attention to detail. Every journey with us is crafted to exceed expectations.
              </p>
              <Link
                href="/about"
                className="inline-block bg-white text-black px-6 py-2.5 rounded-md font-semibold text-sm md:text-base hover:bg-gray-100 transition-all duration-300 no-underline shadow-sm hover:shadow-md"
                style={{ color: 'black' }}
              >
                COMPANY
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-4 md:px-6 lg:px-12">
          {/* Section Header */}
          <div className="text-center mb-16 md:mb-20">
            <div className="inline-block mb-3">
              <span className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-[0.2em]">
                Premium Selection
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-5 tracking-[-0.03em] leading-[1.1]">
              Featured Cars
            </h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
              Discover our most exclusive collection of premium vehicles
            </p>
          </div>

          {/* Featured Cars Grid */}
          {featuredVehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5 mb-12 max-w-[90rem] mx-auto">
              {featuredVehicles.map((vehicle, index) => (
                <FeaturedCarCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  priority={index < 3} // Prioritize first 3 images
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Loading featured vehicles...</p>
            </div>
          )}

          {/* View All Button */}
          <div className="text-center mt-16">
            <Link
              href="/cars"
              className="group/btn inline-flex items-center gap-2.5 px-8 py-3 bg-black text-white font-medium text-sm md:text-base rounded-full hover:bg-gray-900 transition-all duration-500 uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span>View All Cars</span>
              <svg 
                className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform duration-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <ReviewCarousel visibleCards={3} />

    </>
  );
}
