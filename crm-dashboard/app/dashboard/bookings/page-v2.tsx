"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Plus, Search, Calendar, MapPin, DollarSign, CheckCircle2, XCircle, Eye
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface Booking {
  id: string;
  booking_number: string;
  customer_id: string;
  status: string;
  event_date: string;
  location: string;
  total_amount: number;
  created_at: string;
}

interface Customer {
  name: string;
  email: string;
  phone?: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<(Booking & { customer: Customer })[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<(Booking & { customer: Customer })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const statusOptions = [
    { value: "all", label: "Alla" },
    { value: "draft", label: "Utkast" },
    { value: "pending", label: "Väntande" },
    { value: "confirmed", label: "Bekräftad" },
    { value: "completed", label: "Slutförd" },
    { value: "cancelled", label: "Avbruten" },
  ];

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(
        (b) =>
          b.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Sort: draft first, then pending
    filtered.sort((a, b) => {
      const order = { draft: 0, pending: 1, confirmed: 2, completed: 3, cancelled: 4 };
      return (order[a.status as keyof typeof order] || 5) - (order[b.status as keyof typeof order] || 5);
    });

    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;

      const bookingsWithCustomers = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          const { data: customerData } = await supabase
            .from("customers")
            .select("name, email, phone")
            .eq("id", booking.customer_id)
            .single();

          return {
            ...booking,
            customer: customerData || { name: "Okänd", email: "" },
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

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      setActionLoading(bookingId);
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      // Update local state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );

      const statusLabel = getStatusLabel(newStatus);
      setMessage({ type: "success", text: `Status uppdaterad till: ${statusLabel}` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating status:", error);
      setMessage({ type: "error", text: "Kunde inte uppdatera status" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-300";
      case "completed":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option?.label || status;
  };

  const pendingReviewCount = bookings.filter((b) => b.status === "draft").length;
  const pendingConfirmCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={20} />
          ) : (
            <XCircle size={20} />
          )}
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bokningar</h1>
          <p className="text-gray-500 mt-1">
            {filteredBookings.length} bokningar
            {pendingReviewCount > 0 && (
              <span className="ml-3 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                {pendingReviewCount} väntar på granskning
              </span>
            )}
            {pendingConfirmCount > 0 && (
              <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                {pendingConfirmCount} redo för bekräftelse
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/bookings/new")}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
        >
          <Plus size={20} />
          Ny Bokning
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Sök efter bokningsnummer, kund eller plats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-red-500"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === option.value
                  ? "bg-gradient-to-r from-red-600 to-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">Laddar bokningar...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center text-gray-500">Inga bokningar hittades</div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Booking Info */}
                <div className="md:col-span-3 cursor-pointer" onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}>
                  <p className="font-bold text-gray-900 hover:text-blue-600">{booking.booking_number}</p>
                  <p className="text-sm text-gray-600 mt-1">{booking.customer.name}</p>
                </div>

                {/* Event Details */}
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Event</p>
                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    <Calendar size={14} />
                    {format(new Date(booking.event_date), "d MMM", { locale: sv })}
                  </div>
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Plats</p>
                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    <MapPin size={14} />
                    {booking.location}
                  </div>
                </div>

                {/* Amount */}
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Belopp</p>
                  <p className="font-bold text-lg text-green-600">
                    {booking.total_amount.toLocaleString("sv-SE")} SEK
                  </p>
                </div>

                {/* Status */}
                <div className="md:col-span-1">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                {/* Actions */}
                <div className="md:col-span-2 flex gap-2">
                  {booking.status === "draft" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(booking.id, "cancelled")}
                        disabled={actionLoading === booking.id}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors font-semibold text-sm disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        <span className="hidden sm:inline">Avböj</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(booking.id, "pending")}
                        disabled={actionLoading === booking.id}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors font-semibold text-sm disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        <span className="hidden sm:inline">Godkänn</span>
                      </button>
                    </>
                  )}

                  {booking.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(booking.id, "cancelled")}
                        disabled={actionLoading === booking.id}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors font-semibold text-sm disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        <span className="hidden sm:inline">Avböj</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(booking.id, "confirmed")}
                        disabled={actionLoading === booking.id}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors font-semibold text-sm disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        <span className="hidden sm:inline">Bekräfta</span>
                      </button>
                    </>
                  )}

                  {(booking.status === "confirmed" || booking.status === "completed") && (
                    <button
                      onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors font-semibold text-sm"
                    >
                      <Eye size={16} />
                      <span className="hidden sm:inline">Visa</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

