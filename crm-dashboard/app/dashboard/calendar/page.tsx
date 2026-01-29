"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  Truck,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { sv } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface BookingEvent {
  id: string;
  booking_id: string;
  booking_number: string;
  type: "pickup" | "delivery" | "event" | "internal" | "foliering" | "external_shipping" | "customer_pickup" | "booked" | "inquiry";
  date: string;
  end_date: string;
  start_time?: string;
  location: string;
  customer_name: string;
  products: string;
  delivery_type?: "internal" | "external";
}

interface TodoEvent {
  id: string;
  type: "todo";
  title: string;
  start_date: string;
  start_time?: string;
  end_date: string;
  end_time?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
}

type Event = BookingEvent | TodoEvent;

interface DayColumn {
  date: Date;
  events: Event[];
  timedEvents: Event[];
  untimedEvents: Event[];
}

const eventColors: Record<string, { bg: string; border: string; text: string }> = {
  pickup: { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-900" },
  delivery: { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-900" },
  event: { bg: "bg-green-100", border: "border-green-400", text: "text-green-900" },
  internal: { bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-900" },
  foliering: { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-900" },
  external_shipping: { bg: "bg-red-100", border: "border-red-400", text: "text-red-900" },
  customer_pickup: { bg: "bg-indigo-100", border: "border-indigo-400", text: "text-indigo-900" },
  todo_low: { bg: "bg-gray-100", border: "border-gray-400", text: "text-gray-900" },
  todo_medium: { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-900" },
  todo_high: { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-900" },
  todo_urgent: { bg: "bg-red-100", border: "border-red-400", text: "text-red-900" },
};

const getEventColor = (event: Event) => {
  if (event.type === "todo") {
    const todoEvent = event as TodoEvent;
    return eventColors[`todo_${todoEvent.priority}`] || eventColors.todo_medium;
  }
  return eventColors[event.type] || eventColors.internal;
};

const getEventIcon = (type: string) => {
  switch (type) {
    case "pickup":
      return "🚚";
    case "delivery":
      return "📦";
    case "event":
      return "🎉";
    case "internal":
      return "📋";
    case "foliering":
      return "🖨️";
    case "external_shipping":
      return "🚛";
    case "customer_pickup":
      return "👤";
    case "todo":
      return "✓";
    default:
      return "📌";
  }
};

export default function CalendarPage() {
  const router = useRouter();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      const allEvents: Event[] = [];

      // Fetch bookings - Include all statuses
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .in("status", ["draft", "pending", "confirmed", "completed"]);

      if (bookingsError) throw bookingsError;

      for (const booking of bookingsData || []) {
        let customerName = "Okänd";
        
        if (booking.customer_id) {
          const { data: customerData } = await supabase
            .from("customers")
            .select("name")
            .eq("id", booking.customer_id)
            .single();

          if (customerData?.name) {
            customerName = customerData.name;
          }
        }

        let productStr = "Produkter";
        try {
          const products = JSON.parse(booking.products_requested || "[]");
          productStr = products.map((p: any) => `${p.name} (${p.quantity})`).join(", ");
        } catch (e) {
          productStr = "Produkter";
        }

        // Pickup event
        if (booking.pickup_date) {
          allEvents.push({
            id: `${booking.id}-pickup`,
            booking_id: booking.id,
            booking_number: booking.booking_number,
            type: "pickup",
            date: booking.pickup_date,
            end_date: booking.pickup_date,
            start_time: booking.pickup_time || undefined,
            location: booking.location || "Okänd plats",
            customer_name: customerName,
            products: productStr,
          });
        }

        // Event
        if (booking.event_date) {
          allEvents.push({
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

        // Delivery event
        if (booking.delivery_date) {
          allEvents.push({
            id: `${booking.id}-delivery`,
            booking_id: booking.id,
            booking_number: booking.booking_number,
            type: "delivery",
            date: booking.delivery_date,
            end_date: booking.delivery_date,
            start_time: booking.delivery_time || undefined,
            location: booking.location || "Okänd plats",
            customer_name: customerName,
            products: productStr,
            delivery_type: booking.delivery_type,
          });
        }
      }

      // Fetch To-Dos
      const { data: todosData, error: todosError } = await supabase
        .from("booking_tasks")
        .select("*")
        .gte("end_date", format(weekStart, "yyyy-MM-dd"))
        .lte("start_date", format(weekEnd, "yyyy-MM-dd"));

      if (todosError) throw todosError;

      for (const todo of todosData || []) {
        if (todo.start_date) {
          allEvents.push({
            id: todo.id,
            type: "todo",
            title: todo.title,
            start_date: todo.start_date,
            start_time: todo.start_time || undefined,
            end_date: todo.end_date || todo.start_date,
            end_time: todo.end_time || undefined,
            priority: todo.priority || "medium",
            status: todo.status || "pending",
          } as TodoEvent);
        }
      }

      setEvents(allEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Separera timed och untimed events för en dag, med filter
  const getDayEvents = (date: Date) => {
    const dayEvents = events.filter((event) => {
      if (!event.date || !event.end_date) return false;
      try {
        const eventStart = parseISO(event.date);
        const eventEnd = parseISO(event.end_date);
        
        // Apply type filter
        if (filterType !== "all" && event.type !== filterType) {
          return false;
        }
        
        return isWithinInterval(date, { start: eventStart, end: eventEnd });
      } catch (e) {
        return false;
      }
    });

    const timedEvents = dayEvents.filter((e) => {
      if (e.type === "todo") {
        return (e as TodoEvent).start_time;
      }
      return (e as BookingEvent).start_time;
    });

    const untimedEvents = dayEvents.filter((e) => {
      if (e.type === "todo") {
        return !(e as TodoEvent).start_time;
      }
      return !(e as BookingEvent).start_time;
    });

    return { all: dayEvents, timedEvents, untimedEvents };
  };

  const handleEventClick = (event: Event) => {
    if (event.type === "todo") {
      return; // To-Do modal kan läggas till senare
    }
    setSelectedEvent(event as BookingEvent);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Bokningskalender</h1>
            <p className="text-gray-600">Vecka över alla bokningar och uppgifter</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <span>📥 Exportera PDF</span>
          </button>
        </div>

        {/* Vecka navigering */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <button
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            className="p-2 hover:bg-gray-200 rounded-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-semibold">
            Vecka {format(currentWeekStart, "w")} ({format(weekStart, "MMM dd", { locale: sv })} - {format(weekEnd, "MMM dd", { locale: sv })})
          </h2>
          <button
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            className="p-2 hover:bg-gray-200 rounded-lg"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "pickup", "delivery", "event", "internal", "foliering", "external_shipping", "customer_pickup", "todo"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === type
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {type === "all" && "Alla"}
              {type === "pickup" && "🚚 Upphämtning"}
              {type === "delivery" && "📦 Leverans"}
              {type === "event" && "🎉 Event"}
              {type === "internal" && "📋 Internal"}
              {type === "foliering" && "🖨️ Foliering"}
              {type === "external_shipping" && "🚛 Extern Frakt"}
              {type === "customer_pickup" && "👤 Kundhämtning"}
              {type === "todo" && "✓ Uppgifter"}
            </button>
          ))}
        </div>

        {/* Calendar Grid - Time-based */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header with days */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="w-24 font-bold text-center text-gray-700 pb-2">Tid</div>
              {weekDays.map((day) => (
                <div key={day.toString()} className="text-center">
                  <div className="font-bold text-gray-700">{format(day, "EEEE", { locale: sv }).toUpperCase()}</div>
                  <div className="text-sm text-gray-600">{format(day, "d MMM", { locale: sv })}</div>
                </div>
              ))}
            </div>

            {/* Time slots and events */}
            <div className="border rounded-lg bg-white overflow-hidden">
              {hours.map((hour) => {
                const timeStr = `${String(hour).padStart(2, "0")}:00`;
                return (
                  <div key={hour} className="grid grid-cols-8 gap-1 border-b">
                    {/* Time label */}
                    <div className="w-24 bg-gray-50 p-2 text-sm font-medium text-gray-700 text-center border-r sticky left-0">
                      {timeStr}
                    </div>

                    {/* Day columns */}
                    {weekDays.map((day) => {
                      const dayKey = format(day, "yyyy-MM-dd");
                      const { timedEvents } = getDayEvents(day);
                      
                      const eventsAtThisHour = timedEvents.filter((event) => {
                        const startTime = event.type === "todo"
                          ? (event as TodoEvent).start_time
                          : (event as BookingEvent).start_time;
                        
                        if (!startTime) return false;
                        const [eventHour] = startTime.split(":").map(Number);
                        return eventHour === hour;
                      });

                      return (
                        <div
                          key={`${dayKey}-${hour}`}
                          className="min-h-20 p-1 border-r bg-white hover:bg-gray-50 transition relative"
                        >
                          {eventsAtThisHour.map((event, idx) => (
                            <div
                              key={`${event.id}-${idx}`}
                              onClick={() => handleEventClick(event)}
                              className={`${getEventColor(event).bg} border-l-4 ${getEventColor(event).border} p-2 rounded text-xs mb-1 cursor-pointer hover:shadow-md transition truncate`}
                              title={event.type === "todo" ? (event as TodoEvent).title : (event as BookingEvent).booking_number}
                            >
                              <div className="font-bold">
                                {getEventIcon(event.type)} {event.type === "todo" ? (event as TodoEvent).title : (event as BookingEvent).booking_number}
                              </div>
                              {event.type === "todo" ? (
                                <div className="text-xs text-gray-600">
                                  {(event as TodoEvent).start_time} - {(event as TodoEvent).end_time || ""}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-600">
                                  {(event as BookingEvent).customer_name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Untimed events section */}
            <div className="mt-8">
              <h3 className="font-bold text-gray-700 mb-4">Uppgifter utan tidsspann</h3>
              <div className="grid grid-cols-8 gap-1">
                <div className="w-24"></div>
                {weekDays.map((day) => {
                  const { untimedEvents } = getDayEvents(day);
                  return (
                    <div key={format(day, "yyyy-MM-dd")} className="space-y-2">
                      {untimedEvents.map((event, idx) => (
                        <div
                          key={`untimed-${event.id}-${idx}`}
                          className={`${getEventColor(event).bg} border-l-4 ${getEventColor(event).border} p-2 rounded text-xs cursor-pointer hover:shadow-md transition`}
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="font-bold truncate">
                            {getEventIcon(event.type)} {event.type === "todo" ? (event as TodoEvent).title : (event as BookingEvent).booking_number}
                          </div>
                          {event.type === "todo" && (
                            <div className="text-gray-600 truncate">{(event as TodoEvent).title}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Event Detail Popup */}
        {selectedEvent && selectedEvent.type !== "todo" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{(selectedEvent as BookingEvent).booking_number}</h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-700">Typ</p>
                  <p>{selectedEvent.type}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Kund</p>
                  <p>{(selectedEvent as BookingEvent).customer_name}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Datum</p>
                  <p>{format(parseISO(selectedEvent.date), "PPP", { locale: sv })}</p>
                </div>
                {(selectedEvent as BookingEvent).start_time && (
                  <div>
                    <p className="font-semibold text-gray-700">Tid</p>
                    <p>{(selectedEvent as BookingEvent).start_time}</p>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-700">Plats</p>
                  <p className="flex items-center gap-1">
                    <MapPin size={16} /> {(selectedEvent as BookingEvent).location}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Produkter</p>
                  <p>{(selectedEvent as BookingEvent).products}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  router.push(`/dashboard/bookings/${(selectedEvent as BookingEvent).booking_id}`);
                  setSelectedEvent(null);
                }}
                className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Se Bokning
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
