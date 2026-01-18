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
  Settings,
  ChevronDown,
  Clock,
  Package,
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
}

interface CategoryColor {
  id: string;
  category: string;
  color_bg: string;
  color_text: string;
  color_border: string;
  hex_color: string;
}

type ViewMode = "month" | "week" | "day";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [categoryColors, setCategoryColors] = useState<CategoryColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [eventType, setEventType] = useState<"event" | "delivery" | "pickup">("event");
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [showBookingDetail, setShowBookingDetail] = useState(false);
  const [showColorSettings, setShowColorSettings] = useState(false);
  const [editingColor, setEditingColor] = useState<CategoryColor | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch bookings
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
            .select("full_name, phone, email")
            .eq("id", booking.customer_id)
            .single();

          return {
            ...booking,
            customer_name: customerData?.full_name || "Okänd",
            customer_phone: customerData?.phone || "",
            customer_email: customerData?.email || "",
          };
        })
      );

      setBookings(bookingsWithCustomers);

      // Fetch category colors
      const { data: colorsData, error: colorsError } = await supabase
        .from("category_colors")
        .select("*")
        .order("category");

      if (colorsError) throw colorsError;
      setCategoryColors(colorsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    return bookings.filter((booking) => {
      if (eventType === "event") {
        // Check if date is within event dates
        if (booking.event_date && booking.event_end_date) {
          const start = new Date(booking.event_date);
          const end = new Date(booking.event_end_date);
          const current = new Date(dateStr);
          return current >= start && current <= end;
        }
        return booking.event_date === dateStr;
      } else if (eventType === "delivery") {
        return booking.delivery_date === dateStr;
      } else {
        return booking.pickup_date === dateStr;
      }
    });
  };

  const getCategoryFromBooking = (booking: CalendarBooking): string => {
    // Try to extract category from products_requested
    try {
      let products = booking.products_requested;
      if (typeof products === "string") {
        if (products.startsWith('"')) {
          products = JSON.parse(products);
        }
        products = JSON.parse(products);
      }
      if (Array.isArray(products) && products.length > 0) {
        // For now, use first product's category or name
        return products[0].category || "Övrigt";
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return "Övrigt";
  };

  const getColorForBooking = (booking: CalendarBooking) => {
    const category = getCategoryFromBooking(booking);
    const color = categoryColors.find((c) => c.category === category);
    return (
      color || {
        color_bg: "bg-gray-100",
        color_text: "text-gray-700",
        color_border: "border-gray-300",
      }
    );
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
                    {bookingsOnDay.slice(0, 3).map((booking) => {
                      const color = getColorForBooking(booking);
                      return (
                        <div
                          key={booking.id}
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowBookingDetail(true);
                          }}
                          className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity truncate border ${
                            color.color_bg
                          } ${color.color_text} ${color.color_border}`}
                          title={`${booking.booking_number} - ${booking.customer_name}`}
                        >
                          <span className="font-semibold">{booking.booking_number}</span>
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
                    {bookingsOnDay.map((booking) => {
                      const color = getColorForBooking(booking);
                      return (
                        <div
                          key={booking.id}
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowBookingDetail(true);
                          }}
                          className={`p-2 rounded cursor-pointer hover:shadow-md transition-all border text-xs font-medium ${
                            color.color_bg
                          } ${color.color_text} ${color.color_border} truncate`}
                          title={booking.booking_number}
                        >
                          {booking.booking_number}
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
                const color = getColorForBooking(booking);
                return (
                  <div
                    key={booking.id}
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowBookingDetail(true);
                    }}
                    className={`bg-white rounded-lg p-6 border-l-4 cursor-pointer hover:shadow-lg transition-all ${color.color_border}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{booking.booking_number}</p>
                        <p className={`text-sm font-medium mt-1 ${color.color_text}`}>{getCategoryFromBooking(booking)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color.color_bg} ${color.color_text}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        {booking.customer_name}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        {booking.location}
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
          <p className="text-gray-500 mt-1">Visualisera bokningar i kalender med kategoribaserade färger</p>
        </div>
        <button
          onClick={() => setShowColorSettings(true)}
          className="flex items-center gap-2 bg-blue-50 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
        >
          <Settings size={20} />
          Färginställningar
        </button>
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

          <div className="h-6 w-px bg-gray-300" />

          <div className="flex gap-2">
            {[
              { value: "event", label: "Event-datum" },
              { value: "delivery", label: "Leverans" },
              { value: "pickup", label: "Retur" },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setEventType(type.value as "event" | "delivery" | "pickup")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all text-sm ${
                  eventType === type.value
                    ? "bg-gradient-to-r from-red-600 to-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          {categoryColors.map((color) => (
            <div key={color.id} className="flex items-center gap-2 text-sm">
              <div className={`w-4 h-4 rounded border-2 ${color.color_bg} ${color.color_border}`} />
              <span className="text-gray-700">{color.category}</span>
            </div>
          ))}
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
                  <p className="text-lg font-semibold text-gray-900">{selectedBooking.location}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs font-medium text-blue-700">Event-datum</p>
                  <p className="text-sm font-bold text-blue-900 mt-1">{format(new Date(selectedBooking.event_date), "d MMM yyyy", { locale: sv })}</p>
                  {selectedBooking.event_end_date && selectedBooking.event_end_date !== selectedBooking.event_date && (
                    <p className="text-xs text-blue-600 mt-1">till {format(new Date(selectedBooking.event_end_date), "d MMM", { locale: sv })}</p>
                  )}
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-xs font-medium text-green-700">Leverans</p>
                  <p className="text-sm font-bold text-green-900 mt-1">{format(new Date(selectedBooking.delivery_date), "d MMM yyyy", { locale: sv })}</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-xs font-medium text-orange-700">Retur</p>
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

      {/* Color Settings Modal */}
      {showColorSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="border-b p-6 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Färginställningar för kategorier</h2>
              <button onClick={() => setShowColorSettings(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {categoryColors.map((color) => (
                <div key={color.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-12 h-12 rounded-lg border-2 ${color.color_bg} ${color.color_border} flex items-center justify-center`}>
                    <Package className={color.color_text} size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{color.category}</p>
                    <p className="text-xs text-gray-500 mt-1">{color.hex_color}</p>
                  </div>
                  <button
                    onClick={() => {
                      alert("Färgredigering kommer snart! Du kan uppdatera category_colors-tabellen manuellt.");
                    }}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                  >
                    Ändra
                  </button>
                </div>
              ))}

              <div className="border-t pt-4 mt-6">
                <button
                  onClick={() => setShowColorSettings(false)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Stäng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

