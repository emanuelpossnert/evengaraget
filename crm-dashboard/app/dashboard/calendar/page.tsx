"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  DollarSign,
  X,
  ChevronDown,
  Clock,
} from "lucide-react";
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  getDay,
} from "date-fns";
import { sv } from "date-fns/locale";

interface CalendarBooking {
  id: string;
  booking_number: string;
  event_date: string;
  event_end_date: string;
  delivery_date: string;
  pickup_date: string;
  location: string;
  status: string;
  total_amount: number;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  products_requested?: any;
  delivery_type?: string; // "internal" or "external"
  eventType?: "event" | "delivery" | "pickup"; // For calendar display
}

type ViewMode = "month" | "week" | "day";
type EventType = "event" | "delivery" | "pickup";

interface EventFilters {
  event: boolean;
  delivery: boolean;
  pickup: boolean;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [eventFilters, setEventFilters] = useState<EventFilters>({
    event: true,
    delivery: true,
    pickup: true,
  });
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [showBookingDetail, setShowBookingDetail] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch bookings with delivery_type
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .in("status", ["pending", "confirmed", "completed"]);

      if (bookingsError) throw bookingsError;

      // Fetch customer names
      const bookingsWithCustomers = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          const { data: customerData } = await supabase
            .from("customers")
            .select("name, phone, email")
            .eq("id", booking.customer_id)
            .single();

          return {
            ...booking,
            customer_name: customerData?.name || "Okänd",
            customer_phone: customerData?.phone || "",
            customer_email: customerData?.email || "",
          };
        })
      );

      setBookings(bookingsWithCustomers);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingsForDate = (date: Date, type?: EventType) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const result: CalendarBooking[] = [];

    bookings.forEach((booking) => {
      // Check Event matches
      if (eventFilters.event && booking.event_date) {
        if (booking.event_end_date) {
          const start = new Date(booking.event_date);
          const end = new Date(booking.event_end_date);
          const current = new Date(dateStr);
          if (current >= start && current <= end) {
            result.push({ ...booking, eventType: "event" });
          }
        } else if (booking.event_date === dateStr) {
          result.push({ ...booking, eventType: "event" });
        }
      }

      // Check Delivery matches
      if (eventFilters.delivery && booking.delivery_date === dateStr) {
        result.push({ ...booking, eventType: "delivery" });
      }

      // Check Pickup/Retur matches
      if (eventFilters.pickup && booking.pickup_date === dateStr) {
        result.push({ ...booking, eventType: "pickup" });
      }
    });

    return result;
  };

  const getCategoryFromBooking = (booking: CalendarBooking, eventType?: EventType): string => {
    // Return category based on event type
    if (eventType === "delivery") {
      // Show if it's internal or external delivery
      return booking.delivery_type === "internal" ? "🏢 Intern leverans" : "🚚 Extern leverans";
    }
    if (eventType === "pickup") return "🔄 Retur";

    // For event type, just return "Evenemang"
    return "📅 Evenemang";
  };

  const getColorForBooking = (booking: CalendarBooking, eventType?: EventType) => {
    let category = getCategoryFromBooking(booking, eventType);

    // Default colors for different delivery types and events
    if (category === "🏢 Intern leverans") {
      return {
        color_bg: "bg-blue-100",
        color_text: "text-blue-700",
        color_border: "border-blue-300",
        hex_color: "#3B82F6",
      };
    }
    if (category === "🚚 Extern leverans") {
      return {
        color_bg: "bg-green-100",
        color_text: "text-green-700",
        color_border: "border-green-300",
        hex_color: "#10B981",
      };
    }
    if (category === "🔄 Retur") {
      return {
        color_bg: "bg-orange-100",
        color_text: "text-orange-700",
        color_border: "border-orange-300",
        hex_color: "#F97316",
      };
    }
    if (category === "📅 Evenemang") {
      return {
        color_bg: "bg-purple-100",
        color_text: "text-purple-700",
        color_border: "border-purple-300",
        hex_color: "#A855F7",
      };
    }

    return {
      color_bg: "bg-gray-100",
      color_text: "text-gray-700",
      color_border: "border-gray-300",
    };
  };


  // Month View
  const renderMonthView = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    const firstDay = days[0];
    const paddingDays = getDay(firstDay) === 0 ? 6 : getDay(firstDay) - 1;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentDate, "MMMM yyyy", { locale: sv })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              Idag
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 py-3 text-sm border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {/* Padding days */}
            {Array.from({ length: paddingDays }).map((_, idx) => (
              <div key={`padding-${idx}`} className="min-h-32 bg-gray-50 border border-gray-200 p-2" />
            ))}

            {/* Days */}
            {days.map((day) => {
              const bookingsOnDay = getBookingsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-32 border border-gray-200 p-2 overflow-y-auto transition-all ${
                    isCurrentMonth
                      ? isTodayDate
                        ? "border-red-500 bg-red-50"
                        : "bg-white hover:bg-gray-50"
                      : "bg-gray-50"
                  }`}
                >
                  <p className={`text-sm font-semibold mb-1 ${isTodayDate ? "text-red-600" : "text-gray-600"}`}>
                    {format(day, "d")}
                  </p>

                  {/* Bookings */}
                  <div className="space-y-1">
                    {bookingsOnDay.slice(0, 3).map((booking, idx) => {
                      const color = getColorForBooking(booking, booking.eventType as EventType);
                      const typeLabel = booking.eventType === "delivery" ? "📦" : booking.eventType === "pickup" ? "🔄" : "📅";
                      return (
                        <div
                          key={`${booking.id}-${booking.eventType}-${idx}`}
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowBookingDetail(true);
                          }}
                          className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity truncate border ${
                            color.color_bg
                          } ${color.color_text} ${color.color_border}`}
                          title={`${booking.booking_number} - ${booking.customer_name} - ${typeLabel}`}
                        >
                          <span className="font-semibold">{typeLabel} {booking.booking_number}</span>
                        </div>
                      );
                    })}
                    {bookingsOnDay.length > 3 && (
                      <p className="text-xs text-gray-500 px-1">+{bookingsOnDay.length - 3} till</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Week View
  const renderWeekView = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Vecka {format(currentDate, "w", { locale: sv })} - {format(start, "d MMM", { locale: sv })} till{" "}
            {format(end, "d MMM yyyy", { locale: sv })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              Idag
            </button>
            <button
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 p-4">
            {days.map((day) => {
              const bookingsOnDay = getBookingsForDate(day);
              const isTodayDate = isToday(day);

              return (
                <div key={day.toISOString()} className="flex flex-col">
                  <div className={`text-center font-semibold mb-2 p-2 rounded-lg ${isTodayDate ? "bg-red-100 text-red-600" : "bg-gray-50 text-gray-600"}`}>
                    <p className="text-sm">{format(day, "EEE", { locale: sv })}</p>
                    <p className="text-lg">{format(day, "d")}</p>
                  </div>

                  <div className="flex-1 space-y-2 min-h-96">
                    {bookingsOnDay.map((booking, idx) => {
                      const color = getColorForBooking(booking, booking.eventType as EventType);
                      const typeLabel = booking.eventType === "delivery" ? "📦" : booking.eventType === "pickup" ? "🔄" : "📅";
                      return (
                        <div
                          key={`${booking.id}-${booking.eventType}-${idx}`}
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowBookingDetail(true);
                          }}
                          className={`p-2 rounded cursor-pointer hover:shadow-md transition-all border text-xs font-medium ${
                            color.color_bg
                          } ${color.color_text} ${color.color_border} truncate`}
                          title={`${booking.booking_number} - ${typeLabel}`}
                        >
                          {typeLabel} {booking.booking_number}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Day View
  const renderDayView = () => {
    const bookingsOnDay = getBookingsForDate(currentDate);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentDate, "EEEE d MMMM yyyy", { locale: sv })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(subDays(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              Idag
            </button>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {bookingsOnDay.length === 0 ? (
              <div className="bg-white rounded-lg p-12 border border-gray-200 text-center text-gray-500">
                <Calendar size={32} className="mx-auto mb-2 text-gray-400" />
                <p>Inga bokningar denna dag</p>
              </div>
            ) : (
              bookingsOnDay.map((booking) => {
                const eventColor = getColorForBooking(booking, "event");
                const deliveryColor = getColorForBooking(booking, "delivery");
                const pickupColor = getColorForBooking(booking, "pickup");

                return (
                  <div
                    key={booking.id}
                    className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-all"
                  >
                    {/* Booking Header */}
                    <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-200">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{booking.booking_number}</p>
                        <p className="text-sm text-gray-600 mt-1">{booking.customer_name}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${eventColor.color_bg} ${eventColor.color_text}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    {/* Timeline: Event, Delivery, Retur */}
                    <div className="space-y-2 mb-4">
                      {/* Event */}
                      <div
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowBookingDetail(true);
                        }}
                        className={`p-3 rounded cursor-pointer hover:opacity-80 transition-opacity border-l-4 ${eventColor.color_bg} ${eventColor.color_border}`}
                      >
                        <p className="text-xs font-semibold text-gray-600">📅 EVENT</p>
                        <p className={`text-sm font-medium ${eventColor.color_text}`}>
                          {format(new Date(booking.event_date), "d MMM", { locale: sv })}
                          {booking.event_end_date && booking.event_end_date !== booking.event_date
                            ? ` - ${format(new Date(booking.event_end_date), "d MMM", { locale: sv })}`
                            : ""}
                        </p>
                      </div>

                      {/* Leverans */}
                      <div
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowBookingDetail(true);
                        }}
                        className={`p-3 rounded cursor-pointer hover:opacity-80 transition-opacity border-l-4 ${booking.delivery_type === "internal" ? "bg-blue-50 border-blue-300" : "bg-green-50 border-green-300"}`}
                      >
                        <p className="text-xs font-semibold text-gray-600">
                          {booking.delivery_type === "internal" ? "🏢 INTERN LEVERANS" : "🚚 EXTERN LEVERANS"}
                        </p>
                        <p className={`text-sm font-medium ${booking.delivery_type === "internal" ? "text-blue-700" : "text-green-700"}`}>
                          {format(new Date(booking.delivery_date), "d MMM", { locale: sv })}
                        </p>
                      </div>

                      {/* Retur */}
                      {booking.pickup_date && (
                        <div
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowBookingDetail(true);
                          }}
                          className={`p-3 rounded cursor-pointer hover:opacity-80 transition-opacity border-l-4 ${pickupColor.color_bg} ${pickupColor.color_border}`}
                        >
                          <p className="text-xs font-semibold text-gray-600">🔄 RETUR</p>
                          <p className={`text-sm font-medium ${pickupColor.color_text}`}>
                            {format(new Date(booking.pickup_date), "d MMM", { locale: sv })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <a 
                          href={`https://www.google.com/maps/search/${encodeURIComponent(booking.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                          title="Öppna i Google Maps"
                        >
                          {booking.location} 🗺️
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} />
                        {booking.total_amount.toLocaleString("sv-SE")} SEK
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">Bokningar denna dag</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{bookingsOnDay.length}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <p className="text-sm text-green-700 font-medium">Total intäkt</p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {bookingsOnDay.reduce((sum, b) => sum + b.total_amount, 0).toLocaleString("sv-SE")}
              </p>
              <p className="text-xs text-green-600 mt-2">SEK</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bokningskalender</h1>
          <p className="text-gray-500 mt-1">Visualisera bokningar i kalender - Intern/Extern leverans</p>
        </div>
      </div>

      {/* View Mode & Event Type Filter */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {[
              { value: "month", label: "Månad" },
              { value: "week", label: "Vecka" },
              { value: "day", label: "Dag" },
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => setViewMode(mode.value as ViewMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === mode.value
                    ? "bg-gradient-to-r from-red-600 to-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

        </div>

        {/* Event Type Filters (for showing multiple) */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              <input
                type="checkbox"
                checked={eventFilters.event}
                onChange={(e) => setEventFilters({ ...eventFilters, event: e.target.checked })}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              📅 Evenemang
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              <input
                type="checkbox"
                checked={eventFilters.delivery}
                onChange={(e) => setEventFilters({ ...eventFilters, delivery: e.target.checked })}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              🚚 Leverans (Intern/Extern)
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              <input
                type="checkbox"
                checked={eventFilters.pickup}
                onChange={(e) => setEventFilters({ ...eventFilters, pickup: e.target.checked })}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              🔄 Retur
            </label>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          {/* Color Legend for delivery types */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded border-2 bg-blue-100 border-blue-300" />
              <span className="text-gray-700">🏢 Intern leverans</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded border-2 bg-green-100 border-green-300" />
              <span className="text-gray-700">🚚 Extern leverans</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded border-2 bg-orange-100 border-orange-300" />
              <span className="text-gray-700">🔄 Retur</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded border-2 bg-purple-100 border-purple-300" />
              <span className="text-gray-700">📅 Evenemang</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Laddar bokningskalender...</div>
      ) : viewMode === "month" ? (
        renderMonthView()
      ) : viewMode === "week" ? (
        renderWeekView()
      ) : (
        renderDayView()
      )}

      {/* Booking Detail Modal */}
      {showBookingDetail && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="border-b p-6 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Bokningsdetaljer</h2>
              <button onClick={() => setShowBookingDetail(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{selectedBooking.booking_number}</p>
                  <p className="text-gray-500 mt-1">{getCategoryFromBooking(selectedBooking)}</p>
                </div>
                <span className={`px-4 py-2 rounded-full font-semibold ${getColorForBooking(selectedBooking).color_bg} ${getColorForBooking(selectedBooking).color_text}`}>
                  {selectedBooking.status}
                </span>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kund</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedBooking.customer_name}</p>
                  {selectedBooking.customer_email && <p className="text-sm text-gray-600 mt-1">{selectedBooking.customer_email}</p>}
                  {selectedBooking.customer_phone && <p className="text-sm text-gray-600">{selectedBooking.customer_phone}</p>}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Plats</p>
                  <a 
                    href={`https://www.google.com/maps/search/${encodeURIComponent(selectedBooking.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-blue-600 hover:text-blue-800 underline"
                    title="Öppna i Google Maps"
                  >
                    {selectedBooking.location} 🗺️
                  </a>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-xs font-medium text-purple-700">📅 Event-datum</p>
                  <p className="text-sm font-bold text-purple-900 mt-1">{format(new Date(selectedBooking.event_date), "d MMM yyyy", { locale: sv })}</p>
                  {selectedBooking.event_end_date && selectedBooking.event_end_date !== selectedBooking.event_date && (
                    <p className="text-xs text-purple-600 mt-1">till {format(new Date(selectedBooking.event_end_date), "d MMM", { locale: sv })}</p>
                  )}
                </div>

                <div className={`rounded-lg p-4 border ${selectedBooking.delivery_type === "internal" ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"}`}>
                  <p className={`text-xs font-medium ${selectedBooking.delivery_type === "internal" ? "text-blue-700" : "text-green-700"}`}>
                    {selectedBooking.delivery_type === "internal" ? "🏢 Intern leverans" : "🚚 Extern leverans"}
                  </p>
                  <p className={`text-sm font-bold mt-1 ${selectedBooking.delivery_type === "internal" ? "text-blue-900" : "text-green-900"}`}>
                    {format(new Date(selectedBooking.delivery_date), "d MMM yyyy", { locale: sv })}
                  </p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-xs font-medium text-orange-700">🔄 Retur</p>
                  <p className="text-sm font-bold text-orange-900 mt-1">{format(new Date(selectedBooking.pickup_date), "d MMM yyyy", { locale: sv })}</p>
                </div>
              </div>

              {/* Products */}
              {selectedBooking.products_requested && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-3">Produkter</p>
                  <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                    {(() => {
                      try {
                        let products = selectedBooking.products_requested;
                        if (typeof products === "string") {
                          if (products.startsWith('"')) {
                            products = JSON.parse(products);
                          }
                          products = JSON.parse(products);
                        }
                        return Array.isArray(products) ? (
                          products.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                              <span className="text-sm text-gray-700">{p.name}</span>
                              <span className="text-sm font-semibold text-gray-900">{p.quantity || 1} st</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-600">Ingen produktdata</p>
                        );
                      } catch (e) {
                        return <p className="text-sm text-gray-600">Kunde inte läsa produkter</p>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Financial */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">Totalt belopp</span>
                  <span className="text-3xl font-bold text-orange-600">{selectedBooking.total_amount.toLocaleString("sv-SE")} SEK</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t pt-6">
                <button
                  onClick={() => {
                    window.location.href = `/dashboard/bookings/${selectedBooking.id}`;
                  }}
                  className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
                >
                  Se fullständig bokning
                </button>
                <button
                  onClick={() => setShowBookingDetail(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Stäng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Color Settings Modal - REMOVED */}
    </div>
  );
}

