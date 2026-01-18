"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit2, Calendar, MapPin, DollarSign, Package, Truck, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface BookingDetail {
  id: string;
  booking_number: string;
  customer_id: string;
  status: string;
  event_date: string;
  delivery_date: string;
  pickup_date: string;
  location: string;
  total_amount: number;
  tax_amount: number;
  products_requested: string;
  delivery_street_address?: string;
  delivery_postal_code?: string;
  delivery_city?: string;
  created_at: string;
}

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  billing_street?: string;
  billing_postal_code?: string;
  billing_city?: string;
}

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "timeline" | "products" | "invoice">("details");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookingData();
  }, [bookingId]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);

      // Fetch booking
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;
      setBooking(bookingData);

      // Fetch customer
      if (bookingData?.customer_id) {
        const { data: customerData } = await supabase
          .from("customers")
          .select("*")
          .eq("id", bookingData.customer_id)
          .single();

        if (customerData) setCustomer(customerData);
      }
    } catch (error) {
      console.error("Error fetching booking data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      setBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (error) {
      console.error("Error updating status:", error);
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
    const labels: Record<string, string> = {
      draft: "Utkast",
      pending: "Väntande",
      confirmed: "Bekräftad",
      completed: "Slutförd",
      cancelled: "Avbruten",
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="text-center py-12">Laddar bokningsdetaljer...</div>;
  }

  if (!booking) {
    return <div className="text-center py-12 text-red-600">Bokning inte hittad</div>;
  }

  const products = booking.products_requested ? JSON.parse(booking.products_requested) : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/bookings")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{booking.booking_number}</h1>
            <p className="text-gray-500 mt-1">{customer?.full_name}</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-lg hover:bg-red-100 transition-colors font-semibold">
          <Edit2 size={18} />
          Redigera
        </button>
      </div>

      {/* Status & Actions */}
      <div className="space-y-4">
        {/* Current Status */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Nuvarande Status</h2>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-lg font-bold text-lg ${getStatusColor(booking.status)}`}>
              {getStatusLabel(booking.status)}
            </span>
            <p className="text-sm text-gray-600">
              {booking.status === "draft" && "Ny bokning som väntar på granskning"}
              {booking.status === "pending" && "Godkänd och redo för bekräftelse"}
              {booking.status === "confirmed" && "Bekräftad bokning"}
              {booking.status === "completed" && "Genomförd"}
              {booking.status === "cancelled" && "Avbruten"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {booking.status === "draft" && (
          <div className="bg-orange-50 rounded-lg p-6 border-2 border-orange-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-600" />
              Granska Bokning
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Verifiera alla bokningsdetaljer innan du godkänner.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStatusChange("cancelled")}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-semibold disabled:opacity-50"
              >
                <XCircle size={18} />
                Avböj
              </button>
              <button
                onClick={() => handleStatusChange("pending")}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors font-semibold disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                Godkänn
              </button>
            </div>
          </div>
        )}

        {booking.status === "pending" && (
          <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-blue-600" />
              Bekräfta Bokning
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Bokningen är godkänd. Bekräfta för att skicka bekräftelse till kunden.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStatusChange("cancelled")}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-semibold disabled:opacity-50"
              >
                <XCircle size={18} />
                Avböj
              </button>
              <button
                onClick={() => handleStatusChange("confirmed")}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors font-semibold disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                Bekräfta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex gap-0 border-b border-gray-200">
          {[
            { id: "details", label: "Detaljer", icon: "📋" },
            { id: "timeline", label: "Tidsplan", icon: "📅" },
            { id: "products", label: "Produkter", icon: "📦" },
            { id: "invoice", label: "Faktura", icon: "💰" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Booking Info */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900">Bokningsdetaljer</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-gray-400" size={20} />
                    <div>
                      <p className="text-xs text-gray-500">Event-datum</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(booking.event_date).toLocaleDateString("sv-SE")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="text-gray-400" size={20} />
                    <div>
                      <p className="text-xs text-gray-500">Plats</p>
                      <p className="text-sm font-medium text-gray-900">{booking.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="text-gray-400" size={20} />
                    <div>
                      <p className="text-xs text-gray-500">Totalt belopp</p>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.total_amount.toLocaleString("sv-SE")} SEK
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              {customer && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">Kunduppgifter</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-500">Namn</p>
                      <p className="font-medium text-gray-900">{customer.full_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{customer.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Telefon</p>
                      <p className="font-medium text-gray-900">{customer.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Företag</p>
                      <p className="font-medium text-gray-900">{customer.company_name || "-"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={18} className="text-blue-600" />
                  <p className="font-medium text-gray-900">Event-datum</p>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(booking.event_date).toLocaleDateString("sv-SE", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <Truck size={18} className="text-green-600" />
                  <p className="font-medium text-gray-900">Leveransdatum</p>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(booking.delivery_date).toLocaleDateString("sv-SE", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {booking.delivery_street_address && (
                  <p className="text-sm text-gray-600 mt-2">
                    📍 {booking.delivery_street_address}, {booking.delivery_postal_code} {booking.delivery_city}
                  </p>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-orange-500">
                <div className="flex items-center gap-2 mb-2">
                  <Truck size={18} className="text-orange-600" />
                  <p className="font-medium text-gray-900">Returdatum</p>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(booking.pickup_date).toLocaleDateString("sv-SE", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={20} />
                Hyra Varor
              </h3>
              {products.length === 0 ? (
                <p className="text-gray-500">Inga produkter</p>
              ) : (
                products.map((product: any, idx: number) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500 mt-1">Mängd: {product.quantity}</p>
                        {product.wrapping_requested && (
                          <p className="text-sm text-orange-600 mt-2">✓ Foliering inkluderad</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Invoice Tab */}
          {activeTab === "invoice" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
                <h3 className="font-bold text-gray-900 mb-4">Fakturainformation</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Produkter:</p>
                    <p className="font-medium text-gray-900">
                      {(booking.total_amount - (booking.tax_amount || 0)).toLocaleString("sv-SE")} SEK
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Moms (25%):</p>
                    <p className="font-medium text-gray-900">
                      {(booking.tax_amount || 0).toLocaleString("sv-SE")} SEK
                    </p>
                  </div>
                  <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
                    <p className="font-bold text-gray-900">TOTALT:</p>
                    <p className="font-bold text-lg text-red-600">
                      {booking.total_amount.toLocaleString("sv-SE")} SEK
                    </p>
                  </div>
                  <div className="bg-white rounded p-3 mt-4">
                    <p className="text-sm text-gray-600 mb-2">Handpenning (50%):</p>
                    <p className="text-lg font-bold text-gray-900">
                      {(booking.total_amount * 0.5).toLocaleString("sv-SE")} SEK
                    </p>
                  </div>
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600 mb-2">Restbelopp:</p>
                    <p className="text-lg font-bold text-gray-900">
                      {(booking.total_amount * 0.5).toLocaleString("sv-SE")} SEK
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 rounded-lg hover:shadow-lg transition-all font-semibold">
                  Generera Faktura
                </button>
                <button className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-lg hover:bg-blue-100 transition-colors font-semibold">
                  Skicka E-post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
