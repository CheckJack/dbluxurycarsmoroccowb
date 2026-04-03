'use client';

import { Plus, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type DayStatus =
  | 'available'
  | 'reserved'
  | 'out_on_rent'
  | 'returned'
  | 'maintenance'
  | 'blocked';

interface DayInfo {
  date: Date;
  status: DayStatus;
  startTimes: string[];
  endTimes: string[];
  notes: any[];
  bookings: any[];
  hasConflict?: boolean;
}

interface CalendarDayCellProps {
  dayInfo: DayInfo;
  isToday: boolean;
  inCurrentMonth: boolean;
  onCellClick?: (date: Date, e: React.MouseEvent) => void;
  onQuickAdd?: (date: Date) => void;
  onEditNote?: (note: any) => void;
  onDeleteNote?: (noteId: string) => void;
}

function getStatusColor(status: DayStatus) {
  switch (status) {
    case 'available':
      return 'bg-green-50 border-green-400';
    case 'reserved':
      return 'bg-yellow-50 border-yellow-400';
    case 'out_on_rent':
      return 'bg-blue-50 border-blue-400';
    case 'returned':
      return 'bg-purple-50 border-purple-400';
    case 'maintenance':
      return 'bg-orange-50 border-orange-400';
    case 'blocked':
      return 'bg-red-50 border-red-400';
    default:
      return 'bg-gray-50 border-gray-400';
  }
}

function getTextColor(status: DayStatus) {
  return 'text-gray-900';
}

function getStatusLabel(status: DayStatus): string {
  switch (status) {
    case 'available':
      return '';
    case 'reserved':
      return 'Reserved';
    case 'out_on_rent':
      return 'Out/On Rent';
    case 'returned':
      return 'Returned';
    case 'maintenance':
      return 'Maintenance';
    case 'blocked':
      return 'Blocked';
    default:
      return '';
  }
}

export default function CalendarDayCell({
  dayInfo,
  isToday,
  inCurrentMonth,
  onCellClick,
  onQuickAdd,
  onEditNote,
  onDeleteNote,
}: CalendarDayCellProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [showNoteTooltip, setShowNoteTooltip] = useState<string | null>(null);
  const [showBookingTooltip, setShowBookingTooltip] = useState(false);
  const [showConflictTooltip, setShowConflictTooltip] = useState(false);

  const statusClasses = getStatusColor(dayInfo.status);
  const textColor = getTextColor(dayInfo.status);
  const borderHighlight = isToday ? 'ring-2 ring-blue-600' : '';
  const opacityClass = inCurrentMonth ? '' : 'opacity-40';
  const conflictClass = dayInfo.hasConflict ? 'ring-2 ring-red-600' : '';

  const statusLabel = getStatusLabel(dayInfo.status);
  const isDarkBackground = false; // All backgrounds are now light

  return (
    <div
      className={`
        min-h-[80px] p-1.5 border-2 rounded text-xs flex flex-col gap-0.5 cursor-pointer
        transition-all hover:shadow-lg
        ${statusClasses} ${textColor} ${borderHighlight} ${opacityClass} ${conflictClass}
      `}
      onClick={(e) => onCellClick?.(dayInfo.date, e)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold ${isDarkBackground ? 'text-white' : 'text-gray-900'}`}>
          {dayInfo.date.getDate()}
        </span>
        {inCurrentMonth && statusLabel && (
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold truncate max-w-[70px] ${
            isDarkBackground 
              ? 'bg-white/20 text-white' 
              : 'bg-gray-900 text-white'
          }`}>
            {statusLabel}
          </span>
        )}
      </div>

      {inCurrentMonth && dayInfo.bookings.length > 0 && (
        <div 
          className="relative"
          onMouseEnter={() => setShowBookingTooltip(true)}
          onMouseLeave={() => setShowBookingTooltip(false)}
        >
          {(() => {
            const activeBookings = dayInfo.bookings.filter((b: any) => 
              (b.status || b.booking_status) !== 'cancelled'
            );
            const cancelledBookings = dayInfo.bookings.filter((b: any) => 
              (b.status || b.booking_status) === 'cancelled'
            );
            
            return (
              <div className="space-y-0.5">
                {activeBookings.length > 0 && (
                  <div className={`text-[9px] font-bold cursor-pointer hover:underline ${isDarkBackground ? 'text-blue-200' : 'text-blue-700'}`}>
                    {activeBookings.length} booking{activeBookings.length !== 1 ? 's' : ''}
                  </div>
                )}
                {cancelledBookings.length > 0 && (
                  <div className={`text-[9px] font-bold cursor-pointer hover:underline ${isDarkBackground ? 'text-red-200' : 'text-red-700'}`}>
                    {cancelledBookings.length} cancelled
                  </div>
                )}
              </div>
            );
          })()}
          {showBookingTooltip && (
            <div className="absolute z-50 bottom-full left-0 mb-1 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl max-w-[250px] min-w-[200px]">
              <div className="font-bold mb-2 text-sm border-b border-gray-700 pb-1">
                {dayInfo.bookings.length} Booking{dayInfo.bookings.length !== 1 ? 's' : ''}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {dayInfo.bookings.map((booking: any, index: number) => (
                  <div key={index} className="border-b border-gray-800 pb-2 last:border-0">
                    {booking.booking_number ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/bookings/${booking.booking_number}`);
                        }}
                        className="font-semibold text-blue-300 hover:text-blue-200 hover:underline cursor-pointer"
                      >
                        {booking.booking_number}
                      </button>
                    ) : (
                      <div className="font-semibold text-blue-300">
                        Booking {index + 1}
                      </div>
                    )}
                    <div className="text-gray-300 mt-1">
                      <div>Customer: {booking.first_name} {booking.last_name}</div>
                      <div>Status: <span className="capitalize">{booking.status || booking.booking_status}</span></div>
                      {booking.pickup_date && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          Pickup: {new Date(booking.pickup_date).toLocaleString('en-GB', { 
                            day: '2-digit', 
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                      {booking.dropoff_date && (
                        <div className="text-[10px] text-gray-400">
                          Dropoff: {new Date(booking.dropoff_date).toLocaleString('en-GB', { 
                            day: '2-digit', 
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {inCurrentMonth && dayInfo.notes.length > 0 && (
        <div 
          className="relative"
          onMouseEnter={() => setShowNoteTooltip('notes')}
          onMouseLeave={() => setShowNoteTooltip(null)}
        >
          <div className={`text-[9px] font-bold cursor-pointer hover:underline ${
            dayInfo.notes[0].note_type === 'maintenance' 
              ? 'text-orange-700' 
              : dayInfo.notes[0].note_type === 'blocked'
              ? 'text-red-700'
              : 'text-purple-700'
          }`}>
            {dayInfo.notes.length} note{dayInfo.notes.length !== 1 ? 's' : ''}
          </div>
          {showNoteTooltip === 'notes' && (
            <div className="absolute z-50 bottom-full left-0 mb-1 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl max-w-[250px] min-w-[200px]">
              <div className="font-bold mb-2 text-sm border-b border-gray-700 pb-1">
                {dayInfo.notes.length} Note{dayInfo.notes.length !== 1 ? 's' : ''}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {dayInfo.notes.map((note: any, index: number) => (
                  <div key={note.id} className="border-b border-gray-800 pb-2 last:border-0">
                    <div className={`font-semibold capitalize ${
                      note.note_type === 'maintenance' 
                        ? 'text-orange-300' 
                        : note.note_type === 'blocked'
                        ? 'text-red-300'
                        : 'text-purple-300'
                    }`}>
                      {note.note_type}
                    </div>
                    <div className="text-gray-300 mt-1">
                      {note.note}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditNote?.(note);
                          setShowNoteTooltip(null);
                        }}
                        className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this note?')) {
                            onDeleteNote?.(note.id);
                          }
                          setShowNoteTooltip(null);
                        }}
                        className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isHovered && inCurrentMonth && onQuickAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(dayInfo.date);
          }}
          className={`mt-auto ml-auto p-1 rounded-full shadow-md transition-all ${
            isDarkBackground 
              ? 'bg-white/20 hover:bg-white/30 text-white' 
              : 'bg-gray-900 hover:bg-gray-800 text-white'
          }`}
          title="Quick add note"
        >
          <Plus className="w-3 h-3" />
        </button>
      )}

      {dayInfo.hasConflict && inCurrentMonth && (
        <div 
          className="relative mt-auto"
          onMouseEnter={() => setShowConflictTooltip(true)}
          onMouseLeave={() => setShowConflictTooltip(false)}
        >
          <div className={`flex items-center gap-1 text-[9px] font-bold cursor-pointer hover:underline ${
            isDarkBackground ? 'text-red-300' : 'text-red-700'
          }`}>
            <AlertCircle className="w-3 h-3" />
            <span>Conflict</span>
          </div>
          {showConflictTooltip && (
            <div className="absolute z-50 bottom-full left-0 mb-1 p-3 bg-red-900 text-white text-xs rounded-lg shadow-xl max-w-[250px] min-w-[200px] border-2 border-red-600">
              <div className="font-bold mb-2 text-sm border-b border-red-700 pb-1 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Booking Conflict Detected
              </div>
              <div className="space-y-2">
                <p className="text-red-100">
                  Multiple bookings overlap on this date for the same vehicle unit:
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {dayInfo.bookings
                    .filter((b: any) => (b.status || b.booking_status) !== 'cancelled')
                    .map((booking: any, index: number) => (
                      <div key={index} className="bg-red-800/50 p-2 rounded border border-red-700">
                        {booking.booking_number ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/bookings/${booking.booking_number}`);
                            }}
                            className="font-semibold text-red-100 hover:text-red-50 hover:underline cursor-pointer"
                          >
                            {booking.booking_number}
                          </button>
                        ) : (
                          <div className="font-semibold text-red-100">
                            Booking {index + 1}
                          </div>
                        )}
                        <div className="text-[10px] text-red-200 mt-1">
                          {new Date(booking.pickup_date).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: '2-digit'
                          })} - {new Date(booking.dropoff_date).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: '2-digit'
                          })}
                        </div>
                      </div>
                    ))}
                </div>
                <p className="text-red-100 text-[10px] mt-2 pt-2 border-t border-red-700">
                  ⚠️ Review and resolve this conflict to prevent double-booking.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
