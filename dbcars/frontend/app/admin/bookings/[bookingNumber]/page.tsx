'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBooking, updateBookingStatus } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  Calendar,
  Car,
  Users,
  MapPin,
  Euro,
  FileText,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  ExternalLink
} from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import LoadingSpinner from '@/components/admin/LoadingSpinner';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingNumber = params?.bookingNumber as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');

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
    if (!bookingNumber) {
      toast.error('No booking number provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('[Booking Detail] Loading booking:', bookingNumber);
      console.log('[Booking Detail] Booking number type:', typeof bookingNumber);
      console.log('[Booking Detail] Booking number length:', bookingNumber.length);
      console.log('[Booking Detail] Booking number chars:', Array.from(bookingNumber).map(c => c.charCodeAt(0)));
      
      // Next.js params are already decoded, so we can pass directly
      // The API function will handle URL encoding
      const data = await getBooking(bookingNumber);
      console.log('[Booking Detail] Successfully loaded booking:', data.booking_number);
      setBooking(data);
    } catch (error: any) {
      console.error('[Booking Detail] Error loading booking:', error);
      console.error('[Booking Detail] Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        requestedNumber: bookingNumber,
      });
      
      // If booking not found, show helpful message
      if (error.response?.status === 404) {
        const errorData = error.response?.data;
        const requestedNumber = errorData?.booking_number || bookingNumber;
        const message = errorData?.message || `Booking "${requestedNumber}" not found. It may not exist in the database.`;
        
        toast.error(message);
        
        // Log similar bookings if available
        if (errorData?.similar_bookings && errorData.similar_bookings.length > 0) {
          console.log('[Booking Detail] Similar bookings found:', errorData.similar_bookings);
          toast.error(`Did you mean one of these? ${errorData.similar_bookings.join(', ')}`, {
            duration: 8000,
          });
        }
      } else {
        const errorMessage = error.response?.data?.error || 'Failed to load booking details';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string, paymentLinkValue?: string, notesValue?: string) => {
    if (!booking) return;
    
    try {
      setUpdating(true);
      
      // For cancellation, provide a default note if none is provided
      let notes = notesValue;
      if (newStatus === 'cancelled' && !notes) {
        notes = 'Booking cancelled by admin';
      }
      
      // For confirmed status, use existing payment link if available and none provided
      let paymentLink = paymentLinkValue;
      if (newStatus === 'confirmed' && !paymentLink && booking.payment_link) {
        paymentLink = booking.payment_link;
      }
      
      await updateBookingStatus(booking.id, newStatus, notes, paymentLink);
      toast.success('Booking status updated successfully');
      await loadBooking();
      if (paymentLinkValue) {
        toast.success('Payment link sent to customer via email');
      }
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update booking status';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmBooking = () => {
    setPaymentLink('');
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = () => {
    if (!paymentLink.trim()) {
      toast.error('Please enter a payment link');
      return;
    }
    // Set status to 'waiting_payment' when payment link is provided
    // This indicates the booking is approved but payment is pending
    handleStatusUpdate('waiting_payment', paymentLink);
    setShowPaymentModal(false);
    setPaymentLink('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading booking details..." />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Booking Not Found</h1>
          <p className="text-gray-400 mb-2">
            We couldn&apos;t find a booking with reference: <span className="font-mono text-orange-500">{bookingNumber}</span>
          </p>
          <p className="text-gray-500 text-sm mb-6">
            This booking may have been deleted, or the booking number may be incorrect.
          </p>
          <div className="space-y-3">
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bookings List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = Array.isArray(booking.images)
    ? booking.images
    : booking.images
    ? [booking.images]
    : [];
  const mainImage = images.length > 0 ? images[0] : null;
  const bookingExtras = booking.booking_extras || [];

  return (
    <div className="min-h-screen py-4 md:py-6">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Bookings</span>
          </Link>
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Booking Details
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className="text-base md:text-lg font-semibold text-gray-300 break-all">
                  {booking.booking_number}
                </span>
                <StatusBadge status={booking.status} size="md" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
              {booking.status === 'pending' && (
                <button
                  onClick={handleConfirmBooking}
                  disabled={updating}
                  className="w-full sm:w-auto px-3 md:px-4 py-2.5 md:py-2 bg-emerald-600 text-white rounded-lg md:rounded-xl text-sm md:text-base font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Confirm Booking</span>
                </button>
              )}
              {booking.status === 'waiting_payment' && (
                <button
                  onClick={() => handleStatusUpdate('confirmed')}
                  disabled={updating}
                  className="w-full sm:w-auto px-3 md:px-4 py-2.5 md:py-2 bg-emerald-600 text-white rounded-lg md:rounded-xl text-sm md:text-base font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Mark as Confirmed</span>
                </button>
              )}
              {booking.status === 'confirmed' && (
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updating}
                  className="w-full sm:w-auto px-3 md:px-4 py-2.5 md:py-2 bg-emerald-600 text-white rounded-lg md:rounded-xl text-sm md:text-base font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Mark as Completed</span>
                </button>
              )}
              {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'waiting_payment') && (
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={updating}
                  className="w-full sm:w-auto px-3 md:px-4 py-2.5 md:py-2 bg-red-600 text-white rounded-lg md:rounded-xl text-sm md:text-base font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Cancel</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Vehicle Information Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <Car className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                  Vehicle Information
                </h2>
              </div>
              <div className="p-4 md:p-6">
                {mainImage && (
                  <div className="relative w-full h-64 mb-6 rounded-xl overflow-hidden">
                    <Image
                      src={getImageUrl(mainImage) || '/placeholder-car.jpg'}
                      alt={`${booking.make} ${booking.model}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-400 font-medium">Vehicle</span>
                    <span className="text-white font-semibold text-right">
                      {booking.make} {booking.model} {booking.year && `(${booking.year})`}
                    </span>
                  </div>
                  {booking.vehicle_subunit_id && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-400 font-medium">Subunit ID</span>
                      <span className="text-white font-semibold text-right">
                        {booking.vehicle_subunit_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rental Details Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                  Rental Details
                </h2>
              </div>
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                        Pickup Location
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-white mb-1">
                      {booking.pickup_location_name}
                    </p>
                    {booking.pickup_location_address && (
                      <p className="text-sm text-gray-400">
                        {booking.pickup_location_address}
                      </p>
                    )}
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-1">Pickup Date & Time</p>
                      <p className="text-base font-semibold text-white">
                        {formatDate(booking.pickup_date)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                        Dropoff Location
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-white mb-1">
                      {booking.dropoff_location_name}
                    </p>
                    {booking.dropoff_location_address && (
                      <p className="text-sm text-gray-400">
                        {booking.dropoff_location_address}
                      </p>
                    )}
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-1">Dropoff Date & Time</p>
                      <p className="text-base font-semibold text-white">
                        {formatDate(booking.dropoff_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Extras Card */}
            {bookingExtras.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800">
                  <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                    Selected Extras
                  </h2>
                </div>
                <div className="p-4 md:p-6">
                  <div className="space-y-3">
                    {bookingExtras.map((extra: any, index: number) => (
                      <div
                        key={extra.id || index}
                        className="flex justify-between items-center p-3 bg-gray-800 rounded-xl"
                      >
                        <div>
                          <p className="font-semibold text-white">{extra.name}</p>
                          {extra.quantity > 1 && (
                            <p className="text-sm text-gray-400">Quantity: {extra.quantity}</p>
                          )}
                        </div>
                        <span className="font-semibold text-white">
                          {formatCurrency(parseFloat(extra.price || 0) * (extra.quantity || 1))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notes Card */}
            {booking.notes && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800">
                  <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                    Notes
                  </h2>
                </div>
                <div className="p-4 md:p-6">
                  <p className="text-sm md:text-base text-gray-300 whitespace-pre-wrap break-words">{booking.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Pricing Summary Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <Euro className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                  Pricing Summary
                </h2>
              </div>
              <div className="p-4 md:p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Price</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(parseFloat(booking.base_price || 0))}
                    </span>
                  </div>
                  {parseFloat(booking.extras_price || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Extras</span>
                      <span className="font-semibold text-white">
                        {formatCurrency(parseFloat(booking.extras_price || 0))}
                      </span>
                    </div>
                  )}
                  {parseFloat(booking.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span className="font-semibold">
                        -{formatCurrency(parseFloat(booking.discount_amount || 0))}
                      </span>
                    </div>
                  )}
                  {booking.coupon_code && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Coupon Code</span>
                      <span className="font-medium text-gray-300">{booking.coupon_code}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-800 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-white">Total</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {formatCurrency(parseFloat(booking.total_price || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                  Customer Information
                </h2>
              </div>
              <div className="p-4 md:p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Full Name</p>
                    <p className="font-semibold text-white">
                      {booking.first_name} {booking.last_name}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-400">Email</p>
                    </div>
                    <a
                      href={`mailto:${booking.email}`}
                      className="font-semibold text-blue-600 hover:text-blue-800 break-all"
                    >
                      {booking.email}
                    </a>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-400">Phone</p>
                    </div>
                    <a
                      href={`tel:${booking.phone}`}
                      className="font-semibold text-blue-600 hover:text-blue-800"
                    >
                      {booking.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Metadata Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                  Booking Information
                </h2>
              </div>
              <div className="p-4 md:p-6">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Booking Number</p>
                    <p className="font-semibold text-white">{booking.booking_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Status</p>
                    <StatusBadge status={booking.status} size="md" />
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Created At</p>
                    <p className="font-semibold text-white">
                      {booking.created_at ? formatDate(booking.created_at) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Last Updated</p>
                    <p className="font-semibold text-white">
                      {booking.updated_at ? formatDate(booking.updated_at) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Link Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-white">Approve Booking & Send Payment Link</h3>
            <p className="text-sm md:text-base text-gray-400 mb-4 md:mb-6">
              Please enter the payment link to send to the customer. The booking will be set to "Waiting Payment" status and an email will be automatically sent with the payment link.
            </p>
            <div className="mb-4 md:mb-6">
              <label className="block text-xs md:text-sm font-semibold text-white mb-2">
                Payment Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                placeholder="https://payment.example.com/..."
                className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border-2 border-gray-700 rounded-lg md:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                autoFocus
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <button
                onClick={handlePaymentSubmit}
                disabled={!paymentLink.trim() || updating}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {updating ? 'Processing...' : 'Send Payment Link'}
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentLink('');
                }}
                disabled={updating}
                className="flex-1 bg-gray-800 text-white px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl font-semibold hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

