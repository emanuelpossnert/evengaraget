"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  Truck,
  Calendar as CalendarIcon,
  Download,
  X,
  ExternalLink,
} from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  format,
  isSameDay,
} from "date-fns";
import { sv } from "date-fns/locale";

interface BookingEvent {
  id: string;
  booking_id: string;
  booking_number: string;
  type: "pickup" | "delivery" | "event"; // pickup = upphämtning, delivery = leverans, event = själva eventet
  date: string;
  end_date: string;
  location: string;
  customer_name: string;
  products: string;
  delivery_type?: "internal" | "external"; // For delivery events
}

interface DayColumn {
  date: Date;
  events: BookingEvent[];
}

export default function CalendarGanttPage() {
  const router = useRouter();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [bookings, setBookings] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "pickup" | "delivery" | "event">("all");
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);

  const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const { data: bookingsData, error } = await supabase
        .from("bookings")
        .select("*")
        .in("status", ["pending", "confirmed", "completed"]);

      if (error) throw error;

      const events: BookingEvent[] = [];

      for (const booking of bookingsData || []) {
        // Hämta kundnamn
        const { data: customerData } = await supabase
          .from("customers")
          .select("name")
          .eq("id", booking.customer_id)
          .single();

        const customerName = customerData?.name || "Okänd";

        // Parse produkter
        let productStr = "Produkter";
        try {
          const products = JSON.parse(booking.products_requested || "[]");
          productStr = products.map((p: any) => `${p.name} (${p.quantity})`).join(", ");
        } catch (e) {
          productStr = "Produkter";
        }

        // Lägg till pickup-event
        if (booking.pickup_date) {
          events.push({
            id: `${booking.id}-pickup`,
            booking_id: booking.id,
            booking_number: booking.booking_number,
            type: "pickup",
            date: booking.pickup_date,
            end_date: booking.pickup_date,
            location: booking.location || "Okänd plats",
            customer_name: customerName,
            products: productStr,
          });
        }

        // Lägg till event
        if (booking.event_date) {
          events.push({
            id: `${booking.id}-event`,
            booking_id: booking.id,
            booking_number: booking.booking_number,
            type: "event",
            date: booking.event_date,
            end_date: booking.event_end_date || booking.event_date,
            location: booking.location || "Okänd plats",
            customer_name: customerName,
            products: productStr,
          });
        }

        // Lägg till delivery-event
        if (booking.delivery_date) {
          events.push({
            id: `${booking.id}-delivery`,
            booking_id: booking.id,
            booking_number: booking.booking_number,
            type: "delivery",
            date: booking.delivery_date,
            end_date: booking.delivery_date,
            location: booking.location || "Okänd plats",
            customer_name: customerName,
            products: productStr,
            delivery_type: booking.delivery_type,
          });
        }
      }

      setBookings(events);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gruppera events per dag
  const getDayEvents = (date: Date): BookingEvent[] => {
    return bookings.filter((event) => isSameDay(new Date(event.date), date));
  };

  // Filter events
  const getFilteredEvents = (events: BookingEvent[]): BookingEvent[] => {
    if (filterType === "all") return events;
    return events.filter((e) => e.type === filterType);
  };

  const getEventColor = (type: string, delivery_type?: string) => {
    if (type === "pickup") return "bg-blue-500 hover:bg-blue-600 border-l-4 border-blue-700";
    if (type === "event") return "bg-green-500 hover:bg-green-600 border-l-4 border-green-700";
    if (type === "delivery" && delivery_type === "external") return "bg-orange-500 hover:bg-orange-600 border-l-4 border-orange-700";
    return "bg-purple-500 hover:bg-purple-600 border-l-4 border-purple-700"; // internal delivery
  };

  const getEventIcon = (type: string) => {
    if (type === "pickup") return <Truck size={16} />;
    if (type === "event") return <CalendarIcon size={16} />;
    return <Package size={16} />;
  };

  const getEventLabel = (type: string, delivery_type?: string) => {
    if (type === "pickup") return "Upphämtning";
    if (type === "event") return "Event";
    return delivery_type === "external" ? "Extern Leverans" : "Intern Leverans";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bokningskalender</h1>
          <p className="text-gray-500 mt-1">Veckovyn över alla bokningar</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          <Download size={18} />
          Exportera PDF
        </button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
        <button
          onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">
            Vecka {format(weekStart, "ww")} ({format(weekStart, "MMM d", { locale: sv })} - {format(weekEnd, "MMM d", { locale: sv })})
          </h2>
        </div>

        <button
          onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "pickup", "event", "delivery"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === type
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {type === "all" && "Alla"}
            {type === "pickup" && "Upphämtning"}
            {type === "event" && "Event"}
            {type === "delivery" && "Leverans"}
          </button>
        ))}
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Header - Dagar */}
          <thead>
            <tr>
              <th className="bg-gray-100 border-b-2 border-gray-300 p-4 text-left font-bold text-gray-900 w-48 sticky left-0 z-10">
                Aktivitet
              </th>
              {weekDays.map((day) => (
                <th
                  key={day.toString()}
                  className="bg-gray-100 border-b-2 border-gray-300 p-4 text-center font-bold text-gray-900 min-w-40"
                >
                  <div>{format(day, "d MMM", { locale: sv })}</div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body - Events per day */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  Laddar bokningar...
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  Inga bokningar denna vecka
                </td>
              </tr>
            ) : (
              // Dynamisk rad per boknings-dag
              weekDays.map((day) => {
                const dayEvents = getFilteredEvents(getDayEvents(day));
                
                return dayEvents.length > 0 ? (
                  dayEvents.map((event, idx) => (
                    <tr key={event.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {idx === 0 && (
                        <td
                          rowSpan={dayEvents.length}
                          className="border-r border-gray-200 p-4 bg-gray-50 font-medium text-gray-900 sticky left-0 z-10 align-top"
                        >
                        </td>
                      )}
                      <td className="border-r border-gray-200 p-0"></td>
                      {weekDays.map((weekDay) => (
                        <td key={weekDay.toString()} className="border-r border-gray-200 p-2 text-center min-w-40">
                          {isSameDay(weekDay, day) && (
                            <div 
                              onClick={() => setSelectedEvent(event)}
                              className={`${getEventColor(event.type, event.delivery_type)} text-white rounded px-3 py-2 text-sm font-medium cursor-pointer hover:shadow-md transition-all group relative`}
                            >
                              <div className="flex items-center gap-1 justify-center mb-1">
                                {getEventIcon(event.type)}
                                <span>{getEventLabel(event.type, event.delivery_type)}</span>
                              </div>
                              <div className="text-xs truncate">{event.booking_number}</div>
                              <div className="text-xs truncate">{event.customer_name}</div>
                              
                              {/* Tooltip */}
                              <div className="hidden group-hover:block absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white p-3 rounded-lg text-left w-48 shadow-lg text-xs">
                                <p className="font-bold mb-1">{event.booking_number}</p>
                                <p>📍 {event.location}</p>
                                <p>👤 {event.customer_name}</p>
                                <p>📦 {event.products}</p>
                              </div>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : null;
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Operational Schedule */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Operationsöversikt</h2>
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Inga aktiviteter denna vecka</p>
          ) : (
            bookings
              .filter((b) => b.date >= format(weekStart, "yyyy-MM-dd") && b.date <= format(weekEnd, "yyyy-MM-dd"))
              .filter((b) => filterType === "all" || b.type === filterType)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((event) => (
                <div 
                  key={event.id} 
                  onClick={() => setSelectedEvent(event)}
                  className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md hover:bg-white transition-all"
                >
                  <div className={`${getEventColor(event.type, event.delivery_type)} text-white rounded p-2 flex-shrink-0`}>
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{getEventLabel(event.type, event.delivery_type)}: {event.booking_number}</p>
                    <p className="text-sm text-gray-600">{event.customer_name}</p>
                    <p className="text-sm text-gray-600">📍 {event.location}</p>
                    <p className="text-xs text-gray-500 mt-1">📦 {event.products}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-gray-900">{format(new Date(event.date), "EEEE d MMM", { locale: sv })}</p>
                    <p className="text-xs text-gray-500">{event.type}</p>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Event Details Popup */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className={`${getEventColor(selectedEvent.type, selectedEvent.delivery_type)} text-white p-6 rounded-t-lg`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getEventIcon(selectedEvent.type)}
                  <span className="font-bold text-lg">{getEventLabel(selectedEvent.type, selectedEvent.delivery_type)}</span>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm opacity-90">{selectedEvent.booking_number}</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">Kund</p>
                <p className="text-gray-900">{selectedEvent.customer_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1 flex items-center gap-1">
                  <MapPin size={16} />
                  Plats
                </p>
                <p className="text-gray-900">{selectedEvent.location}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1 flex items-center gap-1">
                  <Package size={16} />
                  Produkter
                </p>
                <p className="text-gray-900 text-sm">{selectedEvent.products}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1 flex items-center gap-1">
                  <CalendarIcon size={16} />
                  Datum
                </p>
                <p className="text-gray-900">{format(new Date(selectedEvent.date), "EEEE d MMMM yyyy", { locale: sv })}</p>
              </div>

              {selectedEvent.type === "delivery" && selectedEvent.delivery_type && (
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Leveranstyp</p>
                  <p className="text-gray-900">{selectedEvent.delivery_type === "internal" ? "Intern leverans" : "Extern leverans"}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 flex gap-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Stäng
              </button>
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  router.push(`/dashboard/bookings/${selectedEvent.booking_id}`);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} />
                Se Bokning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
