"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Calendar,
  MapPin,
  DollarSign,
  Package,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface BookingDetail {
  id: string;
  booking_number: string;
  customer_id: string;
  status: string;
  event_date: string;
  event_end_date: string;
  delivery_date: string;
  location: string;
  total_amount: number;
  tax_amount: number;
  products_requested: any;
  delivery_street_address?: string;
  delivery_postal_code?: string;
  delivery_city?: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  address?: string;
  postal_code?: string;
  city?: string;
}

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookingData();
  }, [bookingId]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);

      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;
      setBooking(bookingData);

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
      setActionLoading(true);
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;
      setBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Kunde inte uppdatera status");
    } finally {
      setActionLoading(false);
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
    return <div className="text-center py-12 text-gray-500">Laddar...</div>;
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-semibold">Bokning inte hittad</p>
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="mt-4 text-red-600 hover:text-red-700 font-semibold"
        >
          Tillbaka
        </button>
      </div>
    );
  }

  let products = [];
  try {
    if (booking.products_requested) {
      let pr = booking.products_requested;
      if (typeof pr === "string") {
        if (pr.startsWith('"')) {
          pr = JSON.parse(pr);
        }
        pr = JSON.parse(pr);
      }
      products = Array.isArray(pr) ? pr : [];
    }
  } catch (e) {
    console.error("Error parsing products:", e);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900 flex-1 text-center">{booking.booking_number}</h1>
        <button className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors font-semibold">
          <Edit2 size={18} />
          Redigera
        </button>
      </div>

      {/* Main Content - Single Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Key Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status Card */}
          <div className={`rounded-lg p-4 border-2 ${getStatusColor(booking.status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">Status</p>
                <p className="text-2xl font-bold">{getStatusLabel(booking.status)}</p>
              </div>
              {booking.status === "draft" && <AlertCircle size={32} />}
              {booking.status === "pending" && <AlertCircle size={32} />}
              {booking.status === "confirmed" && <CheckCircle2 size={32} />}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Building2 size={18} /> Kund
            </h2>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-gray-900">{customer?.name}</p>
              <p className="text-gray-600">{customer?.company_name}</p>
              <a href={`mailto:${customer?.email}`} className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                <Mail size={14} /> {customer?.email}
              </a>
              <a href={`tel:${customer?.phone}`} className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                <Phone size={14} /> {customer?.phone}
              </a>
            </div>
          </div>

          {/* Event & Delivery */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar size={18} /> Event
              </h3>
              <p className="text-sm text-gray-600 mb-1">Start</p>
              <p className="font-semibold text-gray-900">{format(new Date(booking.event_date), "d MMM yyyy", { locale: sv })}</p>
              {booking.event_end_date && booking.event_end_date !== booking.event_date && (
                <>
                  <p className="text-sm text-gray-600 mt-2 mb-1">Slut</p>
                  <p className="font-semibold text-gray-900">{format(new Date(booking.event_end_date), "d MMM yyyy", { locale: sv })}</p>
                </>
              )}
              <p className="text-sm text-gray-600 mt-2 mb-1">Plats</p>
              <p className="font-semibold text-gray-900">{booking.location}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={18} /> Leverans
              </h3>
              <p className="text-sm text-gray-600 mb-1">Datum</p>
              <p className="font-semibold text-gray-900">{format(new Date(booking.delivery_date), "d MMM yyyy", { locale: sv })}</p>
              <p className="text-sm text-gray-600 mt-2 mb-1">Adress</p>
              <p className="font-semibold text-gray-900 text-sm">
                {booking.delivery_street_address}<br/>
                {booking.delivery_postal_code} {booking.delivery_city}
              </p>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Package size={18} /> Produkter ({products.length})
            </h3>
            <div className="space-y-2">
              {products.map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-700">{p.name}</span>
                  <span className="text-sm font-semibold text-gray-900">{p.quantity || 1} st</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Price */}
        <div className="space-y-4">
          {/* Price Summary */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-700 font-medium mb-2">Totalt Belopp</p>
            <p className="text-3xl font-bold text-green-900">{booking.total_amount?.toLocaleString("sv-SE")} SEK</p>
            {booking.tax_amount && (
              <p className="text-sm text-green-700 mt-2">Moms: {booking.tax_amount?.toLocaleString("sv-SE")} SEK</p>
            )}
          </div>

          {/* Signerat Avtal */}
          {booking.status === "confirmed" && (
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold border border-blue-200">
              <FileText size={18} />
              Se Signerat Avtal
            </button>
          )}

          {/* Action Buttons */}
          {booking.status === "draft" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Granska och godkänn:</p>
              <button
                onClick={() => handleStatusChange("cancelled")}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-semibold disabled:opacity-50"
              >
                <XCircle size={18} />
                Avböj
              </button>
              <button
                onClick={() => handleStatusChange("pending")}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors font-semibold disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                Godkänn
              </button>
            </div>
          )}

          {booking.status === "pending" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Bekräfta:</p>
              <button
                onClick={() => handleStatusChange("cancelled")}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-semibold disabled:opacity-50"
              >
                <XCircle size={18} />
                Avböj
              </button>
              <button
                onClick={() => handleStatusChange("confirmed")}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors font-semibold disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                Bekräfta
              </button>
            </div>
          )}

          {booking.status === "confirmed" && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-700">
                <CheckCircle2 className="inline mr-2" size={18} />
                Bokning bekräftad
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

