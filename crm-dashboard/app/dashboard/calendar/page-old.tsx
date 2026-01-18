"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, ChevronLeft, ChevronRight, MapPin, User, DollarSign } from "lucide-react";
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { sv } from "date-fns/locale";

interface CalendarBooking {
  id: string;
  booking_number: string;
  event_date: string;
  delivery_date: string;
  pickup_date: string;
  location: string;
  status: string;
  total_amount: number;
  customer_id: string;
  customer_name?: string;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [eventType, setEventType] = useState<"event" | "delivery" | "pickup">("event");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .in("status", ["confirmed", "completed"]);

      if (error) throw error;

      // Fetch customer names
      const bookingsWithCustomers = await Promise.all(
        (data || []).map(async (booking) => {
          const { data: customerData } = await supabase
            .from("customers")
            .select("full_name")
            .eq("id", booking.customer_id)
            .single();

          return {
            ...booking,
            customer_name: customerData?.full_name || "Okänd",
          };
        })
      );

      setBookings(bookingsWithCustomers);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    return bookings.filter((booking) => {
      if (eventType === "event") {
        return booking.event_date === dateStr;
      } else if (eventType === "delivery") {
        return booking.delivery_date === dateStr;
      } else {
        return booking.pickup_date === dateStr;
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const days = getDaysInMonth();
  const firstDay = days[0];
  const paddingDays = firstDay.getDay();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bokningskalender</h1>
          <p className="text-gray-500 mt-1">Visualisera alla bokningar i en kalender</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="text-red-600" size={28} />
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {format(currentMonth, "MMMM yyyy", { locale: sv })}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Idag
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Event Type Filter */}
          <div className="flex gap-2">
            {[
              { value: "event", label: "Event-datum" },
              { value: "delivery", label: "Leveransdatum" },
              { value: "pickup", label: "Returdatum" },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setEventType(type.value as "event" | "delivery" | "pickup")}
                className={`px-3 py-1 rounded-lg font-medium transition-all text-sm ${
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

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2 text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Padding days */}
            {Array.from({ length: paddingDays }).map((_, idx) => (
              <div key={`padding-${idx}`} className="aspect-square" />
            ))}

            {/* Days */}
            {days.map((day) => {
              const bookingsOnDay = getBookingsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`aspect-square border rounded-lg p-2 overflow-y-auto transition-all ${
                    isCurrentMonth
                      ? isTodayDate
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold mb-1 ${
                      isTodayDate ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    {format(day, "d")}
                  </p>

                  {/* Bookings on this day */}
                  <div className="space-y-1">
                    {bookingsOnDay.slice(0, 2).map((booking) => (
                      <div
                        key={booking.id}
                        className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate ${getStatusColor(
                          booking.status
                        )}`}
                        title={`${booking.booking_number} - ${booking.customer_name}`}
                      >
                        {booking.booking_number}
                      </div>
                    ))}
                    {bookingsOnDay.length > 2 && (
                      <p className="text-xs text-gray-500 px-1">+{bookingsOnDay.length - 2} till</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Date Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Alla Bokningar</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {bookings.filter((b) => b.status === "confirmed").length === 0 ? (
              <p className="text-gray-500">Inga bekräftade bokningar</p>
            ) : (
              bookings
                .filter((b) => b.status === "confirmed")
                .map((booking) => (
                  <div key={booking.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{booking.booking_number}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                          <User size={14} />
                          {booking.customer_name}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                          <MapPin size={14} />
                          {booking.location}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <DollarSign size={14} />
                          {booking.total_amount.toLocaleString("sv-SE")} SEK
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(booking.event_date), "dd MMM", { locale: sv })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <p className="text-sm text-green-700 font-medium">Bekräftade Bokningar</p>
            <p className="text-3xl font-bold text-green-900 mt-2">
              {bookings.filter((b) => b.status === "confirmed").length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <p className="text-sm text-blue-700 font-medium">Slutförda Bokningar</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">
              {bookings.filter((b) => b.status === "completed").length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
            <p className="text-sm text-orange-700 font-medium">Total Intäkter</p>
            <p className="text-3xl font-bold text-orange-900 mt-2">
              {bookings
                .filter((b) => b.status === "confirmed")
                .reduce((sum, b) => sum + b.total_amount, 0)
                .toLocaleString("sv-SE")}
            </p>
            <p className="text-xs text-orange-600 mt-2">SEK</p>
          </div>
        </div>
      </div>
    </div>
  );
}

