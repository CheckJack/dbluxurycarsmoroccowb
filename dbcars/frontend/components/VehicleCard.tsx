'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

interface VehicleCardProps {
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    category: string;
    base_price_daily: number;
    images?: string[];
    description?: string;
    transmission?: string;
    fuel_type?: string;
    seats?: number;
    features?: string[];
  };
  searchParams?: {
    location?: string | null;
    available_from?: string | null;
    available_to?: string | null;
  };
  priority?: boolean;
}

export default function VehicleCard({ vehicle, searchParams, priority = false }: VehicleCardProps) {
  const [imageError, setImageError] = useState(false);
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'luxury_sedans':
        return 'Luxury Sedans';
      case 'economic':
        return 'Economic';
      case 'sportscars':
        return 'Sportscars';
      case 'supercars':
        return 'Supercars';
      case 'suvs':
        return 'SUVs';
      default:
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'luxury_sedans':
        return 'bg-blue-600/90 text-white';
      case 'economic':
        return 'bg-gray-600/90 text-white';
      case 'sportscars':
        return 'bg-red-600/90 text-white';
      case 'supercars':
        return 'bg-purple-600/90 text-white';
      case 'suvs':
        return 'bg-orange-500/90 text-white';
      default:
        return 'bg-gray-700/90 text-white';
    }
  };

  const transmission = vehicle.transmission || 'automatic';
  const fuelType = vehicle.fuel_type || 'gasoline';
  const seats = vehicle.seats || 4;
  const imageUrl = vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : null;

  // Build URL with preserved search params (location, dates)
  const getVehicleUrl = () => {
    if (!searchParams) return `/cars/${vehicle.id}`;
    
    const params = new URLSearchParams();
    if (searchParams.location) params.set('location', searchParams.location);
    if (searchParams.available_from) params.set('available_from', searchParams.available_from);
    if (searchParams.available_to) params.set('available_to', searchParams.available_to);
    
    const queryString = params.toString();
    return `/cars/${vehicle.id}${queryString ? `?${queryString}` : ''}`;
  };

  return (
    <Link
      href={getVehicleUrl()}
      className="group relative block overflow-hidden rounded-lg bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10"
    >
      {/* Image Section */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-zinc-950">
        {imageUrl && !imageError ? (
          <Image
            src={getImageUrl(imageUrl) || ''}
            alt={`${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            priority={priority}
            quality={95}
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-950">
            <svg className="w-16 h-16 text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Category Badge - Clean & Minimal */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-md text-[10px] font-semibold bg-black/80 backdrop-blur-sm text-white border border-white/10 uppercase tracking-wider">
            {getCategoryLabel(vehicle.category)}
          </span>
        </div>
      </div>

      {/* Info Section - Clean & Spacious */}
      <div className="p-5 space-y-4">
        {/* Title & Year */}
        <div>
          <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
            {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-sm text-zinc-500">{vehicle.year}</p>
        </div>

        {/* Specs Grid - Clean Icons */}
        <div className="grid grid-cols-3 gap-3 py-3 border-y border-zinc-800">
          <div className="flex flex-col items-center gap-1.5">
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs text-zinc-400 font-medium">{seats} Seats</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs text-zinc-400 font-medium capitalize">{transmission}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs text-zinc-400 font-medium capitalize">{fuelType}</span>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">€{Number(vehicle.base_price_daily || 0).toFixed(0)}</span>
              <span className="text-sm text-zinc-500">/day</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-orange-500 group-hover:gap-3 transition-all">
            <span className="text-sm font-semibold">View</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

