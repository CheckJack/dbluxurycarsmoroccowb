'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getLocations } from '@/lib/api';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [dropoffDate, setDropoffDate] = useState<Date | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  // Memoize computed values to prevent unnecessary re-renders
  const isHomePage = useMemo(() => pathname === '/', [pathname]);
  const isAdminPage = useMemo(() => pathname?.startsWith('/admin'), [pathname]);
  const isAboutPage = useMemo(() => pathname === '/about', [pathname]);
  const isCarsListingPage = useMemo(() => pathname === '/cars', [pathname]);
  const isCarsPage = useMemo(() => pathname === '/cars' || pathname?.startsWith('/cars/'), [pathname]);
  const isIndividualCarPage = useMemo(() => pathname?.startsWith('/cars/') && pathname !== '/cars', [pathname]);
  const isBlogPage = useMemo(() => pathname === '/blog' || pathname?.startsWith('/blog/'), [pathname]);
  const hasHeroSection = isHomePage;
  const isBlogListingPage = pathname === '/blog';
  const isFAQPage = pathname === '/faq';
  const isContactPage = pathname === '/contact';
  const hasHeroHeader = isHomePage || isAboutPage || isBlogListingPage || isFAQPage || isContactPage || isCarsListingPage;

  // Hero header (home + about): transparent at top; hide on scroll down; show black on scroll up
  const [headerVisible, setHeaderVisible] = useState(true);
  const [showBlackBg, setShowBlackBg] = useState(false);
  const lastScrollY = useRef(0);
  const rafId = useRef<number | null>(null);
  const scrollThreshold = 100;
  const scrollDeltaThreshold = 12;

  useEffect(() => {
    if (!hasHeroHeader) return;
    const updateHeader = () => {
      const y = window.scrollY;
      const pastTop = y > scrollThreshold;

      if (y <= scrollThreshold) {
        // At top: always visible and transparent
        setHeaderVisible(true);
        setShowBlackBg(false);
      } else {
        const scrollingUp = y < lastScrollY.current;
        const delta = Math.abs(y - lastScrollY.current);

        if (scrollingUp && delta >= scrollDeltaThreshold) {
          setHeaderVisible(true);
          setShowBlackBg(true); // past top + scrolling up = show header with black
        } else if (!scrollingUp && delta >= scrollDeltaThreshold) {
          setHeaderVisible(false);
          // keep showBlackBg as-is until next scroll up
        }
      }
      lastScrollY.current = y;
      rafId.current = null;
    };
    const handleScroll = () => {
      if (rafId.current == null) {
        rafId.current = requestAnimationFrame(updateHeader);
      }
    };
    // Do NOT run on mount – keep initial state (visible, transparent) until user scrolls
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, [hasHeroHeader]);

  const headerBg = hasHeroHeader
    ? (showBlackBg && headerVisible ? 'bg-black' : 'bg-transparent')
    : 'bg-black';
  const heroHeaderFixed = hasHeroHeader;
  const heroHeaderHidden = hasHeroHeader && !headerVisible;

  // Load locations only when needed (memoized to prevent unnecessary calls)
  useEffect(() => {
    if (isCarsListingPage && locations.length === 0) {
      getLocations().then(setLocations).catch(console.error);
    }
  }, [isCarsListingPage, locations.length]);

  // Load from URL params on mount
  useEffect(() => {
    if (isCarsListingPage) {
      const locationParam = searchParams.get('location') || '';
      const fromParam = searchParams.get('available_from') || '';
      const toParam = searchParams.get('available_to') || '';
      
      setPickupLocation(locationParam);
      setPickupDate(fromParam ? new Date(fromParam) : null);
      setDropoffDate(toParam ? new Date(toParam) : null);
    } else {
      // Reset when leaving cars page
      setPickupLocation('');
      setPickupDate(null);
      setDropoffDate(null);
    }
  }, [isCarsListingPage, searchParams]);

  // Save to localStorage and update URL when filters change (debounced to avoid infinite loops)
  useEffect(() => {
    if (!isCarsListingPage || typeof window === 'undefined') return;
    
    const timeoutId = setTimeout(() => {
      try {
        // Save to localStorage for persistence across pages
        if (pickupLocation || pickupDate || dropoffDate) {
          // Read existing data to preserve dropoff_location_id and showReturnLocation
          const existingData = localStorage.getItem('carSearchData');
          const existing = existingData ? JSON.parse(existingData) : {};
          
          // Merge with new data, preserving fields not managed by header
          const searchData = {
            ...existing, // Preserve all existing fields including dropoff_location_id and showReturnLocation
            pickup_location_id: pickupLocation,
            pickup_date: pickupDate ? pickupDate.toISOString() : null,
            dropoff_date: dropoffDate ? dropoffDate.toISOString() : null,
            savedAt: new Date().toISOString(),
          };
          
          localStorage.setItem('carSearchData', JSON.stringify(searchData));
        }
        
        const params = new URLSearchParams(searchParams.toString());
        let hasChanges = false;
        
        const currentLocation = params.get('location') || '';
        const currentFrom = params.get('available_from') || '';
        const currentTo = params.get('available_to') || '';
        
        if (pickupLocation) {
          if (currentLocation !== pickupLocation) {
            params.set('location', pickupLocation);
            hasChanges = true;
          }
        } else {
          if (currentLocation) {
            params.delete('location');
            hasChanges = true;
          }
        }
        
        if (pickupDate) {
          const dateStr = pickupDate.toISOString().split('T')[0];
          if (currentFrom !== dateStr) {
            params.set('available_from', dateStr);
            hasChanges = true;
          }
        } else {
          if (currentFrom) {
            params.delete('available_from');
            hasChanges = true;
          }
        }
        
        if (dropoffDate) {
          const dateStr = dropoffDate.toISOString().split('T')[0];
          if (currentTo !== dateStr) {
            params.set('available_to', dateStr);
            hasChanges = true;
          }
        } else {
          if (currentTo) {
            params.delete('available_to');
            hasChanges = true;
          }
        }
        
        // Only push if there are actual changes to avoid infinite loops
        if (hasChanges) {
          const newUrl = `/cars?${params.toString()}`;
          const currentUrl = window.location.pathname + window.location.search;
          if (currentUrl !== newUrl) {
            router.push(newUrl);
          }
        }
      } catch (error) {
        console.error('Error updating URL params:', error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupLocation, pickupDate, dropoffDate, isCarsListingPage, searchParams, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMenuOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        const menuButton = document.querySelector('[aria-label="Toggle menu"]');
        if (menuButton && !menuButton.contains(event.target as Node)) {
          setIsMenuOpen(false);
        }
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show header on admin pages or individual car pages
  if (isAdminPage || isIndividualCarPage) {
    return null;
  }

  return (
    <header
      className={`z-50 ${headerBg} ${
        heroHeaderFixed ? 'fixed top-0 left-0 right-0' : 'relative'
      } ${heroHeaderHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${hasHeroHeader ? 'transition-none' : 'transition-colors duration-200'}`}
    >
      <nav className="container mx-auto px-4 md:px-6 py-4 bg-transparent">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            prefetch={true}
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <Image
              src="/logodb.png"
              alt="DB Luxury Cars"
              width={200}
              height={80}
              className="h-14 md:h-16 lg:h-20 w-auto object-contain"
              priority
              unoptimized
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="transition-colors font-medium text-white hover:text-gray-200"
            >
              Home
            </Link>
          <Link
            href="/about"
            prefetch={true}
            className="transition-colors font-medium text-white hover:text-gray-200"
          >
            About us
          </Link>
            <Link
              href="/cars"
              prefetch={true}
              className="transition-colors font-medium text-white hover:text-gray-200"
            >
              Our Cars
            </Link>
            <Link
              href="/blog"
              prefetch={true}
              className="transition-colors font-medium text-white hover:text-gray-200"
            >
              Blog
            </Link>
            <Link
              href="/faq"
              prefetch={true}
              className="transition-colors font-medium text-white hover:text-gray-200"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              prefetch={true}
              className="transition-colors font-medium text-white hover:text-gray-200"
            >
              Contacts
            </Link>
            <Link
              href="/admin"
              prefetch={true}
              className="px-5 py-2 rounded-md transition-colors font-medium bg-white text-black hover:bg-gray-100"
            >
              Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden mobile-menu-button text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <svg
              className="w-6 h-6 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ transform: isMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation - Rendered via Portal to ensure highest z-index */}
        {mounted && isMenuOpen && createPortal(
          <>
            {/* Mobile Navigation Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
              style={{ zIndex: 2147483646 }}
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Mobile Navigation Menu */}
            <div
              ref={mobileMenuRef}
              className={`fixed top-0 right-0 bottom-0 w-[280px] bg-black/95 backdrop-blur-lg md:hidden transform transition-transform duration-300 ease-in-out ${
                isMenuOpen ? 'translate-x-0' : 'translate-x-full'
              } overflow-y-auto`}
              style={{ zIndex: 2147483647 }}
            >
              {/* Logo in Mobile Menu */}
              <div className="flex justify-center items-center pt-6 pb-4 px-6">
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="transition-opacity hover:opacity-80"
                >
                  <Image
                    src="/logodb.png"
                    alt="DB Luxury Cars"
                    width={160}
                    height={64}
                    className="h-14 w-auto object-contain"
                    priority
                    unoptimized
                  />
                </Link>
              </div>

              <div className="flex flex-col py-6 px-6 space-y-2">
                <Link
                  href="/"
                  className="block font-medium text-lg transition-all text-white hover:text-orange-500 hover:translate-x-1 py-3 px-4 rounded-lg hover:bg-white/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className="block font-medium text-lg transition-all text-white hover:text-orange-500 hover:translate-x-1 py-3 px-4 rounded-lg hover:bg-white/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About us
                </Link>
                <Link
                  href="/cars"
                  className="block font-medium text-lg transition-all text-white hover:text-orange-500 hover:translate-x-1 py-3 px-4 rounded-lg hover:bg-white/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Our Cars
                </Link>
                <Link
                  href="/blog"
                  className="block font-medium text-lg transition-all text-white hover:text-orange-500 hover:translate-x-1 py-3 px-4 rounded-lg hover:bg-white/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Blog
                </Link>
                <Link
                  href="/faq"
                  className="block font-medium text-lg transition-all text-white hover:text-orange-500 hover:translate-x-1 py-3 px-4 rounded-lg hover:bg-white/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  FAQ
                </Link>
                <Link
                  href="/contact"
                  className="block font-medium text-lg transition-all text-white hover:text-orange-500 hover:translate-x-1 py-3 px-4 rounded-lg hover:bg-white/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contacts
                </Link>
                <div className="pt-4 mt-4 border-t border-white/10">
                  <Link
                    href="/admin"
                    className="block px-5 py-3 rounded-lg transition-all font-medium text-center text-base bg-white text-black hover:bg-orange-500 hover:text-white hover:scale-105"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
      </nav>
    </header>
  );
}

