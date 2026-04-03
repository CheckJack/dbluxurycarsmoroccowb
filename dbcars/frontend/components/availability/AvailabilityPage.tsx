'use client';

import { useState, useEffect, useCallback } from 'react';
import { getLocations, exportAvailability, bulkUpdateSubunitStatus } from '@/lib/api';
import toast from 'react-hot-toast';
import HeaderBar from './HeaderBar';
import VehiclePanel from './VehiclePanel';
import CalendarPanel from './CalendarPanel';
import QuickActionMenu from './QuickActionMenu';
import InlineNoteForm from './InlineNoteForm';
import FloatingActionButton from './FloatingActionButton';
import StatusSummaryCards from './StatusSummaryCards';
import BookingDetailsModal from './BookingDetailsModal';
import { useAvailability } from './hooks/useAvailability';
import { useQuickActions } from './hooks/useQuickActions';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import { Calendar } from 'lucide-react';

interface QuickActionMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  context: 'day' | 'vehicle' | 'subunit';
  targetId?: string;
  targetDate?: Date;
}

interface InlineFormState {
  isOpen: boolean;
  date?: Date;
  dateRange?: { start: Date; end: Date };
  type: 'note' | 'status' | null;
}

export default function AvailabilityPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [hasMadeSelection, setHasMadeSelection] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [vehiclePanelCollapsed, setVehiclePanelCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  const [filters, setFilters] = useState({
    vehicleId: undefined as string | undefined,
    status: undefined as string[] | undefined,
    locationId: undefined as string | undefined,
    searchQuery: undefined as string | undefined,
  });

  const [quickActionMenu, setQuickActionMenu] = useState<QuickActionMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    context: 'day',
  });

  const [inlineForm, setInlineForm] = useState<InlineFormState>({
    isOpen: false,
    type: null,
  });

  const [editingNote, setEditingNote] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBookingDate, setSelectedBookingDate] = useState<Date | null>(null);

  // Data fetching
  const {
    availabilityData,
    vehicles,
    subunits,
    loading,
    refresh,
  } = useAvailability({
    vehicle_id: filters.vehicleId || selectedVehicle || undefined,
    month,
    year,
    status: filters.status,
    locationId: filters.locationId,
    searchQuery: filters.searchQuery || searchQuery || undefined,
  });

  // Quick actions
  const { updateStatus, createNotesForRange, createNote, updateNote, deleteNote } =
    useQuickActions(refresh);

  // Load locations
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await getLocations();
        setLocations(data || []);
      } catch (error) {
        console.error('Error loading locations:', error);
      }
    };
    loadLocations();
  }, []);

  // Removed auto-select - user must manually select a vehicle

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToday: () => {
      const today = new Date();
      setMonth(today.getMonth() + 1);
      setYear(today.getFullYear());
    },
    onNextMonth: () => {
      setMonth((prev) => {
        if (prev === 12) {
          setYear((y) => y + 1);
          return 1;
        }
        return prev + 1;
      });
    },
    onPrevMonth: () => {
      setMonth((prev) => {
        if (prev === 1) {
          setYear((y) => y - 1);
          return 12;
        }
        return prev - 1;
      });
    },
    onFocusSearch: () => {
      const searchInput = document.querySelector(
        'input[placeholder*="Search"]'
      ) as HTMLInputElement;
      searchInput?.focus();
    },
    onCreateNote: () => {
      setInlineForm({ isOpen: true, type: 'note' });
    },
    onEscape: () => {
      setQuickActionMenu({ ...quickActionMenu, isOpen: false });
      setInlineForm({ isOpen: false, type: null });
    },
  });

  const handleDayClick = (date: Date, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      // Multi-select mode
      setSelectedDates((prev) => {
        const dateStr = date.toISOString().split('T')[0];
        const exists = prev.some(
          (d) => d.toISOString().split('T')[0] === dateStr
        );
        if (exists) {
          const newDates = prev.filter(
            (d) => d.toISOString().split('T')[0] !== dateStr
          );
          setShowBulkActions(newDates.length > 0);
          return newDates;
        }
        const newDates = [...prev, date].sort((a, b) => a.getTime() - b.getTime());
        setShowBulkActions(true);
        return newDates;
      });
    } else {
      // Open quick action menu or select single date
      if (selectedDates.length > 0) {
        // Clear selection and select new date
        setSelectedDates([date]);
        setShowBulkActions(false);
      } else {
        setQuickActionMenu({
          isOpen: true,
          position: { x: e.clientX, y: e.clientY },
          context: 'day',
          targetDate: date,
        });
        setSelectedDates([date]);
      }
    }
  };

  const handleQuickAdd = (date: Date) => {
    setInlineForm({
      isOpen: true,
      type: 'note',
      date,
    });
  };

  const handleSaveNote = async (data: {
    date?: Date;
    dateRange?: { start: Date; end: Date };
    note: string;
    note_type: 'maintenance' | 'blocked' | 'special';
    vehicle_id?: string;
    vehicle_subunit_id?: string;
    note_id?: string;
  }) => {
    try {
      // If editing an existing note
      if (data.note_id) {
        const updateData: any = {
          note: data.note,
          note_type: data.note_type,
        };
        if (data.date) {
          updateData.note_date = data.date.toISOString().split('T')[0];
        }
        await updateNote(data.note_id, updateData);
        setEditingNote(null);
        // Close form on success
        setInlineForm({ isOpen: false, type: null });
        setSelectedDates([]);
      } else if (data.dateRange) {
        // Create notes for date range
        await createNotesForRange(
          data.dateRange,
          data.vehicle_id || selectedVehicle || undefined,
          data.vehicle_subunit_id,
          data.note,
          data.note_type
        );
        // Close form on success
        setInlineForm({ isOpen: false, type: null });
        setEditingNote(null);
        setSelectedDates([]);
      } else if (data.date) {
        // Create single note
        await createNote({
          vehicle_id: data.vehicle_id || selectedVehicle || undefined,
          vehicle_subunit_id: data.vehicle_subunit_id,
          note_date: data.date.toISOString().split('T')[0],
          note: data.note,
          note_type: data.note_type,
        });
        // Close form on success
        setInlineForm({ isOpen: false, type: null });
        setEditingNote(null);
        setSelectedDates([]);
      }
    } catch (error: any) {
      // Error already handled in hook with toast messages
      // Don't close form on error so user can fix issues
      console.error('Error saving note:', error);
    }
  };

  const handleEditNote = (note: any) => {
    setEditingNote(note);
    const noteDate = new Date(note.note_date);
    setInlineForm({
      isOpen: true,
      type: 'note',
      date: noteDate,
    });
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleSubunitStatusChange = async (subunitId: string, status: string) => {
    try {
      await updateStatus(subunitId, status);
      // Refresh is handled in the hook
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleStatusClick = (status: string) => {
    const currentStatus = filters.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter((s) => s !== status)
      : [...currentStatus, status];
    setFilters({
      ...filters,
      status: newStatus.length > 0 ? newStatus : undefined,
    });
  };

  // Calculate stats for summary cards
  const statsForSummary = availabilityData?.vehicles
    ? availabilityData.vehicles.reduce(
        (acc: any, vehicle: any) => {
          acc.available += vehicle.available_subunits || 0;
          acc.reserved += vehicle.reserved_subunits || 0;
          acc.out_on_rent += vehicle.out_on_rent_subunits || 0;
          acc.returned += vehicle.returned_subunits || 0;
          acc.maintenance += vehicle.maintenance_subunits || 0;
          acc.total += vehicle.total_subunits || 0;
          return acc;
        },
        {
          available: 0,
          reserved: 0,
          out_on_rent: 0,
          returned: 0,
          maintenance: 0,
          blocked: 0,
          total: 0,
        }
      )
    : {
        available: 0,
        reserved: 0,
        out_on_rent: 0,
        returned: 0,
        maintenance: 0,
        blocked: 0,
        total: 0,
      };

  // Filter vehicles based on search and filters
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (filters.searchQuery && searchQuery) {
      const query = (filters.searchQuery || searchQuery).toLowerCase();
      if (
        !vehicle.make?.toLowerCase().includes(query) &&
        !vehicle.model?.toLowerCase().includes(query) &&
        !vehicle.year?.toString().includes(query)
      ) {
        return false;
      }
    }
    if (filters.status && filters.status.length > 0) {
      // Filter by status - check if vehicle has any subunits with matching status
      // This is a simplified check - in a real app, you'd want more sophisticated filtering
      return true; // For now, show all vehicles
    }
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Mobile Message - Show only on mobile */}
      <div className="lg:hidden">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm p-8 text-center">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Desktop View Required</h2>
          <p className="text-gray-400">
            The Availability Management page requires a larger screen to display the calendar view.
            <br />
            Please access this page on a desktop or tablet device.
          </p>
        </div>
      </div>

      {/* Desktop View - Hide on mobile */}
      <div className="hidden lg:block -mx-4 sm:-mx-6 lg:-mx-8 -mb-4 sm:-mb-6 lg:-mb-8">
        {/* Page Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-0 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Availability Management</h1>
              <p className="text-gray-400 text-sm sm:text-base lg:text-lg">View and manage vehicle availability across your fleet</p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
          <div className="flex flex-col h-[calc(100vh-16rem)] lg:h-[calc(100vh-14rem)] bg-gray-900 border border-gray-800 rounded-2xl shadow-sm overflow-hidden">

      {/* Date Navigation Header */}
      <HeaderBar
        month={month}
        year={year}
        onMonthChange={setMonth}
        onYearChange={setYear}
        onToday={() => {
          const today = new Date();
          setMonth(today.getMonth() + 1);
          setYear(today.getFullYear());
        }}
        onNextMonth={() => {
          setMonth((prev) => {
            if (prev === 12) {
              setYear((y) => y + 1);
              return 1;
            }
            return prev + 1;
          });
        }}
        onPrevMonth={() => {
          setMonth((prev) => {
            if (prev === 1) {
              setYear((y) => y - 1);
              return 12;
            }
            return prev - 1;
          });
        }}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        vehicles={vehicles}
        onVehicleSelect={(vehicleId) => {
          setSelectedVehicle(vehicleId);
          setHasMadeSelection(true);
        }}
        onExport={async () => {
          try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            
            // Export as CSV
            const blob = await exportAvailability({
              vehicle_id: selectedVehicle || undefined,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              format: 'csv',
            }) as Blob;
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `availability-export-${year}-${month.toString().padStart(2, '0')}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('Export downloaded successfully');
          } catch (error: any) {
            console.error('Export error:', error);
            toast.error(error.response?.data?.error || 'Error exporting data');
          }
        }}
      />

      {/* Main Content: Dual Pane Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-gray-900">
        {/* Left Panel: Vehicle List */}
        <VehiclePanel
          vehicles={filteredVehicles}
          subunits={subunits}
          availabilityData={availabilityData}
          selectedVehicle={selectedVehicle}
          searchQuery={searchQuery}
          onVehicleSelect={(vehicleId) => {
            setSelectedVehicle(vehicleId);
            setHasMadeSelection(true);
          }}
          onSubunitStatusChange={handleSubunitStatusChange}
          onStatusClick={handleStatusClick}
          loadingSubunits={loading}
          collapsed={vehiclePanelCollapsed}
          onToggleCollapse={() => setVehiclePanelCollapsed(!vehiclePanelCollapsed)}
        />

        {/* Right Panel: Calendar - Hidden on mobile */}
        <div className="hidden lg:flex flex-1 flex-col min-h-0 bg-gray-900 border-l border-gray-800">
          {!hasMadeSelection && (
            <div className="flex items-center justify-center h-full bg-gray-900 p-4">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-sm sm:text-base mb-2">Select a vehicle or "All Cars" to view calendar</p>
                <p className="text-gray-500 text-xs">Choose a specific vehicle to see its availability, or select "All Cars" to view all vehicles</p>
              </div>
            </div>
          )}
          {hasMadeSelection && (
            <CalendarPanel
              month={month}
              year={year}
              availabilityData={availabilityData}
              selectedDates={selectedDates}
              loading={loading}
            onPrevMonth={() => {
              setMonth((prev) => {
                if (prev === 1) {
                  setYear((y) => y - 1);
                  return 12;
                }
                return prev - 1;
              });
            }}
            onNextMonth={() => {
              setMonth((prev) => {
                if (prev === 12) {
                  setYear((y) => y + 1);
                  return 1;
                }
                return prev + 1;
              });
            }}
            onToday={() => {
              const today = new Date();
              setMonth(today.getMonth() + 1);
              setYear(today.getFullYear());
            }}
            onDayClick={handleDayClick}
            onQuickAdd={handleQuickAdd}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            />
          )}
        </div>
      </div>

      {/* Quick Action Menu */}
      <QuickActionMenu
        isOpen={quickActionMenu.isOpen}
        position={quickActionMenu.position}
        context={quickActionMenu.context}
        targetId={quickActionMenu.targetId}
        targetDate={quickActionMenu.targetDate}
        onClose={() => setQuickActionMenu({ ...quickActionMenu, isOpen: false })}
        onAddNote={(date) => {
          setInlineForm({
            isOpen: true,
            type: 'note',
            date: date || quickActionMenu.targetDate,
          });
        }}
        onBlockDate={(date) => {
          setInlineForm({
            isOpen: true,
            type: 'note',
            date: date || quickActionMenu.targetDate,
          });
          // Note: Would need to set note type to 'blocked' - could be handled in form
        }}
        onMaintenance={(date) => {
          setInlineForm({
            isOpen: true,
            type: 'note',
            date: date || quickActionMenu.targetDate,
          });
        }}
        onViewBookings={() => {
          if (quickActionMenu.targetDate) {
            setSelectedBookingDate(quickActionMenu.targetDate);
            setShowBookingModal(true);
          }
        }}
        onExport={async () => {
          try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            
            // Export as CSV
            const blob = await exportAvailability({
              vehicle_id: selectedVehicle || undefined,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              format: 'csv',
            }) as Blob;
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `availability-export-${year}-${month.toString().padStart(2, '0')}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('Export downloaded successfully');
          } catch (error: any) {
            console.error('Export error:', error);
            toast.error(error.response?.data?.error || 'Error exporting data');
          }
        }}
      />

      {/* Inline Note Form */}
      <InlineNoteForm
        isOpen={inlineForm.isOpen && inlineForm.type === 'note'}
        date={inlineForm.date}
        dateRange={inlineForm.dateRange}
        vehicleId={selectedVehicle || undefined}
        editingNote={editingNote}
        onClose={() => {
          setInlineForm({ isOpen: false, type: null });
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
      />

      {/* Bulk Actions Bar */}
      {showBulkActions && selectedDates.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 sm:px-6 py-3 sm:py-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-xs sm:text-sm font-semibold">
                {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => {
                  setSelectedDates([]);
                  setShowBulkActions(false);
                }}
                className="text-xs font-semibold hover:underline transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (selectedDates.length >= 2) {
                    setInlineForm({
                      isOpen: true,
                      type: 'note',
                      dateRange: {
                        start: selectedDates[0],
                        end: selectedDates[selectedDates.length - 1],
                      },
                    });
                  } else if (selectedDates.length === 1) {
                    setInlineForm({
                      isOpen: true,
                      type: 'note',
                      date: selectedDates[0],
                    });
                  }
                  setShowBulkActions(false);
                }}
                className="px-4 py-2 bg-gray-900 text-orange-600 rounded-xl hover:bg-gray-800 text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                Block Selected
              </button>
              <button
                onClick={() => {
                  if (selectedDates.length >= 2) {
                    setInlineForm({
                      isOpen: true,
                      type: 'note',
                      dateRange: {
                        start: selectedDates[0],
                        end: selectedDates[selectedDates.length - 1],
                      },
                    });
                  } else if (selectedDates.length === 1) {
                    setInlineForm({
                      isOpen: true,
                      type: 'note',
                      date: selectedDates[0],
                    });
                  }
                  setShowBulkActions(false);
                }}
                className="px-4 py-2 bg-gray-900 text-orange-600 rounded-xl hover:bg-gray-800 text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                Add Note to Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        onAddNote={() => {
          setInlineForm({ isOpen: true, type: 'note' });
        }}
        onBlockDate={() => {
          setInlineForm({
            isOpen: true,
            type: 'note',
            dateRange:
              selectedDates.length >= 2
                ? {
                    start: selectedDates[0],
                    end: selectedDates[selectedDates.length - 1],
                  }
                : undefined,
          });
        }}
        onExport={async () => {
          try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            
            // Export as CSV
            const blob = await exportAvailability({
              vehicle_id: selectedVehicle || undefined,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              format: 'csv',
            }) as Blob;
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `availability-export-${year}-${month.toString().padStart(2, '0')}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('Export downloaded successfully');
          } catch (error: any) {
            console.error('Export error:', error);
            toast.error(error.response?.data?.error || 'Error exporting data');
          }
        }}
        onBulkUpdate={async () => {
          if (!selectedVehicle || subunits.length === 0) {
            toast.error('Please select a vehicle with subunits');
            return;
          }
          
          const status = prompt('Enter status (available, reserved, out_on_rent, returned, maintenance):');
          if (!status || !['available', 'reserved', 'out_on_rent', 'returned', 'maintenance'].includes(status)) {
            return;
          }
          
          if (confirm(`Update all ${subunits.length} subunits to ${status}?`)) {
            try {
              const subunitIds = subunits.map((s: any) => s.id);
              await bulkUpdateSubunitStatus(subunitIds, status);
              toast.success(`Updated ${subunitIds.length} subunits to ${status}`);
              refresh();
            } catch (error: any) {
              toast.error(error.response?.data?.error || 'Error updating subunits');
            }
          }
        }}
      />

      {/* Booking Details Modal */}
      <BookingDetailsModal
        isOpen={showBookingModal}
        date={selectedBookingDate || new Date()}
        vehicleId={selectedVehicle || undefined}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedBookingDate(null);
        }}
      />
          </div>
        </div>
      </div>
    </div>
  );
}
