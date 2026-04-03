'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Search, Car } from 'lucide-react';
import VehicleCard from './VehicleCard';
import EmptyState from '@/components/admin/EmptyState';

interface VehiclePanelProps {
  vehicles: any[];
  subunits: any[];
  availabilityData: any;
  selectedVehicle: string | null;
  searchQuery?: string;
  onVehicleSelect: (vehicleId: string | null) => void;
  onSubunitStatusChange?: (subunitId: string, status: string) => void;
  onStatusClick?: (status: string) => void;
  loadingSubunits?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function VehiclePanel({
  vehicles,
  subunits,
  availabilityData,
  selectedVehicle,
  searchQuery = '',
  onVehicleSelect,
  onSubunitStatusChange,
  onStatusClick,
  loadingSubunits = false,
  collapsed = false,
  onToggleCollapse,
}: VehiclePanelProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // Merge availability data with vehicles
  const vehiclesWithAvailability = vehicles.map((vehicle) => {
    const availabilityInfo = availabilityData?.vehicles?.find(
      (v: any) => v.vehicle_id === vehicle.id
    );
    return {
      ...vehicle,
      total_subunits: availabilityInfo?.total_subunits || vehicle.total_subunits || 0,
      available_subunits: availabilityInfo?.available_subunits || 0,
      reserved_subunits: availabilityInfo?.reserved_subunits || 0,
      out_on_rent_subunits: availabilityInfo?.out_on_rent_subunits || 0,
      returned_subunits: availabilityInfo?.returned_subunits || 0,
      maintenance_subunits: availabilityInfo?.maintenance_subunits || 0,
    };
  });

  // Filter vehicles by search for dropdown - match from start
  const searchResults = vehiclesWithAvailability.filter((vehicle) => {
    if (!localSearch) return false;
    const search = localSearch.toLowerCase().trim();
    const make = vehicle.make?.toLowerCase() || '';
    const model = vehicle.model?.toLowerCase() || '';
    const fullName = `${make} ${model}`.trim();
    return (
      make.startsWith(search) ||
      model.startsWith(search) ||
      fullName.startsWith(search)
    );
  });

  // Filter vehicles by search for main list
  const filteredVehicles = vehiclesWithAvailability.filter((vehicle) => {
    if (!localSearch) return true;
    const search = localSearch.toLowerCase();
    return (
      vehicle.make?.toLowerCase().includes(search) ||
      vehicle.model?.toLowerCase().includes(search) ||
      vehicle.year?.toString().includes(search)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show dropdown when typing
  useEffect(() => {
    if (localSearch && searchResults.length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [localSearch, vehicles.length]);

  const handleVehicleSelectFromDropdown = (vehicleId: string) => {
    onVehicleSelect(vehicleId);
    setLocalSearch('');
    setShowDropdown(false);
  };

  if (collapsed) {
    return (
      <div className="hidden lg:flex w-16 bg-gray-900 border-r border-gray-800 flex-col items-center py-4 shadow-sm">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-xl transition-all mb-4"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
        <Car className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-full lg:w-72 bg-gray-900 border-r border-gray-800 flex flex-col min-h-0 shadow-sm">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900 flex-shrink-0">
        <h2 className="text-base sm:text-lg font-bold text-white">Vehicles</h2>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-xl transition-all"
          >
            <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <div ref={searchWrapperRef} className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400 pointer-events-none z-10" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onFocus={() => {
              if (localSearch && searchResults.length > 0) {
                setShowDropdown(true);
              }
            }}
            placeholder="Search vehicles..."
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder-gray-400"
          />
          
          {/* Dropdown Results */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
              {searchResults.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => handleVehicleSelectFromDropdown(vehicle.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-xs text-gray-400">
                        {vehicle.year}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vehicle List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {/* All Cars Button */}
        <button
          onClick={() => onVehicleSelect(null)}
          className={`
            w-full p-3 rounded-xl border-2 transition-all text-left
            ${
              selectedVehicle === null
                ? 'border-orange-500 bg-orange-500/10 shadow-md shadow-orange-500/20'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Car className={`w-4 h-4 ${selectedVehicle === null ? 'text-orange-500' : 'text-gray-400'}`} />
            <span className={`font-semibold text-sm ${selectedVehicle === null ? 'text-orange-500' : 'text-white'}`}>
              All Cars
            </span>
          </div>
        </button>

        {filteredVehicles.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No vehicles found"
            description={
              localSearch
                ? 'Try adjusting your search'
                : 'No vehicles available'
            }
          />
        ) : (
          filteredVehicles.map((vehicle) => {
            // Subunits are already filtered by selectedVehicle in the parent
            const vehicleSubunits = selectedVehicle === vehicle.id ? subunits : [];
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                subunits={vehicleSubunits}
                isSelected={selectedVehicle === vehicle.id}
                onClick={() => onVehicleSelect(vehicle.id)}
                onSubunitStatusChange={onSubunitStatusChange}
                loadingSubunits={loadingSubunits}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
