'use client';

import { useEffect, useState } from 'react';
import { getAdminBookings, updateBookingStatus, getBooking } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Plus, 
  Download, 
  Search, 
  X, 
  Calendar,
  Car,
  Users,
  Euro,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const [bookingToConfirm, setBookingToConfirm] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelNotes, setCancelNotes] = useState('');
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    vehicle_id: '',
    date_from: '',
    date_to: '',
    booking_number: '',
    customer_name: '',
    vehicle_search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [filters, pagination.page]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getAdminBookings({
        ...filters,
        page: pagination.page,
        per_page: pagination.per_page
      });
      setBookings(data.bookings || data);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string, paymentLinkValue?: string) => {
    try {
      const notes = newStatus === 'cancelled' ? cancelNotes : undefined;
      await updateBookingStatus(bookingId, newStatus, notes, paymentLinkValue);
      toast.success('Booking status updated successfully');
      loadBookings();
      if (selectedBooking?.id === bookingId) {
        handleViewBooking(selectedBooking);
      }
      setShowPaymentModal(false);
      setPaymentLink('');
      setBookingToConfirm(null);
      if (newStatus === 'cancelled') {
        setShowCancelModal(false);
        setCancelNotes('');
        setBookingToCancel(null);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error updating booking status';
      toast.error(errorMessage);
    }
  };

  const handleConfirmClick = (bookingId: string) => {
    setBookingToConfirm(bookingId);
    setPaymentLink('');
    setShowPaymentModal(true);
  };

  const handleCancelClick = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setCancelNotes('');
    setShowCancelModal(true);
  };

  const handlePaymentSubmit = () => {
    if (!paymentLink.trim()) {
      toast.error('Please enter a payment link');
      return;
    }
    if (bookingToConfirm) {
      handleStatusUpdate(bookingToConfirm, 'waiting_payment', paymentLink);
    }
  };

  const handleViewBooking = async (booking: any) => {
    setSelectedBooking(booking);
    setLoadingDetails(true);
    try {
      const details = await getBooking(booking.booking_number);
      setBookingDetails(details);
    } catch (error) {
      console.error('Error loading booking details:', error);
      toast.error('Error loading booking details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setBookingDetails(null);
  };

  const exportToCSV = (data: any[]) => {
    const headers = ['Booking Number', 'Customer Name', 'Email', 'Phone', 'Vehicle', 'Pick-up Date', 'Drop-off Date', 'Status', 'Total Price'];
    const csvRows = [headers.join(',')];
    
    data.forEach(booking => {
      const row = [
        booking.booking_number,
        `"${booking.first_name} ${booking.last_name}"`,
        booking.email,
        booking.phone,
        `"${booking.make} ${booking.model}"`,
        new Date(booking.pickup_date).toLocaleDateString(),
        new Date(booking.dropoff_date).toLocaleDateString(),
        booking.status,
        booking.total_price
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${data.length} booking(s) to CSV`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const clearFilters = () => {
    setFilters({ status: '', vehicle_id: '', date_from: '', date_to: '', booking_number: '', customer_name: '', vehicle_search: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Bookings Management</h1>
          <p className="text-gray-400 text-sm sm:text-base lg:text-lg">Manage and track all customer bookings</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => window.location.href = '/admin/bookings/drafts'}
            className="w-full sm:w-auto px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-gray-200"
          >
            <FileText className="w-4 h-4" />
            View Drafts
          </button>
          <button
            onClick={() => window.location.href = '/admin/bookings/new'}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Create New Booking
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm mb-6 overflow-hidden">
        <div 
          className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800 cursor-pointer hover:bg-gray-800 transition-colors"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <h2 className="text-base sm:text-lg font-bold text-white">Search & Filters</h2>
              {hasActiveFilters && (
                <span className="px-2.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                  Active
                </span>
              )}
            </div>
            <button className="text-gray-400 hover:text-gray-200 transition-colors">
              {showFilters ? <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Booking Number</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.booking_number}
              onChange={(e) => setFilters({ ...filters, booking_number: e.target.value })}
              placeholder="Search by booking #..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
                </div>
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Customer Name</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.customer_name}
              onChange={(e) => setFilters({ ...filters, customer_name: e.target.value })}
              placeholder="Search by customer name..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
                </div>
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Vehicle</label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.vehicle_search}
              onChange={(e) => setFilters({ ...filters, vehicle_search: e.target.value })}
              placeholder="Search by make/model..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
                </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-700 bg-gray-800 text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="waiting_payment">Waiting Payment</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
                </div>
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
                </div>
          </div>

          <div className="flex items-end sm:items-start">
            <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-200 transition-colors font-semibold flex items-center justify-center gap-2"
            >
                  <X className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>
          </div>
        )}
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm p-8">
          <LoadingSpinner size="md" text="Loading bookings..." />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <EmptyState
            icon={FileText}
            title="No bookings found"
            description="Try adjusting your filters to see more results"
          />
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Export and Bulk Actions Bar */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              {selectedBookings.size > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="text-sm font-semibold text-gray-300">
                    {selectedBookings.size} selected
                  </span>
                  <button
                    onClick={() => setSelectedBookings(new Set())}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors text-left sm:text-left"
                  >
                    Deselect All
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                const dataToExport = selectedBookings.size > 0 
                  ? bookings.filter(b => selectedBookings.has(b.id))
                  : bookings;
                exportToCSV(dataToExport);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span className="whitespace-nowrap">Export {selectedBookings.size > 0 ? 'Selected' : 'All'} to CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800 hidden md:table">
              <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={bookings.length > 0 && selectedBookings.size === bookings.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBookings(new Set(bookings.map(b => b.id)));
                      } else {
                        setSelectedBookings(new Set());
                      }
                    }}
                      className="rounded border-gray-700 text-orange-600 focus:ring-orange-500"
                  />
                </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Booking #
                </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Vehicle
                </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Pick-up Date
                </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Total Price
                </th>
                  <th className="px-2 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider w-16">
                  Status
                </th>
                  <th className="px-2 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
              {bookings.map((booking) => {
                const pickupDate = new Date(booking.pickup_date);
                const isToday = pickupDate.toDateString() === new Date().toDateString();
                const isTomorrow = pickupDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                
                return (
                <tr 
                  key={booking.id}
                    className="hover:bg-gradient-to-r hover:from-gray-800 hover:to-transparent cursor-pointer transition-colors group"
                  onClick={() => handleViewBooking(booking)}
                >
                  <td className="px-3 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedBookings.has(booking.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedBookings);
                        if (e.target.checked) {
                          newSelected.add(booking.id);
                        } else {
                          newSelected.delete(booking.id);
                        }
                        setSelectedBookings(newSelected);
                      }}
                        className="rounded border-gray-700 text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-blue-600 hover:text-blue-800 group-hover:underline">
                        {booking.booking_number}
                      </span>
                      {(isToday || isTomorrow) && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm">
                          {isToday ? 'Today' : 'Tomorrow'}
                        </span>
                      )}
                    </div>
                  </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 bg-gray-800 rounded-full">
                          <Users className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-xs font-medium text-white">
                    {booking.first_name} {booking.last_name}
                        </span>
                      </div>
                  </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Car className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-300">
                    {booking.make} {booking.model}
                        </span>
                      </div>
                  </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-300">
                    {new Date(booking.pickup_date).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric'
                    })} {new Date(booking.pickup_date).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                        </span>
                      </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Euro className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-bold text-white">
                          {formatCurrency(parseFloat(booking.total_price))}
                    </span>
                      </div>
                  </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="flex justify-center">
                        <StatusBadge status={booking.status} compact={true} />
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-xs" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center">
                    {booking.status === 'pending' ? (
                        <div className="flex gap-1">
                        <button
                          onClick={() => handleConfirmClick(booking.id)}
                            title="Accept Booking"
                            className="p-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-sm hover:shadow-md hover:scale-110"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCancelClick(booking.id)}
                            title="Cancel Booking"
                            className="p-1.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all shadow-sm hover:shadow-md hover:scale-110"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : booking.status === 'waiting_payment' ? (
                        <div className="flex gap-1">
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            title="Confirm Payment"
                            className="p-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-sm hover:shadow-md hover:scale-110"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCancelClick(booking.id)}
                            title="Cancel Booking"
                            className="p-1.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all shadow-sm hover:shadow-md hover:scale-110"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                        <button
                          onClick={() => handleViewBooking(booking)}
                            title="View Details"
                            className="p-1.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-all shadow-sm hover:shadow-md hover:scale-110"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                    )}
                      </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-gray-800">
            {bookings.map((booking) => {
              const pickupDate = new Date(booking.pickup_date);
              const isToday = pickupDate.toDateString() === new Date().toDateString();
              const isTomorrow = pickupDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
              
              return (
                <div
                  key={booking.id}
                  className="p-4 hover:bg-gradient-to-r hover:from-gray-800 hover:to-transparent cursor-pointer transition-colors"
                  onClick={() => handleViewBooking(booking)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedBookings.has(booking.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newSelected = new Set(selectedBookings);
                          if (e.target.checked) {
                            newSelected.add(booking.id);
                          } else {
                            newSelected.delete(booking.id);
                          }
                          setSelectedBookings(newSelected);
                        }}
                        className="rounded border-gray-700 text-orange-600 focus:ring-orange-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm font-semibold text-blue-600">
                        {booking.booking_number}
                      </span>
                      {(isToday || isTomorrow) && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                          {isToday ? 'Today' : 'Tomorrow'}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={booking.status} compact={true} />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Customer:
                      </span>
                      <span className="font-semibold text-white">{booking.first_name} {booking.last_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Car className="w-3.5 h-3.5" />
                        Vehicle:
                      </span>
                      <span className="text-gray-300">{booking.make} {booking.model}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Pick-up:
                      </span>
                      <span className="text-gray-300">
                        {new Date(booking.pickup_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Euro className="w-3.5 h-3.5" />
                        Total:
                      </span>
                      <span className="font-bold text-white">{formatCurrency(parseFloat(booking.total_price))}</span>
                    </div>
                  </div>
                  
                  {/* Mobile Action Buttons */}
                  <div className="mt-3 pt-3 border-t border-gray-800 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {booking.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleConfirmClick(booking.id)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleCancelClick(booking.id)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </>
                    ) : booking.status === 'waiting_payment' ? (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Confirm
                        </button>
                        <button
                          onClick={() => handleCancelClick(booking.id)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleViewBooking(booking)}
                        className="w-full px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-300 font-medium text-center sm:text-left">
                Showing <span className="font-bold">{((pagination.page - 1) * pagination.per_page) + 1}</span> to{' '}
                <span className="font-bold">{Math.min(pagination.page * pagination.per_page, pagination.total)}</span> of{' '}
                <span className="font-bold">{pagination.total}</span> bookings
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>
                
                <div className="flex gap-1 justify-center overflow-x-auto pb-1 sm:pb-0">
                  {Array.from({ length: Math.min(pagination.total_pages, 7) }, (_, i) => {
                    let pageNum;
                    if (pagination.total_pages <= 7) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 4) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.total_pages - 3) {
                      pageNum = pagination.total_pages - 6 + i;
                    } else {
                      pageNum = pagination.page - 3 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                          pagination.page === pageNum
                            ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md'
                            : 'text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.total_pages}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Details Modal - Full Page */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
          <div className="min-h-screen">
            {/* Header - Sticky */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2 shadow-sm z-50">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white truncate">
                  <span className="hidden sm:inline">Booking Details - </span>
                  <span>{selectedBooking.booking_number}</span>
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-2xl font-bold flex-shrink-0"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-6xl">
              {loadingDetails ? (
                <LoadingSpinner size="lg" text="Loading booking details..." />
              ) : bookingDetails ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Booking Information */}
                  <div className="bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-800">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      Booking Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                      <div>
                        <span className="text-sm text-gray-400 font-medium">Booking Number:</span>
                        <p className="font-bold text-white mt-1">{bookingDetails.booking_number}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400 font-medium">Status:</span>
                        <p className="mt-1">
                          <StatusBadge status={bookingDetails.status} size="md" />
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400 font-medium">Created:</span>
                        <p className="font-semibold text-white mt-1">
                          {new Date(bookingDetails.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })} {new Date(bookingDetails.created_at).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  {bookingDetails.status !== 'cancelled' && (
                    <div className="bg-gray-900 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-800">
                      <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 md:w-5 md:h-5" />
                        Booking Status Timeline
                      </h3>
                      
                      {/* Desktop/Tablet Horizontal Layout */}
                      <div className="hidden md:flex items-center justify-between relative">
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 right-0 h-1.5 bg-gray-800 rounded-full">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-300"
                            style={{
                              width: bookingDetails.status === 'pending' ? '0%' :
                                     bookingDetails.status === 'waiting_payment' ? '33%' :
                                     bookingDetails.status === 'confirmed' ? '66%' :
                                     bookingDetails.status === 'completed' ? '100%' : '0%'
                            }}
                          ></div>
                        </div>
                        
                        {/* Steps */}
                        {['pending', 'waiting_payment', 'confirmed', 'completed'].map((step, index) => {
                          const stepLabels = {
                            pending: 'Pending',
                            waiting_payment: 'Awaiting Payment',
                            confirmed: 'Confirmed',
                            completed: 'Completed'
                          };
                          
                          const statusIndex = ['pending', 'waiting_payment', 'confirmed', 'completed'].indexOf(bookingDetails.status);
                          const isActive = bookingDetails.status === step;
                          const isPast = statusIndex > index;
                          const isCompleted = statusIndex >= index;
                          
                          return (
                            <div key={step} className="flex flex-col items-center relative z-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-md ${
                                isCompleted ? 'bg-gradient-to-r from-emerald-600 to-green-500 border-emerald-600' :
                                isActive ? 'bg-gradient-to-r from-blue-600 to-blue-500 border-blue-600' :
                                'bg-gray-800 border-gray-700'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                ) : (
                                  <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                              <span className={`mt-2 text-xs font-semibold ${isCompleted ? 'text-emerald-600' : isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                                {stepLabels[step as keyof typeof stepLabels]}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mobile Vertical Layout */}
                      <div className="md:hidden space-y-4 relative pl-7">
                        {/* Vertical Progress Line Background */}
                        <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-gray-800 z-0"></div>
                        
                        {/* Vertical Progress Line Fill */}
                        {(() => {
                          const statusIndex = ['pending', 'waiting_payment', 'confirmed', 'completed'].indexOf(bookingDetails.status);
                          // Calculate percentage height to reach each step
                          // Each step takes approximately equal space, so we divide by 3 (0-3 indices)
                          // and adjust to reach the center of each step's circle
                          const progressPercentages = {
                            'pending': '0%',
                            'waiting_payment': '25%',
                            'confirmed': '66%',
                            'completed': '100%'
                          };
                          const currentHeight = progressPercentages[bookingDetails.status as keyof typeof progressPercentages] || '0%';
                          return (
                            <div 
                              className="absolute left-[13px] top-2 w-0.5 bg-gradient-to-b from-blue-600 to-blue-500 transition-all duration-300 z-0"
                              style={{ height: currentHeight }}
                            ></div>
                          );
                        })()}
                        
                        {['pending', 'waiting_payment', 'confirmed', 'completed'].map((step, index) => {
                          const stepLabels = {
                            pending: 'Pending',
                            waiting_payment: 'Awaiting Payment',
                            confirmed: 'Confirmed',
                            completed: 'Completed'
                          };
                          
                          const statusIndex = ['pending', 'waiting_payment', 'confirmed', 'completed'].indexOf(bookingDetails.status);
                          const isActive = bookingDetails.status === step;
                          const isCompleted = statusIndex >= index;
                          
                          return (
                            <div key={step} className="flex items-start gap-3 relative z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-md flex-shrink-0 -ml-7 ${
                                isCompleted ? 'bg-gradient-to-r from-emerald-600 to-green-500 border-emerald-600' :
                                isActive ? 'bg-gradient-to-r from-blue-600 to-blue-500 border-blue-600' :
                                'bg-gray-800 border-gray-700'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : (
                                  <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex-1 pt-1">
                                <span className={`block text-sm font-semibold ${
                                  isCompleted ? 'text-emerald-600' : 
                                  isActive ? 'text-blue-600' : 
                                  'text-gray-500'
                                }`}>
                                  {stepLabels[step as keyof typeof stepLabels]}
                                </span>
                                {isActive && (
                                  <span className="block text-xs text-gray-400 mt-0.5">Current Status</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Customer Information */}
                  <div className="bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-800">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white flex items-center gap-2">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <span className="text-sm text-gray-400 font-medium">Name:</span>
                        <p className="font-bold text-white mt-1">
                          {bookingDetails.first_name} {bookingDetails.last_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400 font-medium">Email:</span>
                        <p className="font-semibold text-white mt-1">{bookingDetails.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400 font-medium">Phone:</span>
                        <p className="font-semibold text-white mt-1">{bookingDetails.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-800">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white flex items-center gap-2">
                      <Car className="w-4 h-4 sm:w-5 sm:h-5" />
                      Vehicle Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <span className="text-sm text-gray-400 font-medium">Vehicle:</span>
                        <p className="font-bold text-white mt-1">
                          {bookingDetails.make} {bookingDetails.model} ({bookingDetails.year})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rental Details */}
                  <div className="bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-800">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                      Rental Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <span className="text-sm text-gray-400 font-medium">Pick-up Location:</span>
                        <p className="font-semibold text-white mt-1">{bookingDetails.pickup_location_name}</p>
                        {bookingDetails.pickup_location_address && (
                          <p className="text-sm text-gray-500 mt-1">{bookingDetails.pickup_location_address}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-gray-400 font-medium">Drop-off Location:</span>
                        <p className="font-semibold text-white mt-1">{bookingDetails.dropoff_location_name}</p>
                        {bookingDetails.dropoff_location_address && (
                          <p className="text-sm text-gray-500 mt-1">{bookingDetails.dropoff_location_address}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-gray-400 font-medium">Pick-up Date:</span>
                        <p className="font-semibold text-white mt-1">
                          {new Date(bookingDetails.pickup_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })} {new Date(bookingDetails.pickup_date).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400 font-medium">Drop-off Date:</span>
                        <p className="font-semibold text-white mt-1">
                          {new Date(bookingDetails.dropoff_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })} {new Date(bookingDetails.dropoff_date).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-800">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white flex items-center gap-2">
                      <Euro className="w-4 h-4 sm:w-5 sm:h-5" />
                      Pricing
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Base Price:</span>
                        <span className="font-bold text-white">{formatCurrency(parseFloat(bookingDetails.base_price || 0))}</span>
                      </div>
                      {bookingDetails.extras_price > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-medium">Extras:</span>
                          <span className="font-bold text-white">{formatCurrency(parseFloat(bookingDetails.extras_price || 0))}</span>
                        </div>
                      )}
                      {bookingDetails.discount_amount > 0 && (
                        <div className="flex justify-between items-center text-emerald-600">
                          <span className="font-medium">Discount:</span>
                          <span className="font-bold">-{formatCurrency(parseFloat(bookingDetails.discount_amount || 0))}</span>
                        </div>
                      )}
                      {(!bookingDetails.booking_extras || !Array.isArray(bookingDetails.booking_extras) || bookingDetails.booking_extras.length === 0) && (
                        <div className="flex justify-between items-center border-t-2 border-gray-700 pt-3 font-bold text-xl text-white">
                          <span>Total:</span>
                          <span>{formatCurrency(parseFloat(bookingDetails.total_price || 0))}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Extras */}
                  {bookingDetails.booking_extras && Array.isArray(bookingDetails.booking_extras) && bookingDetails.booking_extras.length > 0 && (
                    <div className="bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-800">
                      <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white">Selected Extras</h3>
                      <div className="space-y-2">
                        {bookingDetails.booking_extras.map((extra: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-800 rounded-xl border border-gray-800">
                            <span className="font-medium text-white">{extra.name} {extra.quantity > 1 && `(x${extra.quantity})`}</span>
                            <span className="font-bold text-white">{formatCurrency(parseFloat(extra.price || 0))}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center border-t-2 border-gray-700 pt-3 mt-3 font-bold text-xl text-white">
                        <span>Total:</span>
                        <span>{formatCurrency(parseFloat(bookingDetails.total_price || 0))}</span>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {bookingDetails.notes && bookingDetails.status !== 'cancelled' && (
                    <div className="bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-800">
                      <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                        Notes
                      </h3>
                      <p className="text-gray-300 bg-gray-800 p-4 rounded-xl border border-gray-800">{bookingDetails.notes}</p>
                    </div>
                  )}

                  {/* Cancellation Notes */}
                  {bookingDetails.status === 'cancelled' && bookingDetails.notes && (
                    <div className="bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-red-800">
                      <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        Cancellation Reason
                      </h3>
                      <p className="text-red-300 bg-gray-800 p-4 rounded-xl border border-red-800">{bookingDetails.notes}</p>
                    </div>
                  )}

                  {/* Update Status */}
                  {(bookingDetails.status === 'pending' || bookingDetails.status === 'waiting_payment' || bookingDetails.status === 'confirmed') && (
                    <div className="bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-800">
                      <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white">Actions</h3>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                        {bookingDetails.status === 'pending' && (
                          <button
                            onClick={() => {
                              setBookingToConfirm(bookingDetails.id);
                              setPaymentLink('');
                              setShowPaymentModal(true);
                            }}
                            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all text-xs sm:text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-center">Accept & Send Payment Link</span>
                          </button>
                        )}
                        {bookingDetails.status === 'waiting_payment' && (
                          <button
                            onClick={() => handleStatusUpdate(bookingDetails.id, 'confirmed')}
                            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all text-xs sm:text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark as Confirmed
                          </button>
                        )}
                        {bookingDetails.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(bookingDetails.id, 'completed')}
                            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-lg hover:from-gray-900 hover:to-gray-800 transition-all text-xs sm:text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark as Completed
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setBookingToCancel(bookingDetails.id);
                            setCancelNotes('');
                            setShowCancelModal(true);
                          }}
                          className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all text-xs sm:text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel Booking
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-400 text-lg">Failed to load booking details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Link Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-4 sm:p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Accept Booking & Send Payment Link</h3>
            <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
              Please enter the payment link to send to the customer. An email will be automatically sent with the payment link.
            </p>
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-semibold text-white mb-2">
                Payment Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                placeholder="https://payment.example.com/..."
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-800 text-white placeholder-gray-400 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                autoFocus
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handlePaymentSubmit}
                disabled={!paymentLink.trim()}
                className="w-full sm:flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:from-emerald-700 hover:to-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                Send Payment Link
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentLink('');
                  setBookingToConfirm(null);
                }}
                className="w-full sm:flex-1 bg-gray-800 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Notes Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-4 sm:p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Cancel Booking</h3>
            <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
              Please provide a reason or note for cancelling this booking. This note will be stored with the booking.
            </p>
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-semibold text-white mb-2">
                Cancellation Note <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-800 text-white placeholder-gray-400 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                rows={4}
                placeholder="Explain why this booking is being cancelled..."
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (!cancelNotes.trim() || !bookingToCancel) return;
                  handleStatusUpdate(bookingToCancel, 'cancelled');
                }}
                disabled={!cancelNotes.trim() || !bookingToCancel}
                className="w-full sm:flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold hover:from-red-700 hover:to-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg whitespace-nowrap"
              >
                Confirm Cancellation
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelNotes('');
                  setBookingToCancel(null);
                }}
                className="w-full sm:flex-1 bg-gray-800 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-700 transition-all whitespace-nowrap"
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
