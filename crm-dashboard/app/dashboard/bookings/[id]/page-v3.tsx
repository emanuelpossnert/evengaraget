"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
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
  event_end_date?: string;
  delivery_date: string;
  pickup_date?: string;
  location: string;
  total_amount: number;
  tax_amount?: number;
  products_requested: any;
  delivery_street_address?: string;
  delivery_postal_code?: string;
  delivery_city?: string;
  contract_signed?: boolean;
  contract_signed_at?: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name?: string;
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
  const [editMode, setEditMode] = useState(false);
  const [showSignedAgreement, setShowSignedAgreement] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<BookingDetail>>({});

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
      setEditForm(bookingData);

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
      setMessage({ type: "error", text: "Kunde inte ladda bokningsdata" });
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

      const statusLabel = getStatusLabel(newStatus);
      setMessage({ type: "success", text: `Status uppdaterad till: ${statusLabel}` });
      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      console.error("Error updating status:", error);
      setMessage({ type: "error", text: "Kunde inte uppdatera status" });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setActionLoading(true);

      const updateData: any = {
        event_date: editForm.event_date,
        event_end_date: editForm.event_end_date,
        delivery_date: editForm.delivery_date,
        pickup_date: editForm.pickup_date,
        location: editForm.location,
        delivery_street_address: editForm.delivery_street_address,
        delivery_postal_code: editForm.delivery_postal_code,
        delivery_city: editForm.delivery_city,
        total_amount: editForm.total_amount,
        tax_amount: editForm.tax_amount,
      };

      const { error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId);

      if (error) throw error;

      setBooking((prev) => (prev ? { ...prev, ...editForm } : null));
      setEditMode(false);
      setMessage({ type: "success", text: "Bokning uppdaterad!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating booking:", error);
      setMessage({ type: "error", text: "Kunde inte uppdatera bokning" });
      setTimeout(() => setMessage(null), 3000);
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

  if (editMode) {
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
          <h1 className="text-2xl font-bold text-gray-900">Redigera Bokning</h1>
          <button
            onClick={() => setEditMode(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Start</label>
              <input
                type="date"
                value={editForm.event_date?.split("T")[0] || ""}
                onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Event End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Slut</label>
              <input
                type="date"
                value={editForm.event_end_date?.split("T")[0] || ""}
                onChange={(e) => setEditForm({ ...editForm, event_end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Plats</label>
              <input
                type="text"
                value={editForm.location || ""}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leveransdatum</label>
              <input
                type="date"
                value={editForm.delivery_date?.split("T")[0] || ""}
                onChange={(e) => setEditForm({ ...editForm, delivery_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Delivery Street */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leveransadress</label>
              <input
                type="text"
                value={editForm.delivery_street_address || ""}
                onChange={(e) => setEditForm({ ...editForm, delivery_street_address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Delivery Postal Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postnummer</label>
              <input
                type="text"
                value={editForm.delivery_postal_code || ""}
                onChange={(e) => setEditForm({ ...editForm, delivery_postal_code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Delivery City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stad</label>
              <input
                type="text"
                value={editForm.delivery_city || ""}
                onChange={(e) => setEditForm({ ...editForm, delivery_city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Totalt Belopp</label>
              <input
                type="number"
                step="0.01"
                value={editForm.total_amount || ""}
                onChange={(e) => setEditForm({ ...editForm, total_amount: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSaveEdit}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors font-semibold disabled:opacity-50"
            >
              <Save size={18} />
              Spara
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              <X size={18} />
              Avbryt
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          {message.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900 flex-1 text-center">
          {booking.booking_number}
          {booking.contract_signed && (
            <span className="ml-3 text-lg px-3 py-1 bg-green-100 text-green-700 rounded-full inline-block">
              ✅ Signerat
            </span>
          )}
        </h1>
        <button
          onClick={() => setEditMode(true)}
          className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
        >
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
              <a
                href={`mailto:${customer?.email}`}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
              >
                <Mail size={14} /> {customer?.email}
              </a>
              <a
                href={`tel:${customer?.phone}`}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
              >
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
              <p className="font-semibold text-gray-900">
                {format(new Date(booking.event_date), "d MMM yyyy", { locale: sv })}
              </p>
              {booking.event_end_date && booking.event_end_date !== booking.event_date && (
                <>
                  <p className="text-sm text-gray-600 mt-2 mb-1">Slut</p>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(booking.event_end_date), "d MMM yyyy", { locale: sv })}
                  </p>
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
              <p className="font-semibold text-gray-900">
                {format(new Date(booking.delivery_date), "d MMM yyyy", { locale: sv })}
              </p>
              <p className="text-sm text-gray-600 mt-2 mb-1">Adress</p>
              <p className="font-semibold text-gray-900 text-sm">
                {booking.delivery_street_address}
                <br />
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
                <div
                  key={idx}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                >
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
            <p className="text-3xl font-bold text-green-900">
              {booking.total_amount?.toLocaleString("sv-SE")} SEK
            </p>
            {booking.tax_amount && (
              <p className="text-sm text-green-700 mt-2">
                Moms: {booking.tax_amount?.toLocaleString("sv-SE")} SEK
              </p>
            )}
          </div>

          {/* Signed Agreement Button */}
          {booking.contract_signed && (
            <button
              onClick={() => setShowSignedAgreement(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-semibold border border-green-200"
            >
              <FileText size={18} />
              Se Signerat Avtal
            </button>
          )}

          {/* Status Actions */}
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

      {/* Signed Agreement Modal */}
      {showSignedAgreement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Signerat Avtal</h2>
              <button
                onClick={() => setShowSignedAgreement(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <FileText className="inline mr-2" size={18} />
                  Signerat: {booking.contract_signed_at && format(new Date(booking.contract_signed_at), "d MMM yyyy HH:mm", { locale: sv })}
                </p>
              </div>

              <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 font-semibold mb-2">Signerat Avtal</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Bokning: {booking.booking_number}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Kund: {customer?.name}
                  </p>
                  
                  {/* Agreement Details */}
                  <div className="mt-6 text-left space-y-3 bg-white rounded-lg p-4">
                    <h3 className="font-bold text-gray-900">Bokningsdetaljer:</h3>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p><strong>Bokningsnummer:</strong> {booking.booking_number}</p>
                      <p><strong>Kund:</strong> {customer?.name}</p>
                      <p><strong>Event Datum:</strong> {format(new Date(booking.event_date), "d MMM yyyy", { locale: sv })}</p>
                      <p><strong>Plats:</strong> {booking.location}</p>
                      <p><strong>Leveransdatum:</strong> {format(new Date(booking.delivery_date), "d MMM yyyy", { locale: sv })}</p>
                      <p><strong>Leveransadress:</strong> {booking.delivery_street_address}, {booking.delivery_postal_code} {booking.delivery_city}</p>
                      <p><strong>Totalt Belopp:</strong> {booking.total_amount?.toLocaleString("sv-SE")} SEK</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // TODO: Implementera PDF-download
                    alert("PDF-download kommer snart!");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors font-semibold"
                >
                  <FileText size={18} />
                  Ladda ner PDF
                </button>
                <button
                  onClick={() => setShowSignedAgreement(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
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

