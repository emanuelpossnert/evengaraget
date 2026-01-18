"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Plus, Search, Calendar, MapPin, DollarSign } from "lucide-react";

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
  full_name: string;
  email: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<(Booking & { customer: Customer })[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<(Booking & { customer: Customer })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    // Filter bookings
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(
        (b) =>
          b.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      // Fetch bookings with customer info
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch customer info for each booking
      const bookingsWithCustomers = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          const { data: customerData } = await supabase
            .from("customers")
            .select("full_name, email")
            .eq("id", booking.customer_id)
            .single();

          return {
            ...booking,
            customer: customerData || { full_name: "Okänd", email: "" },
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option?.label || status;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bokningar</h1>
          <p className="text-gray-500 mt-1">Hantera alla bokningar i ett ställe</p>
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

        <p className="text-sm text-gray-500">{filteredBookings.length} bokningar hittades</p>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Laddar bokningar...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="mb-4">Inga bokningar hittades</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Bokningsnummer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Kund</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Plats</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Datum</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Belopp</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                  className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{booking.booking_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{booking.customer.full_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} />
                      {booking.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      {new Date(booking.event_date).toLocaleDateString("sv-SE")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <DollarSign size={16} />
                      {booking.total_amount.toLocaleString("sv-SE")} SEK
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

