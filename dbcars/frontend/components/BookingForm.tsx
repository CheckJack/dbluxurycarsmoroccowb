'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  getLocations,
  getExtras,
  checkAvailability,
  validateCoupon,
  createBooking,
  getVehicleBlockedDates,
} from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

interface BookingFormProps {
  vehicle: any;
  initialPickupDate?: Date | null;
  initialDropoffDate?: Date | null;
  initialPickupLocation?: string;
  initialDropoffLocation?: string;
  onStepChange?: (step: number) => void;
}

export default function BookingForm({ 
  vehicle, 
  initialPickupDate = null,
  initialDropoffDate = null,
  initialPickupLocation = '',
  initialDropoffLocation = '',
  onStepChange
}: BookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const hasNotifiedInitial = useRef(false);
  
  // Helper function to change step and notify parent
  const changeStep = (newStep: number) => {
    console.log('changeStep called with:', newStep, 'current step:', step);
    setStep((prevStep) => {
      console.log('setStep called, prev:', prevStep, 'new:', newStep);
      return newStep;
    });
    if (onStepChange) {
      console.log('Calling onStepChange with:', newStep);
      onStepChange(newStep);
    }
    // Scroll to top smoothly when step changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Notify parent of initial step only once
  useEffect(() => {
    if (onStepChange && !hasNotifiedInitial.current) {
      onStepChange(step);
      hasNotifiedInitial.current = true;
    }
  }, [onStepChange]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  
  // Blocked dates state
  const [blockedDatesData, setBlockedDatesData] = useState<any>(null);

  const [formData, setFormData] = useState({
    pickup_location_id: initialPickupLocation,
    dropoff_location_id: initialDropoffLocation,
    pickup_date: initialPickupDate,
    dropoff_date: initialDropoffDate,
    selected_extras: [] as any[],
    customer: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      phone_country_code: '+212',
      date_of_birth: '',
      license_expiry: '',
      address: '',
      city: '',
      country: 'Morocco',
    },
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (vehicle?.id) {
      loadBlockedDates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle?.id]);

  useEffect(() => {
    console.log('Step changed to:', step);
  }, [step]);

  const bookingExtrasList = useMemo(() => {
    const linkCountRaw = vehicle?.vehicle_extras_link_count;
    const linkCount =
      typeof linkCountRaw === 'number'
        ? linkCountRaw
        : parseInt(String(linkCountRaw ?? '0'), 10) || 0;
    const ids = vehicle?.available_extras;
    if (!vehicle) return extras;
    if (linkCount === 0) return extras;
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const idSet = new Set(ids.map((x: unknown) => String(x)));
    return extras.filter((e) => idSet.has(String(e.id)));
  }, [vehicle, extras]);

  useEffect(() => {
    const allowed = new Set(bookingExtrasList.map((e) => e.id));
    setFormData((prev) => {
      const next = prev.selected_extras.filter((s) => allowed.has(s.id));
      if (next.length === prev.selected_extras.length) return prev;
      return { ...prev, selected_extras: next };
    });
  }, [bookingExtrasList]);

  useEffect(() => {
    if (formData.pickup_date && formData.dropoff_date) {
      checkVehicleAvailability();
      calculatePricing();
    }
  }, [formData.pickup_date, formData.dropoff_date, formData.selected_extras, coupon, bookingExtrasList]);

  const loadInitialData = async () => {
    try {
      const [locationsData, extrasData] = await Promise.all([
        getLocations(),
        getExtras(),
      ]);
      setLocations(locationsData);
      setExtras(extrasData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadBlockedDates = async () => {
    try {
      // Load blocked dates for the next 12 months
      const data = await getVehicleBlockedDates(vehicle.id);
      setBlockedDatesData(data);
      console.log('Loaded blocked dates:', data);
    } catch (error) {
      console.error('Error loading blocked dates:', error);
    }
  };

  // Helper function to check if a date is available
  const isDateAvailable = (date: Date): boolean => {
    if (!blockedDatesData) return true;
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Check blocked dates (maintenance/blocked notes)
    if (blockedDatesData.blocked_dates) {
      const isBlocked = blockedDatesData.blocked_dates.some((note: any) => {
        const noteDate = new Date(note.note_date).toISOString().split('T')[0];
        return dateStr === noteDate;
      });
      if (isBlocked) return false;
    }
    
    // Check if date falls within any booking
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

  const checkVehicleAvailability = async () => {
    if (!formData.pickup_date || !formData.dropoff_date) return;

    try {
      // Use the selected dates with their times, or normalize if at start of day
      const normalizedPickupDate = new Date(formData.pickup_date);
      const pickupHours = normalizedPickupDate.getUTCHours();
      const pickupMinutes = normalizedPickupDate.getUTCMinutes();
      const pickupSeconds = normalizedPickupDate.getUTCSeconds();
      
      if (pickupHours === 0 && pickupMinutes === 0 && pickupSeconds === 0) {
        normalizedPickupDate.setUTCHours(0, 0, 0, 0);
      }
      
      const normalizedDropoffDate = new Date(formData.dropoff_date);
      const dropoffHours = normalizedDropoffDate.getUTCHours();
      const dropoffMinutes = normalizedDropoffDate.getUTCMinutes();
      const dropoffSeconds = normalizedDropoffDate.getUTCSeconds();
      
      if (dropoffHours === 0 && dropoffMinutes === 0 && dropoffSeconds === 0) {
        normalizedDropoffDate.setUTCHours(23, 59, 59, 999);
      }

      const availabilityData = await checkAvailability(
        vehicle.id,
        normalizedPickupDate.toISOString(),
        normalizedDropoffDate.toISOString()
      );
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };

  const calculatePricing = async () => {
    if (!formData.pickup_date || !formData.dropoff_date) return;

    try {
      // Calculate base price
      const days = Math.ceil(
        (formData.dropoff_date.getTime() - formData.pickup_date.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Ensure minimum 1 day rental
      const rentalDays = Math.max(1, days);
      
      // Calculate hours for display
      const hours = Math.ceil(
        (formData.dropoff_date.getTime() - formData.pickup_date.getTime()) /
          (1000 * 60 * 60)
      );

      let basePrice = vehicle.base_price_daily * rentalDays;
      if (rentalDays >= 30 && vehicle.base_price_monthly && vehicle.base_price_monthly > 0) {
        const months = Math.floor(rentalDays / 30);
        const remainingDays = rentalDays % 30;
        basePrice = vehicle.base_price_monthly * months + vehicle.base_price_daily * remainingDays;
      } else if (rentalDays >= 7 && vehicle.base_price_weekly && vehicle.base_price_weekly > 0) {
        const weeks = Math.floor(rentalDays / 7);
        const remainingDays = rentalDays % 7;
        basePrice = vehicle.base_price_weekly * weeks + vehicle.base_price_daily * remainingDays;
      }

      // Calculate extras price (only extras offered for this vehicle)
      let extrasPrice = 0;
        formData.selected_extras.forEach((selectedExtra) => {
        const extra = bookingExtrasList.find((e) => e.id === selectedExtra.id);
        if (extra) {
          if (extra.price_type === 'per_day') {
            extrasPrice += extra.price * rentalDays * (selectedExtra.quantity || 1);
          } else {
            extrasPrice += extra.price * (selectedExtra.quantity || 1);
          }
        }
      });

      // Apply coupon discount
      let discountAmount = 0;
      if (coupon) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = (basePrice + extrasPrice) * (coupon.discount_value / 100);
        } else {
          discountAmount = coupon.discount_value;
        }
      }

      const totalPrice = basePrice + extrasPrice - discountAmount;

      setPricing({
        days: rentalDays,
        hours,
        base_price: basePrice,
        extras_price: extrasPrice,
        discount_amount: discountAmount,
        total_price: totalPrice,
      });
    } catch (error) {
      console.error('Error calculating pricing:', error);
    }
  };

  const handleCouponValidate = async () => {
    if (!couponCode) return;

    setCouponError('');
    try {
      const couponData = await validateCoupon(
        couponCode,
        pricing?.total_price,
        pricing?.days
      );
      setCoupon(couponData);
      // Price will be recalculated automatically by useEffect when coupon changes
    } catch (error: any) {
      setCouponError(error.response?.data?.error || 'Invalid coupon code');
      setCoupon(null);
    }
  };

  const handleExtraToggle = (extraId: string) => {
    setFormData((prev) => {
      const existing = prev.selected_extras.find((e) => e.id === extraId);
      if (existing) {
        return {
          ...prev,
          selected_extras: prev.selected_extras.filter((e) => e.id !== extraId),
        };
      } else {
        return {
          ...prev,
          selected_extras: [...prev.selected_extras, { id: extraId, quantity: 1 }],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine country code with phone number
      const fullPhoneNumber = `${formData.customer.phone_country_code}${formData.customer.phone}`;
      
      // Prepare customer data without phone_country_code and with null license fields
      const customerData = {
        first_name: formData.customer.first_name,
        last_name: formData.customer.last_name,
        email: formData.customer.email,
        phone: fullPhoneNumber,
        date_of_birth: formData.customer.date_of_birth || null,
        license_number: null, // Removed from form
        license_country: null, // Removed from form
        license_expiry: formData.customer.license_expiry || null,
        address: formData.customer.address || null,
        city: formData.customer.city || null,
        country: formData.customer.country || null,
      };
      
      // Validate required fields before sending
      if (!formData.pickup_date || !formData.dropoff_date) {
        alert('Please select both pickup and dropoff dates');
        setLoading(false);
        return;
      }
      
      // Validate minimum 1 day (24 hours) rental period
      const timeDiff = formData.dropoff_date.getTime() - formData.pickup_date.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        alert(`Minimum rental period is 1 day (24 hours). Your selected period is ${Math.round(hoursDiff * 10) / 10} hours.`);
        setLoading(false);
        return;
      }
      
      if (!formData.pickup_location_id || !formData.dropoff_location_id) {
        alert('Please select both pickup and dropoff locations');
        setLoading(false);
        return;
      }
      
      if (!customerData.first_name || !customerData.last_name || !customerData.email || !customerData.phone) {
        alert('Please fill in all required customer information');
        setLoading(false);
        return;
      }

      // Normalize dates: if time is at start of day (00:00:00), normalize to full day range
      // Otherwise, use the selected time
      const normalizedPickupDate = new Date(formData.pickup_date);
      const pickupHours = normalizedPickupDate.getUTCHours();
      const pickupMinutes = normalizedPickupDate.getUTCMinutes();
      const pickupSeconds = normalizedPickupDate.getUTCSeconds();
      
      // Only normalize if time is exactly at start of day
      if (pickupHours === 0 && pickupMinutes === 0 && pickupSeconds === 0) {
        normalizedPickupDate.setUTCHours(0, 0, 0, 0);
      }
      
      const normalizedDropoffDate = new Date(formData.dropoff_date);
      const dropoffHours = normalizedDropoffDate.getUTCHours();
      const dropoffMinutes = normalizedDropoffDate.getUTCMinutes();
      const dropoffSeconds = normalizedDropoffDate.getUTCSeconds();
      
      // Only normalize if time is exactly at start of day
      if (dropoffHours === 0 && dropoffMinutes === 0 && dropoffSeconds === 0) {
        normalizedDropoffDate.setUTCHours(23, 59, 59, 999); // End of dropoff day
      }

      // Check availability before submitting
      try {
        const availabilityCheck = await checkAvailability(
          vehicle.id,
          normalizedPickupDate.toISOString(),
          normalizedDropoffDate.toISOString()
        );
        
        if (!availabilityCheck.available) {
          alert('Sorry, this vehicle is not available for the selected dates. Please choose different dates.');
          setLoading(false);
          return;
        }
      } catch (availabilityError) {
        console.error('Error checking availability before submission:', availabilityError);
        // Continue with submission - backend will also check availability
      }

      const bookingData: any = {
        vehicle_id: vehicle.id,
        pickup_location_id: formData.pickup_location_id,
        dropoff_location_id: formData.dropoff_location_id,
        pickup_date: normalizedPickupDate.toISOString(),
        dropoff_date: normalizedDropoffDate.toISOString(),
        extras: Array.isArray(formData.selected_extras) ? formData.selected_extras : [],
        customer: customerData,
      };
      
      // Only include coupon_code if it exists (validator expects string or undefined, not null)
      if (coupon?.code) {
        bookingData.coupon_code = coupon.code;
      }

      console.log('Final booking data being sent:', JSON.stringify(bookingData, null, 2));
      console.log('Booking data types:', {
        vehicle_id: typeof bookingData.vehicle_id,
        pickup_location_id: typeof bookingData.pickup_location_id,
        dropoff_location_id: typeof bookingData.dropoff_location_id,
        pickup_date: typeof bookingData.pickup_date,
        dropoff_date: typeof bookingData.dropoff_date,
        customer: typeof bookingData.customer,
        extras: Array.isArray(bookingData.extras),
      });
      
      const booking = await createBooking(bookingData);
      router.push(`/booking/confirmation?bookingNumber=${booking.booking_number}`);
    } catch (error: any) {
      console.error('Booking error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Error creating booking';
      let isAvailabilityError = false;
      
      if (error.response?.data) {
        // Check if response data is empty object
        if (Object.keys(error.response.data).length === 0) {
          errorMessage = 'Validation failed: Please check that all required fields are filled correctly.';
          console.error('Empty error response - likely validation issue');
        } else if (error.response.data.details) {
          errorMessage = `Validation error: ${error.response.data.details}`;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
          
          // Check if it's an availability error
          if (error.response.data.error.toLowerCase().includes('not available') || 
              error.response.data.error.toLowerCase().includes('availability')) {
            isAvailabilityError = true;
            errorMessage = 'Sorry, this vehicle is not available for the selected dates. Please choose different dates and try again.';
          }
          
          if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
            const errorList = error.response.data.errors.map((e: any) => {
              const param = e.param || e.path || 'unknown';
              const msg = e.msg || 'Invalid value';
              return `${param}: ${msg}`;
            }).join(', ');
            errorMessage += ` (${errorList})`;
          }
        } else if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          const errorList = error.response.data.errors.map((e: any) => {
            const param = e.param || e.path || 'unknown';
            const msg = e.msg || 'Invalid value';
            return `${param}: ${msg}`;
          }).join(', ');
          errorMessage = `Validation errors: ${errorList}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show user-friendly error message
      if (isAvailabilityError) {
        alert(errorMessage);
      } else {
        alert(`Error creating booking: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  console.log('BookingForm render - current step:', step);
  
  return (
    <div className="bg-white/5 backdrop-blur-xl p-4 md:p-8 rounded-xl md:rounded-2xl shadow-2xl border border-white/10 h-full flex flex-col w-full">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-white">Book Your Vehicle</h2>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs md:text-sm font-medium text-white/70">Step {step} of 3</span>
        <div className="flex-1 h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>
      </div>

      {/* Step 1: Dates and Locations */}
      {step === 1 && (
        <div className="flex-1 flex flex-col">
          <div className="space-y-4 md:space-y-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-white mb-1.5 md:mb-2">
                Pick-up Location
              </label>
              <select
                value={formData.pickup_location_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pickup_location_id: e.target.value,
                  }))
                }
                className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 backdrop-blur-sm text-white font-medium transition-all border border-white/10 hover:border-white/20"
                required
              >
                <option value="" className="bg-black">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-black">
                    {loc.name} - {loc.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-semibold text-white mb-1.5 md:mb-2">
                Drop-off Location
              </label>
              <select
                value={formData.dropoff_location_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dropoff_location_id: e.target.value,
                  }))
                }
                className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 backdrop-blur-sm text-white font-medium transition-all border border-white/10 hover:border-white/20"
                required
              >
                <option value="" className="bg-black">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-black">
                    {loc.name} - {loc.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-semibold text-white mb-1.5 md:mb-2">
                Pick-up Date & Time
              </label>
              <DatePicker
                selected={formData.pickup_date}
                onChange={(date: Date | null) => {
                  setFormData((prev) => {
                    // If dropoff date is same day or before new pickup date, reset it
                    let newDropoffDate = prev.dropoff_date;
                    if (date && prev.dropoff_date) {
                      const minDropoffDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
                      if (prev.dropoff_date <= date) {
                        newDropoffDate = null;
                      }
                    }
                    return { ...prev, pickup_date: date, dropoff_date: newDropoffDate };
                  });
                }}
                minDate={new Date()}
                filterDate={isDateAvailable}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="Time"
                dateFormat="dd/MM/yyyy HH:mm"
                placeholderText="Select date & time"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 backdrop-blur-sm text-white font-medium transition-all border border-white/10 hover:border-white/20"
                withPortal
                required
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-semibold text-white mb-1.5 md:mb-2">
                Drop-off Date & Time
              </label>
              <DatePicker
                selected={formData.dropoff_date}
                onChange={(date: Date | null) => {
                  setFormData((prev) => {
                    // Validate minimum 1 day rental period
                    if (date && prev.pickup_date) {
                      const timeDiff = date.getTime() - prev.pickup_date.getTime();
                      const hoursDiff = timeDiff / (1000 * 60 * 60);
                      if (hoursDiff < 24) {
                        // If less than 24 hours, set to exactly 24 hours after pickup
                        const minDropoffDate = new Date(prev.pickup_date.getTime() + 24 * 60 * 60 * 1000);
                        return { ...prev, dropoff_date: minDropoffDate };
                      }
                    }
                    return { ...prev, dropoff_date: date };
                  });
                }}
                minDate={
                  formData.pickup_date
                    ? (() => {
                        // Minimum date is the day after pickup (to ensure 24+ hours)
                        const minDate = new Date(formData.pickup_date);
                        minDate.setDate(minDate.getDate() + 1);
                        return minDate;
                      })()
                    : new Date()
                }
                filterDate={(date: Date) => {
                  if (!formData.pickup_date) return isDateAvailable(date);
                  // Prevent selecting same day as pickup
                  if (date.toDateString() === formData.pickup_date.toDateString()) {
                    return false;
                  }
                  return isDateAvailable(date);
                }}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="Time"
                dateFormat="dd/MM/yyyy HH:mm"
                placeholderText="Select date & time"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 backdrop-blur-sm text-white font-medium transition-all border border-white/10 hover:border-white/20"
                withPortal
                required
              />
              <p className="text-xs text-white/60 mt-1.5 md:mt-2">Minimum rental period is 1 day (24 hours)</p>
              {formData.pickup_date && formData.dropoff_date && (() => {
                const timeDiff = formData.dropoff_date.getTime() - formData.pickup_date.getTime();
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                if (hoursDiff < 24) {
                  return (
                    <p className="text-xs text-red-400 mt-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                      Rental period must be at least 24 hours. Current: {Math.round(hoursDiff * 10) / 10} hours
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {availability && (
            <div
              className={`p-4 rounded-xl border backdrop-blur-xl ${
                availability.available
                  ? 'bg-green-500/10 text-green-400 border-green-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}
            >
              {availability.available ? (
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="font-semibold">
                    Available ({availability.available_count} unit(s) available)
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="font-semibold">Not available for selected dates</p>
                </div>
              )}
            </div>
          )}

            {pricing && (
              <div className="bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-xl border border-white/10">
                <h3 className="font-bold text-base md:text-lg text-white mb-3 md:mb-4">Pricing Summary</h3>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between text-xs md:text-sm text-white/70 pb-2 md:pb-3 border-b border-white/10">
                    <span>Rental Period:</span>
                    <span className="font-semibold text-white text-right">{pricing.days} {pricing.days === 1 ? 'day' : 'days'} ({pricing.hours}h)</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm text-white/90">
                    <span>Base Price ({pricing.days} {pricing.days === 1 ? 'day' : 'days'}):</span>
                    <span className="font-bold text-white">€{pricing.base_price.toFixed(2)}</span>
                  </div>
                  {pricing.extras_price > 0 && (
                    <div className="flex justify-between text-xs md:text-sm text-white/90">
                      <span>Extras:</span>
                      <span className="font-bold text-white">€{pricing.extras_price.toFixed(2)}</span>
                    </div>
                  )}
                  {pricing.discount_amount > 0 && (
                    <div className="flex justify-between text-xs md:text-sm text-green-400">
                      <span>Discount:</span>
                      <span className="font-bold">-€{pricing.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg md:text-xl border-t border-white/20 pt-3 md:pt-4 mt-3 md:mt-4">
                    <span className="text-white">Total:</span>
                    <span className="text-orange-400">€{pricing.total_price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Continue to Extras clicked', {
                  dropoff_location_id: formData.dropoff_location_id,
                  pickup_location_id: formData.pickup_location_id,
                  pickup_date: formData.pickup_date,
                  dropoff_date: formData.dropoff_date,
                  availability: availability,
                  currentStep: step
                });
                
                if (!formData.dropoff_location_id) {
                  alert('Please select a drop-off location before continuing');
                  return;
                }
                if (!formData.pickup_location_id) {
                  alert('Please select a pick-up location before continuing');
                  return;
                }
                if (!formData.pickup_date || !formData.dropoff_date) {
                  alert('Please select both pick-up and drop-off dates before continuing');
                  return;
                }
                if (availability && !availability.available) {
                  alert('Vehicle is not available for the selected dates. Please choose different dates.');
                  return;
                }
                
                console.log('All validations passed, changing to step 2');
                changeStep(2);
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Continue to Extras →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Extras */}
      {step === 2 && (
        <div className="space-y-4 md:space-y-6">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Additional Services</h3>
          <p className="text-sm md:text-base text-white/70 mb-4 md:mb-6">
            {bookingExtrasList.length > 0
              ? 'Enhance your rental experience with our premium add-ons'
              : (vehicle?.vehicle_extras_link_count ?? 0) > 0
                ? 'Optional add-ons for this vehicle'
                : 'Enhance your rental experience with our premium add-ons'}
          </p>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Side - Extras List */}
            <div className="w-full lg:w-[70%] space-y-4">
            {bookingExtrasList.length === 0 ? (
              <div className="p-5 md:p-8 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="mx-auto md:mx-0 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-orange-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-white text-base md:text-lg">
                      {(vehicle?.vehicle_extras_link_count ?? 0) > 0
                        ? 'No add-ons are available for this vehicle'
                        : 'No additional services are available right now'}
                    </p>
                    <p className="text-sm md:text-base text-white/65 leading-relaxed">
                      {(vehicle?.vehicle_extras_link_count ?? 0) > 0
                        ? 'This car does not have any optional extras assigned to it, so there is nothing to add at this step. Your rental price is based on the vehicle and dates you already selected. You can continue to checkout whenever you are ready.'
                        : 'There are no optional services in our catalog at the moment. You can continue to checkout with your rental only.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
            bookingExtrasList.map((extra) => {
              const isSelected = formData.selected_extras.some((e) => e.id === extra.id);
              return (
                <label
                  key={extra.id}
                  className={`flex items-start md:items-center gap-3 md:gap-4 p-3 md:p-5 rounded-lg md:rounded-xl cursor-pointer transition-all duration-300 border backdrop-blur-xl ${
                      isSelected 
                        ? 'bg-orange-500/20 border-orange-500/50 shadow-lg shadow-orange-500/20' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`relative flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-md border-2 transition-all flex-shrink-0 mt-0.5 md:mt-0 ${
                    isSelected ? 'bg-orange-500 border-orange-500' : 'bg-white/10 border-white/30'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleExtraToggle(extra.id)}
                      className="absolute opacity-0 w-full h-full cursor-pointer"
                    />
                    {isSelected && (
                      <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-white block text-base md:text-lg">{extra.name}</span>
                    {extra.description && (
                      <p className="text-xs md:text-sm text-white/60 mt-0.5 md:mt-1 break-words">{extra.description}</p>
                    )}
                  </div>
                  <span className="font-bold text-orange-400 text-base md:text-lg whitespace-nowrap flex-shrink-0">
                    €{Number(extra.price || 0).toFixed(2)}
                    {extra.price_type === 'per_day' && <span className="text-xs md:text-sm text-white/70">/day</span>}
                  </span>
                </label>
              );
            })
            )}
            </div>

            {/* Right Side - Vehicle Image and Pricing Summary */}
            <div className="w-full lg:w-[35%] flex-shrink-0 space-y-4">
              {/* Vehicle Image */}
              {(() => {
                const vehicleImages = Array.isArray(vehicle.images) ? vehicle.images : vehicle.images ? [vehicle.images] : [];
                const mainImage = vehicleImages.length > 0 ? vehicleImages[0] : null;
                
                return (
                  <div className="bg-white/5 backdrop-blur-xl rounded-lg md:rounded-xl border border-white/10 overflow-hidden shadow-xl">
                    {mainImage ? (
                      <div className="relative w-full h-40 md:h-48">
                        <Image
                          src={getImageUrl(mainImage) || '/placeholder-car.jpg'}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-700"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
                      </div>
                    ) : (
                      <div className="w-full h-40 md:h-48 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                        <span className="text-gray-500 text-xs md:text-sm">No Image</span>
                      </div>
                    )}
                    <div className="p-3 md:p-4 bg-white/5 border-t border-white/10">
                      <h4 className="font-bold text-white text-base md:text-lg">{vehicle.make} {vehicle.model}</h4>
                      {vehicle.year && (
                        <p className="text-xs md:text-sm text-white/60">{vehicle.year}</p>
                      )}
                </div>
                  </div>
                );
              })()}

              {/* Pricing Summary */}
              {pricing && (
                <div className="bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-xl border border-white/10">
                  <h3 className="font-bold text-base md:text-lg text-white mb-3 md:mb-4">Pricing Summary</h3>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between text-xs md:text-sm text-white/70 pb-2 md:pb-3 border-b border-white/10">
                      <span>Rental Period:</span>
                      <span className="font-semibold text-white text-right">{pricing.days} {pricing.days === 1 ? 'day' : 'days'} ({pricing.hours} {pricing.hours === 1 ? 'hour' : 'hours'})</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm text-white/90">
                      <span>Base Price ({pricing.days} {pricing.days === 1 ? 'day' : 'days'}):</span>
                      <span className="font-bold text-white">€{pricing.base_price.toFixed(2)}</span>
                    </div>
                    {pricing.extras_price > 0 && (
                      <div className="flex justify-between text-xs md:text-sm text-white/90">
                        <span>Extras:</span>
                        <span className="font-bold text-white">€{pricing.extras_price.toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.discount_amount > 0 && (
                      <div className="flex justify-between text-xs md:text-sm text-green-400">
                        <span>Discount:</span>
                        <span className="font-bold">-€{pricing.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg md:text-xl border-t border-white/20 pt-3 md:pt-4 mt-3 md:mt-4">
                      <span className="text-white">Total:</span>
                      <span className="text-orange-400">€{pricing.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Coupon Code - Separate container below pricing summary */}
              <div className="bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-xl border border-white/10">
                <label className="block text-xs md:text-sm font-semibold text-white mb-2 md:mb-3">
                  Coupon Code (Optional)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 backdrop-blur-sm text-white font-medium transition-all border border-white/10 hover:border-white/20 placeholder-white/40"
                  />
                  <button
                    type="button"
                    onClick={handleCouponValidate}
                    className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-lg border border-white/20 hover:border-white/30 font-semibold transition-all whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-red-400 text-xs md:text-sm mt-2 md:mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-2 md:px-3 py-1.5 md:py-2">{couponError}</p>
                )}
                {coupon && (
                  <p className="text-green-400 text-xs md:text-sm mt-2 md:mt-3 bg-green-500/10 border border-green-500/30 rounded-lg px-2 md:px-3 py-1.5 md:py-2 flex items-center gap-2">
                    <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="break-words">
                      Coupon applied: <strong>{coupon.code}</strong> ({coupon.discount_value}
                      {coupon.discount_type === 'percentage' ? '%' : '€'} off)
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-6">
            <button
              type="button"
              onClick={() => changeStep(1)}
              className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white px-4 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-base md:text-lg transition-all duration-300 border border-white/20 hover:border-white/30 shadow-lg"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => changeStep(3)}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Checkout →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Customer Information */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Customer Information</h3>
            <p className="text-sm md:text-base text-white/70 mb-4 md:mb-6">Please provide your details to complete the booking</p>
          </div>

          {/* Customer Information Form - Full Width */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-white mb-1.5 md:mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.customer.first_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer: { ...prev.customer, first_name: e.target.value },
                  }))
                }
                className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 backdrop-blur-sm text-white font-medium transition-all border border-white/10 hover:border-white/20 placeholder-white/40"
                required
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-semibold text-white mb-1.5 md:mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.customer.last_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer: { ...prev.customer, last_name: e.target.value },
                  }))
                }
                className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 backdrop-blur-sm text-white font-medium transition-all border border-white/10 hover:border-white/20 placeholder-white/40"
                required
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-semibold text-white mb-1.5 md:mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.customer.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer: { ...prev.customer, email: e.target.value },
                  }))
                }
                className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 backdrop-blur-sm text-white font-medium transition-all border border-white/10 hover:border-white/20 placeholder-white/40"
                required
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-semibold text-white mb-1.5 md:mb-2">
                Phone <span className="text-orange-400">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.customer.phone_country_code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customer: { ...prev.customer, phone_country_code: e.target.value },
                    }))
                  }
                  className="w-20 md:w-28 px-2 md:px-3 py-2.5 md:py-3 text-xs md:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 backdrop-blur-sm text-white font-medium transition-all border border-white/10 hover:border-white/20"
                >
                  <option value="+212" className="bg-black">+212</option>
                  <option value="+33" className="bg-black">+33</option>
                  <option value="+34" className="bg-black">+34</option>
                  <option value="+39" className="bg-black">+39</option>
                  <option value="+44" className="bg-black">+44</option>
                  <option value="+49" className="bg-black">+49</option>
                  <option value="+1" className="bg-black">+1</option>
                  <option value="+971" className="bg-black">+971</option>
                  <option value="+966" className="bg-black">+966</option>
                  <option value="+20" className="bg-black">+20</option>
                  <option value="+213" className="bg-black">+213</option>
                  <option value="+216" className="bg-black">+216</option>
                </select>
                <input
                  type="tel"
                  value={formData.customer.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customer: { ...prev.customer, phone: e.target.value },
                    }))
                  }
                  className="flex-1 px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 backdrop-blur-sm text-white font-medium transition-all border border-white/10 hover:border-white/20 placeholder-white/40"
                  placeholder="Phone number"
                  required
                />
              </div>
            </div>
          </div>

          {/* Vehicle Image, Name, Pricing Summary, and Extras - Stacked Below */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Vehicle Image and Name */}
            <div className="lg:col-span-1 space-y-3 md:space-y-4">
              {(() => {
                const vehicleImages = Array.isArray(vehicle.images) ? vehicle.images : vehicle.images ? [vehicle.images] : [];
                const mainImage = vehicleImages.length > 0 ? vehicleImages[0] : null;
                
                return (
                  <>
                    <div className="bg-white/5 backdrop-blur-xl rounded-lg md:rounded-xl border border-white/10 overflow-hidden shadow-xl">
                      {mainImage ? (
                        <div className="relative w-full h-40 md:h-48">
                          <Image
                            src={getImageUrl(mainImage) || '/placeholder-car.jpg'}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-700"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
                        </div>
                      ) : (
                        <div className="w-full h-40 md:h-48 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                          <span className="text-gray-500 text-xs md:text-sm">No Image</span>
                        </div>
                      )}
                      <div className="p-3 md:p-4 bg-white/5 border-t border-white/10">
                        <h4 className="font-bold text-white text-base md:text-lg">{vehicle.make} {vehicle.model}</h4>
                        {vehicle.year && (
                          <p className="text-xs md:text-sm text-white/60">{vehicle.year}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Days Summary - Separate Container */}
                    {formData.pickup_date && formData.dropoff_date && (() => {
                      const pickupLocation = locations.find((loc) => loc.id === formData.pickup_location_id);
                      const dropoffLocation = locations.find((loc) => loc.id === formData.dropoff_location_id);
                      
                      return (
                        <div className="bg-white/5 backdrop-blur-xl rounded-lg md:rounded-xl border border-white/10 p-3 md:p-4">
                          <div className="space-y-2 md:space-y-3">
                            <div className="flex justify-between items-center text-xs md:text-sm">
                              <span className="text-white/70">Pickup Date:</span>
                              <span className="font-semibold text-white text-right">
                                {formData.pickup_date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            {pickupLocation && (
                              <div className="flex justify-between items-start text-xs md:text-sm gap-2">
                                <span className="text-white/70 flex-shrink-0">Pickup Location:</span>
                                <span className="font-semibold text-white text-right break-words">
                                  {pickupLocation.name} - {pickupLocation.city}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-xs md:text-sm pt-2 md:pt-3 border-t border-white/10 mt-2 md:mt-3">
                              <span className="text-white/70">Dropoff Date:</span>
                              <span className="font-semibold text-white text-right">
                                {formData.dropoff_date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            {dropoffLocation && (
                              <div className="flex justify-between items-start text-xs md:text-sm gap-2">
                                <span className="text-white/70 flex-shrink-0">Dropoff Location:</span>
                                <span className="font-semibold text-white text-right break-words">
                                  {dropoffLocation.name} - {dropoffLocation.city}
                                </span>
                              </div>
                            )}
                            {pricing && (
                              <div className="flex justify-between items-center pt-2 md:pt-3 border-t border-white/10 mt-2 md:mt-3">
                                <span className="text-white/70 font-semibold text-xs md:text-sm">Rental Period:</span>
                                <span className="font-bold text-orange-400 text-xs md:text-sm text-right">{pricing.days} {pricing.days === 1 ? 'day' : 'days'} ({pricing.hours}h)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                );
              })()}
            </div>

            {/* Pricing Summary and Selected Extras */}
            <div className="lg:col-span-2">
              {pricing && (
                <div className="bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-lg md:rounded-xl border border-white/10">
                  <h3 className="font-bold text-base md:text-lg text-white mb-3 md:mb-4">Pricing Summary</h3>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between text-xs md:text-sm text-white/70 pb-2 md:pb-3 border-b border-white/10">
                      <span>Rental Period:</span>
                      <span className="font-semibold text-white text-right">{pricing.days} {pricing.days === 1 ? 'day' : 'days'} ({pricing.hours}h)</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm text-white/90">
                      <span>Base Price ({pricing.days} {pricing.days === 1 ? 'day' : 'days'}):</span>
                      <span className="font-bold text-white">€{pricing.base_price.toFixed(2)}</span>
                    </div>
                    {pricing.extras_price > 0 && (
                      <div className="flex justify-between text-xs md:text-sm text-white/90">
                        <span>Extras:</span>
                        <span className="font-bold text-white">€{pricing.extras_price.toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.discount_amount > 0 && (
                      <div className="flex justify-between text-xs md:text-sm text-green-400">
                        <span>Discount:</span>
                        <span className="font-bold">-€{pricing.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg md:text-xl border-t border-white/20 pt-3 md:pt-4 mt-3 md:mt-4">
                      <span className="text-white">Total:</span>
                      <span className="text-orange-400">€{pricing.total_price.toFixed(2)}</span>
                    </div>
                  </div>

                  {formData.selected_extras.length > 0 && (
                    <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/10">
                      <h4 className="font-bold mb-2 md:mb-3 text-sm md:text-base text-white">Selected Extras</h4>
                      <div className="space-y-2 md:space-y-3">
                        {formData.selected_extras.map((extra) => {
                          const extraDetails = extras.find((e) => e.id === extra.id);
                          return (
                            <div
                              key={extra.id}
                              className="flex justify-between items-start pb-2 md:pb-3 border-b border-white/10 last:border-0 last:pb-0 gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-xs md:text-sm break-words">
                                  {extraDetails?.name || 'Extra'}
                                </p>
                                {extraDetails?.description && (
                                  <p className="text-xs text-white/60 mt-0.5 md:mt-1 break-words">
                                    {extraDetails.description}
                                  </p>
                                )}
                              </div>
                              <span className="font-bold text-orange-400 text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                                €{Number(extraDetails?.price || 0).toFixed(2)}
                                {extraDetails?.price_type === 'per_day' && <span className="text-white/70">/day</span>}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-6">
            <button
              type="button"
              onClick={() => changeStep(2)}
              className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white px-4 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-base md:text-lg transition-all duration-300 border border-white/20 hover:border-white/30 shadow-lg"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-700 disabled:to-gray-800 text-white px-4 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Confirm Booking →'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

