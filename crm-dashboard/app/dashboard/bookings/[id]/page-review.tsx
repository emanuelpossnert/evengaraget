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
  Truck,
  Eye,
  ChevronDown,
  ChevronUp,
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
  shipping_cost?: number;
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

interface ReviewCheckItem {
  id: string;
  label: string;
  completed: boolean;
}

export default function BookingReviewPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Review state
  const [reviewMode, setReviewMode] = useState(true);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [showSignedAgreement, setShowSignedAgreement] = useState(false);

  // Review checklist
  const [reviewChecklist, setReviewChecklist] = useState<ReviewCheckItem[]>([
    { id: "customer", label: "Kunduppgifter verifierade", completed: false },
    { id: "event", label: "Event-detaljer kontrollerade", completed: false },
    { id: "delivery", label: "Leverans-adress OK", completed: false },
    { id: "products", label: "Produkter är korrekta", completed: false },
    { id: "pricing", label: "Prissättning verifierad", completed: false },
    { id: "agreement", label: "Avtal granskat", completed: false },
  ]);

  // Edit forms
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

  const toggleChecklistItem = (id: string) => {
    setReviewChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const allItemsCompleted = reviewChecklist.every((item) => item.completed);

  const handleSaveEdit = async (section: string) => {
    try {
      setActionLoading(true);

      const updateData: any = {};

      if (section === "delivery") {
        updateData.delivery_date = editForm.delivery_date;
        updateData.delivery_street_address = editForm.delivery_street_address;
        updateData.delivery_postal_code = editForm.delivery_postal_code;
        updateData.delivery_city = editForm.delivery_city;
      } else if (section === "products") {
        updateData.products_requested = editForm.products_requested;
      } else if (section === "pricing") {
        updateData.total_amount = editForm.total_amount;
        updateData.tax_amount = editForm.tax_amount;
        updateData.shipping_cost = editForm.shipping_cost;
      }

      const { error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId);

      if (error) throw error;

      setBooking((prev) => (prev ? { ...prev, ...editForm } : null));
      setEditSection(null);
      setMessage({ type: "success", text: `${section} uppdaterad!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating booking:", error);
      setMessage({ type: "error", text: "Kunde inte uppdatera" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!allItemsCompleted) {
      setMessage({ type: "error", text: "Checka av alla kontroller innan du godkänner!" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setActionLoading(true);
      const { error } = await supabase
        .from("bookings")
        .update({ status: "pending" })
        .eq("id", bookingId);

      if (error) throw error;
      setBooking((prev) => (prev ? { ...prev, status: "pending" } : null));
      setMessage({ type: "success", text: "Bokning godkänd! Status: Väntande" });
      setTimeout(() => {
        router.push("/dashboard/bookings");
      }, 2000);
    } catch (error) {
      console.error("Error approving booking:", error);
      setMessage({ type: "error", text: "Kunde inte godkänna bokning" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Laddar...</div>;
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-semibold">Bokning inte hittad</p>
      </div>
    );
  }

  let products = [];
  try {
    if (booking.products_requested) {
      let pr = booking.products_requested;
      if (typeof pr === "string") {
        if (pr.startsWith('"')) pr = JSON.parse(pr);
        pr = JSON.parse(pr);
      }
      products = Array.isArray(pr) ? pr : [];
    }
  } catch (e) {
    console.error("Error parsing products:", e);
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
        <h1 className="text-3xl font-bold text-gray-900 text-center flex-1">{booking.booking_number}</h1>
        <div className="w-24"></div>
      </div>

      {/* Main Layout: Review Checklist + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Review Checklist */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-orange-600" />
            Granskning
          </h2>
          <div className="space-y-3">
            {reviewChecklist.map((item) => (
              <label key={item.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleChecklistItem(item.id)}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className={`text-sm ${item.completed ? "text-gray-600 line-through" : "text-gray-700 font-medium"}`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>

          {/* Approval Button */}
          <button
            onClick={handleApprove}
            disabled={!allItemsCompleted || actionLoading}
            className={`w-full mt-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              allItemsCompleted
                ? "bg-green-100 text-green-600 hover:bg-green-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <CheckCircle2 size={18} />
            Godkänn Bokning
          </button>

          {!allItemsCompleted && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Checka av alla innan godkännande
            </p>
          )}
        </div>

        {/* Right: Details (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Building2 size={18} /> Kund
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-gray-900">{customer?.name}</p>
              <p className="text-gray-600">{customer?.company_name}</p>
              <p className="text-blue-600">{customer?.email}</p>
              <p className="text-blue-600">{customer?.phone}</p>
            </div>
          </div>

          {/* Event Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar size={18} /> Event
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-600">Start:</span> {format(new Date(booking.event_date), "d MMM yyyy", { locale: sv })}
              </p>
              {booking.event_end_date && (
                <p>
                  <span className="text-gray-600">Slut:</span> {format(new Date(booking.event_end_date), "d MMM yyyy", { locale: sv })}
                </p>
              )}
              <p>
                <span className="text-gray-600">Plats:</span> {booking.location}
              </p>
            </div>
          </div>

          {/* Delivery Section - Editable */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Truck size={18} /> Leverans
              </h3>
              {editSection !== "delivery" && (
                <button
                  onClick={() => {
                    setEditSection("delivery");
                    setEditForm(booking);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
                >
                  <Edit2 size={14} /> Redigera
                </button>
              )}
            </div>

            {editSection === "delivery" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Leveransdatum</label>
                  <input
                    type="date"
                    value={editForm.delivery_date?.split("T")[0] || ""}
                    onChange={(e) => setEditForm({ ...editForm, delivery_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Adress</label>
                  <input
                    type="text"
                    value={editForm.delivery_street_address || ""}
                    onChange={(e) => setEditForm({ ...editForm, delivery_street_address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Postnummer</label>
                    <input
                      type="text"
                      value={editForm.delivery_postal_code || ""}
                      onChange={(e) => setEditForm({ ...editForm, delivery_postal_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Stad</label>
                    <input
                      type="text"
                      value={editForm.delivery_city || ""}
                      onChange={(e) => setEditForm({ ...editForm, delivery_city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSaveEdit("delivery")}
                    disabled={actionLoading}
                    className="flex-1 px-3 py-2 bg-green-100 text-green-600 rounded text-sm font-semibold hover:bg-green-200"
                  >
                    Spara
                  </button>
                  <button
                    onClick={() => setEditSection(null)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded text-sm font-semibold"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Datum:</span> {format(new Date(booking.delivery_date), "d MMM yyyy", { locale: sv })}
                </p>
                <p>
                  <span className="text-gray-600">Adress:</span> {booking.delivery_street_address}
                </p>
                <p>
                  <span className="text-gray-600">Postadress:</span> {booking.delivery_postal_code} {booking.delivery_city}
                </p>
              </div>
            )}
          </div>

          {/* Products Section - Editable */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Package size={18} /> Produkter ({products.length})
              </h3>
              {editSection !== "products" && (
                <button
                  onClick={() => {
                    setEditSection("products");
                    setEditForm(booking);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
                >
                  <Edit2 size={14} /> Redigera
                </button>
              )}
            </div>

            {editSection === "products" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Produkt JSON (advanced)</label>
                  <textarea
                    value={JSON.stringify(editForm.products_requested || [], null, 2)}
                    onChange={(e) => {
                      try {
                        setEditForm({ ...editForm, products_requested: JSON.parse(e.target.value) });
                      } catch (err) {
                        // Invalid JSON, skip
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-mono h-32"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit("products")}
                    disabled={actionLoading}
                    className="flex-1 px-3 py-2 bg-green-100 text-green-600 rounded text-sm font-semibold"
                  >
                    Spara
                  </button>
                  <button
                    onClick={() => setEditSection(null)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded text-sm font-semibold"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {products.map((p: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700">{p.name}</span>
                    <span className="font-semibold text-gray-900">{p.quantity} st</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Section - Editable */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <DollarSign size={18} /> Prissättning
              </h3>
              {editSection !== "pricing" && (
                <button
                  onClick={() => {
                    setEditSection("pricing");
                    setEditForm(booking);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
                >
                  <Edit2 size={14} /> Redigera
                </button>
              )}
            </div>

            {editSection === "pricing" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Summa (ex moms)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.total_amount || ""}
                    onChange={(e) => setEditForm({ ...editForm, total_amount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Moms</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.tax_amount || ""}
                      onChange={(e) => setEditForm({ ...editForm, tax_amount: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Frakt</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.shipping_cost || ""}
                      onChange={(e) => setEditForm({ ...editForm, shipping_cost: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSaveEdit("pricing")}
                    disabled={actionLoading}
                    className="flex-1 px-3 py-2 bg-green-100 text-green-600 rounded text-sm font-semibold"
                  >
                    Spara
                  </button>
                  <button
                    onClick={() => setEditSection(null)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded text-sm font-semibold"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Summa:</span>
                  <span className="font-semibold">{booking.total_amount?.toLocaleString("sv-SE")} SEK</span>
                </div>
                {booking.tax_amount !== undefined && booking.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Moms:</span>
                    <span className="font-semibold">{booking.tax_amount?.toLocaleString("sv-SE")} SEK</span>
                  </div>
                )}
                {booking.shipping_cost !== undefined && booking.shipping_cost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frakt:</span>
                    <span className="font-semibold">{booking.shipping_cost?.toLocaleString("sv-SE")} SEK</span>
                  </div>
                )}
                <div className="pt-2 border-t border-green-200 flex justify-between">
                  <span className="text-gray-700 font-bold">Totalt:</span>
                  <span className="text-xl font-bold text-green-700">
                    {(
                      (booking.total_amount || 0) +
                      (booking.tax_amount || 0) +
                      (booking.shipping_cost || 0)
                    ).toLocaleString("sv-SE")} SEK
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Signed Agreement Section */}
          {booking.contract_signed && (
            <button
              onClick={() => setShowSignedAgreement(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors font-semibold"
            >
              <FileText size={18} />
              Se Signerat Avtal
            </button>
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
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700 font-semibold">
                  ✅ Signerat {booking.contract_signed_at && format(new Date(booking.contract_signed_at), "d MMM yyyy HH:mm", { locale: sv })}
                </p>
              </div>

              <div className="border border-gray-300 rounded-lg p-6 bg-gray-50 text-center">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 font-semibold mb-2">Signerat Avtal</p>
                <p className="text-sm text-gray-500">Bokning: {booking.booking_number}</p>
              </div>

              <button
                onClick={() => setShowSignedAgreement(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200"
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

