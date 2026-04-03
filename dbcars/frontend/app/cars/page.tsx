'use client';

import { useEffect, useState, Suspense, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getVehicles, getLocations } from '@/lib/api';
import VehicleCard from '@/components/VehicleCard';

type SortOption = 'price_low' | 'price_high' | 'year_new' | 'year_old' | 'name_asc' | 'name_desc';

function CarsPageContent() {
  const searchParams = useSearchParams();
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    make: '',
    location: searchParams.get('location') || '',
    available_from: searchParams.get('available_from') || '',
    available_to: searchParams.get('available_to') || '',
    min_price: '',
    max_price: '',
    transmission: '',
    fuel_type: '',
    seats: '',
    year_min: '',
    year_max: '',
  });
  const [sortBy, setSortBy] = useState<SortOption>('price_low');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  
  
  // Get unique makes/brands from vehicles
  const uniqueMakes = useMemo(() => {
    const makes = new Set(allVehicles.map((v) => v.make).filter(Boolean));
    return Array.from(makes).sort();
  }, [allVehicles]);

  // Scroll to top on mobile when filters open and prevent body scroll
  useEffect(() => {
    if (showFilters) {
      // On mobile, scroll to top when filters open
      if (window.innerWidth < 640) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Prevent body scroll when filter menu is open on mobile
        document.body.style.overflow = 'hidden';
      }
      
      return () => {
        // Restore body scroll when filter menu closes
        document.body.style.overflow = '';
      };
    } else {
      // Restore body scroll when filter menu is closed
      document.body.style.overflow = '';
    }
  }, [showFilters]);

  useEffect(() => {
    // Update filters from URL params on mount
    const locationParam = searchParams.get('location');
    const fromParam = searchParams.get('available_from');
    const toParam = searchParams.get('available_to');
    
    if (locationParam || fromParam || toParam) {
      setFilters((prev) => ({
        ...prev,
        category: '',
        location: locationParam || '',
        available_from: fromParam || '',
        available_to: toParam || '',
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close filters immediately when mobile menu opens
  useEffect(() => {
    const checkMenuState = () => {
      // Check if mobile menu is open by looking for the menu element with high z-index
      const mobileMenu = document.querySelector('[style*="zIndex: 9999999"]');
      if (mobileMenu) {
        const style = window.getComputedStyle(mobileMenu);
        const transform = style.transform;
        // If menu is visible (translate-x-0 means it's not off-screen)
        if (transform === 'none' || transform.includes('0, 0, 0, 1, 0') || !transform.includes('280')) {
          setShowFilters(false);
        }
      }
    };

    // Check immediately and then periodically
    const interval = setInterval(checkMenuState, 10);
    checkMenuState(); // Check immediately

    // Also listen for menu button clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[aria-label="Toggle menu"]') || target.closest('.mobile-menu-button')) {
        setTimeout(() => setShowFilters(false), 0);
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.location, filters.available_from, filters.available_to, filters.min_price, filters.max_price]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters: any = {
        category: filters.category || undefined,
        location: filters.location || undefined,
        available_from: filters.available_from || undefined,
        available_to: filters.available_to || undefined,
        min_price: filters.min_price ? Number(filters.min_price) : undefined,
        max_price: filters.max_price ? Number(filters.max_price) : undefined,
      };
      
      const [vehiclesData, locationsData] = await Promise.all([
        getVehicles(apiFilters),
        getLocations(),
      ]);
      setAllVehicles(vehiclesData);
      setLocations(locationsData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error?.name === 'NetworkError' || error?.code === 'ECONNREFUSED' || error?.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please ensure the backend is running at http://localhost:3001');
      } else {
        setError('Failed to load vehicles. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      make: '',
      location: '',
      available_from: '',
      available_to: '',
      min_price: '',
      max_price: '',
      transmission: '',
      fuel_type: '',
      seats: '',
      year_min: '',
      year_max: '',
    });
    setSearchQuery('');
  };

  // Get active filters count (excluding location and dates which are in header)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.make) count++;
    if (filters.transmission) count++;
    if (filters.fuel_type) count++;
    if (filters.seats) count++;
    if (filters.year_min) count++;
    if (filters.year_max) count++;
    if (filters.min_price) count++;
    if (filters.max_price) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [filters, searchQuery]);

  // Filter and sort vehicles
  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = [...allVehicles];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((v) =>
        `${v.make} ${v.model}`.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query)
      );
    }

    // Apply client-side filters
    if (filters.make) {
      filtered = filtered.filter((v) => v.make === filters.make);
    }
    if (filters.transmission) {
      filtered = filtered.filter((v) => v.transmission === filters.transmission);
    }
    if (filters.fuel_type) {
      filtered = filtered.filter((v) => v.fuel_type === filters.fuel_type);
    }
    if (filters.seats) {
      filtered = filtered.filter((v) => v.seats === Number(filters.seats));
    }
    if (filters.year_min) {
      filtered = filtered.filter((v) => v.year >= Number(filters.year_min));
    }
    if (filters.year_max) {
      filtered = filtered.filter((v) => v.year <= Number(filters.year_max));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return (a.base_price_daily || 0) - (b.base_price_daily || 0);
        case 'price_high':
          return (b.base_price_daily || 0) - (a.base_price_daily || 0);
        case 'year_new':
          return (b.year || 0) - (a.year || 0);
        case 'year_old':
          return (a.year || 0) - (b.year || 0);
        case 'name_asc':
          return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
        case 'name_desc':
          return `${b.make} ${b.model}`.localeCompare(`${a.make} ${a.model}`);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allVehicles, filters.make, filters.transmission, filters.fuel_type, filters.seats, filters.year_min, filters.year_max, sortBy, searchQuery]);

  // Get active filter labels for display
  const getActiveFilterLabel = (key: string, value: string) => {
    switch (key) {
      case 'category':
        const categoryLabels: { [key: string]: string } = {
          'luxury_sedans': 'Luxury Sedans',
          'luxury-sedans': 'Luxury Sedans',
          'economic': 'Economic',
          'sportscars': 'Sportscars',
          'sports-cars': 'Sportscars',
          'supercars': 'Supercars',
          'suvs': 'SUVs'
        };
        return categoryLabels[value] || value;
      case 'make':
        return value;
      case 'location':
        const loc = locations.find((l) => l.id === value);
        return loc ? `${loc.name} - ${loc.city}` : '';
      case 'transmission':
        return value === 'automatic' ? 'Automatic' : 'Manual';
      case 'fuel_type':
        return value.charAt(0).toUpperCase() + value.slice(1);
      case 'seats':
        return `${value} Seats`;
      case 'year_min':
        return `Year: ${value}+`;
      case 'year_max':
        return `Year: ≤${value}`;
      case 'min_price':
        return `Min: €${value}/day`;
      case 'max_price':
        return `Max: €${value}/day`;
      case 'available_from':
        return `From: ${new Date(value).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}`;
      case 'available_to':
        return `To: ${new Date(value).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}`;
      default:
        return value;
    }
  };

  const removeFilter = (key: string) => {
    setFilters((prev) => ({ ...prev, [key]: '' }));
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[48vh] min-h-[360px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-cars.jpg"
            alt="Luxury car collection"
            fill
            className="object-cover"
            priority
            quality={90}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60"></div>
        </div>
        <div className="relative z-20 container mx-auto px-4 md:px-6 lg:px-12 h-full flex items-end pb-16 md:pb-24">
          <div className="text-white">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4">
              Our Cars
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
              Discover our premium collection of luxury vehicles
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-black min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Search and Quick Actions Bar */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl shadow-sm border border-zinc-800 p-4 mb-6 relative z-50">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by make, model, or description..."
                className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-zinc-500"
              />
            </div>
            
            {/* Sort and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 bg-zinc-950 rounded-lg px-3 py-2 border border-zinc-800">
                <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent border-none focus:ring-0 text-sm font-medium text-white cursor-pointer"
                >
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="year_new">Year: Newest</option>
                  <option value="year_old">Year: Oldest</option>
                  <option value="name_asc">Name: A-Z</option>
                  <option value="name_desc">Name: Z-A</option>
                </select>
              </div>
              
              <div className="relative z-[100]" ref={filterDropdownRef}>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative w-full sm:w-auto px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                
                {/* Desktop Dropdown Filters Menu */}
                {showFilters && (
                  <div className="hidden sm:block absolute right-0 mt-2 w-96 bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 z-[99999] max-h-[80vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-800">
                        <h3 className="text-xl font-semibold text-white">Filter Vehicles</h3>
                        <button
                          onClick={() => setShowFilters(false)}
                          className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                          aria-label="Close filters"
                        >
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Brand/Make */}
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">Brand</label>
                          <select
                            value={filters.make}
                            onChange={(e) => handleFilterChange('make', e.target.value)}
                            className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                          >
                            <option value="">All Brands</option>
                            {uniqueMakes.map((make) => (
                              <option key={make} value={make}>
                                {make}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">Category</label>
                          <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                          >
                            <option value="">All Categories</option>
                            <option value="luxury_sedans">Luxury Sedans</option>
                            <option value="economic">Economic</option>
                            <option value="sportscars">Sportscars</option>
                            <option value="supercars">Supercars</option>
                            <option value="suvs">SUVs</option>
                          </select>
                        </div>

                        {/* Transmission */}
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">Transmission</label>
                          <select
                            value={filters.transmission}
                            onChange={(e) => handleFilterChange('transmission', e.target.value)}
                            className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                          >
                            <option value="">All Types</option>
                            <option value="automatic">Automatic</option>
                            <option value="manual">Manual</option>
                          </select>
                        </div>

                        {/* Fuel Type */}
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">Fuel Type</label>
                          <select
                            value={filters.fuel_type}
                            onChange={(e) => handleFilterChange('fuel_type', e.target.value)}
                            className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                          >
                            <option value="">All Types</option>
                            <option value="gasoline">Gasoline</option>
                            <option value="diesel">Diesel</option>
                            <option value="electric">Electric</option>
                            <option value="hybrid">Hybrid</option>
                          </select>
                        </div>

                        {/* Seats */}
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">Seats</label>
                          <select
                            value={filters.seats}
                            onChange={(e) => handleFilterChange('seats', e.target.value)}
                            className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                          >
                            <option value="">All</option>
                            <option value="2">2 Seats</option>
                            <option value="4">4 Seats</option>
                            <option value="5">5 Seats</option>
                            <option value="7">7 Seats</option>
                          </select>
                        </div>

                        {/* Year Range */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-white mb-2">Year Min</label>
                            <input
                              type="number"
                              value={filters.year_min}
                              onChange={(e) => handleFilterChange('year_min', e.target.value)}
                              placeholder="2000"
                              min="1900"
                              max={new Date().getFullYear()}
                              className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-zinc-600"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-white mb-2">Year Max</label>
                            <input
                              type="number"
                              value={filters.year_max}
                              onChange={(e) => handleFilterChange('year_max', e.target.value)}
                              placeholder={new Date().getFullYear().toString()}
                              min="1900"
                              max={new Date().getFullYear()}
                              className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-zinc-600"
                            />
                          </div>
                        </div>

                        {/* Price Range */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-white mb-2">Min Price</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">€</span>
                              <input
                                type="number"
                                value={filters.min_price}
                                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                                placeholder="0"
                                min="0"
                                className="w-full pl-8 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-zinc-600"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-white mb-2">Max Price</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">€</span>
                              <input
                                type="number"
                                value={filters.max_price}
                                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                                placeholder="∞"
                                min="0"
                                className="w-full pl-8 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-zinc-600"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-zinc-800">
                          {activeFiltersCount > 0 && (
                            <button
                              onClick={clearFilters}
                              className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium"
                            >
                              Clear All
                            </button>
                          )}
                          <button
                            onClick={() => setShowFilters(false)}
                            className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                          >
                            Apply Filters
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Filter Menu - Rendered via Portal */}
          {mounted && showFilters && createPortal(
            <>
              {/* Mobile Backdrop */}
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm sm:hidden"
                style={{ zIndex: 10 }}
                onClick={() => setShowFilters(false)}
              />
              
              {/* Mobile Filters Menu */}
              <div 
                className="fixed left-0 right-0 top-0 w-full bg-zinc-900 rounded-none shadow-2xl border-0 h-screen overflow-y-auto sm:hidden"
                style={{ zIndex: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-800">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">Filter Vehicles</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                      aria-label="Close filters"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Brand/Make */}
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Brand</label>
                      <select
                        value={filters.make}
                        onChange={(e) => handleFilterChange('make', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                      >
                        <option value="">All Brands</option>
                        {uniqueMakes.map((make) => (
                          <option key={make} value={make}>
                            {make}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Category</label>
                      <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                      >
                        <option value="">All Categories</option>
                        <option value="luxury_sedans">Luxury Sedans</option>
                        <option value="economic">Economic</option>
                        <option value="sportscars">Sportscars</option>
                        <option value="supercars">Supercars</option>
                        <option value="suvs">SUVs</option>
                      </select>
                    </div>

                    {/* Transmission */}
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Transmission</label>
                      <select
                        value={filters.transmission}
                        onChange={(e) => handleFilterChange('transmission', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                      >
                        <option value="">All Types</option>
                        <option value="automatic">Automatic</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>

                    {/* Fuel Type */}
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Fuel Type</label>
                      <select
                        value={filters.fuel_type}
                        onChange={(e) => handleFilterChange('fuel_type', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                      >
                        <option value="">All Types</option>
                        <option value="gasoline">Gasoline</option>
                        <option value="diesel">Diesel</option>
                        <option value="electric">Electric</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>

                    {/* Seats */}
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Seats</label>
                      <select
                        value={filters.seats}
                        onChange={(e) => handleFilterChange('seats', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                      >
                        <option value="">All</option>
                        <option value="2">2 Seats</option>
                        <option value="4">4 Seats</option>
                        <option value="5">5 Seats</option>
                        <option value="7">7 Seats</option>
                      </select>
                    </div>

                    {/* Year Range */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">Year Min</label>
                        <input
                          type="number"
                          value={filters.year_min}
                          onChange={(e) => handleFilterChange('year_min', e.target.value)}
                          placeholder="2000"
                          min="1900"
                          max={new Date().getFullYear()}
                          className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">Year Max</label>
                        <input
                          type="number"
                          value={filters.year_max}
                          onChange={(e) => handleFilterChange('year_max', e.target.value)}
                          placeholder={new Date().getFullYear().toString()}
                          min="1900"
                          max={new Date().getFullYear()}
                          className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-zinc-600"
                        />
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">Min Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">€</span>
                          <input
                            type="number"
                            value={filters.min_price}
                            onChange={(e) => handleFilterChange('min_price', e.target.value)}
                            placeholder="0"
                            min="0"
                            className="w-full pl-8 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-zinc-600"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">Max Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">€</span>
                          <input
                            type="number"
                            value={filters.max_price}
                            onChange={(e) => handleFilterChange('max_price', e.target.value)}
                            placeholder="∞"
                            min="0"
                            className="w-full pl-8 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-zinc-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-zinc-800">
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={clearFilters}
                          className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium"
                        >
                          Clear All
                        </button>
                      )}
                      <button
                        onClick={() => setShowFilters(false)}
                        className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}

          {/* Quick Category Filters */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-zinc-400 w-full sm:w-auto mb-1 sm:mb-0">Quick filters:</span>
              <button
                onClick={() => handleFilterChange('category', filters.category === 'luxury_sedans' ? '' : 'luxury_sedans')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  filters.category === 'luxury_sedans'
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Luxury Sedans
              </button>
              <button
                onClick={() => handleFilterChange('category', filters.category === 'economic' ? '' : 'economic')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  filters.category === 'economic'
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Economic
              </button>
              <button
                onClick={() => handleFilterChange('category', filters.category === 'sportscars' ? '' : 'sportscars')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  filters.category === 'sportscars'
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Sportscars
              </button>
              <button
                onClick={() => handleFilterChange('category', filters.category === 'supercars' ? '' : 'supercars')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  filters.category === 'supercars'
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Supercars
              </button>
              <button
                onClick={() => handleFilterChange('category', filters.category === 'suvs' ? '' : 'suvs')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  filters.category === 'suvs'
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                SUVs
              </button>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="ml-auto px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-zinc-400 hover:text-white font-medium underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Chips */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-zinc-400 w-full sm:w-auto mb-1 sm:mb-0">Active filters:</span>
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-full text-xs sm:text-sm font-medium">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-white">
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {Object.entries(filters).map(([key, value]) => {
                  // Exclude location and dates from active filter chips (they're in header)
                  if (!value || key === 'location' || key === 'available_from' || key === 'available_to') return null;
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-full text-xs sm:text-sm font-medium"
                    >
                      {getActiveFilterLabel(key, value)}
                      <button onClick={() => removeFilter(key)} className="hover:text-white">
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">
            {loading ? (
              <span className="text-zinc-500">Loading vehicles...</span>
            ) : (
              <>
                <span className="text-white">{filteredAndSortedVehicles.length}</span>
                <span className="text-zinc-400"> vehicle{filteredAndSortedVehicles.length !== 1 ? 's' : ''} found</span>
              </>
              )}
          </h2>
        </div>


        {/* Vehicles Grid */}
        <div className="relative z-10">
          {error ? (
            <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-red-800">
              <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">Connection Error</h3>
              <p className="text-zinc-400 mb-4">{error}</p>
              <button
                onClick={loadData}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
              <p className="text-zinc-400 text-lg">Loading vehicles...</p>
            </div>
          ) : filteredAndSortedVehicles.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <svg className="mx-auto h-16 w-16 text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No vehicles found</h3>
              <p className="text-zinc-400 mb-6">Try adjusting your filters or search query.</p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedVehicles.map((vehicle, index) => (
                <div key={vehicle.id}>
                  <VehicleCard 
                    vehicle={vehicle}
                    priority={index < 6}
                    searchParams={{
                      location: searchParams.get('location'),
                      available_from: searchParams.get('available_from'),
                      available_to: searchParams.get('available_to'),
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Banner Section */}
        <section className="relative mt-16 md:mt-20 lg:mt-24 py-12 md:py-16 rounded-2xl overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero-cars.jpg"
              alt="Luxury car collection"
              fill
              className="object-cover"
              priority={false}
              quality={90}
            />
            <div className="absolute inset-0 bg-black/60"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
                Can&apos;t find the car you&apos;re looking for?
              </h2>
              <div className="text-gray-300 mb-6 leading-relaxed space-y-2">
                <p className="block text-lg md:text-xl">
                  We&apos;re here to help you find the perfect vehicle for your journey.
                </p>
                <p className="block text-base md:text-lg">
                  Tell us what you need and we&apos;ll find it for you.
                </p>
              </div>
              <div>
                <Link
                  href="/contact"
                  className="inline-block px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm rounded-md transition-colors duration-300"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      </div>
    </>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CarsPageContent />
    </Suspense>
  );
}

