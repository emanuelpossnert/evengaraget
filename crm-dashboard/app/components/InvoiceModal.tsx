"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Booking, Customer, Invoice } from "@/lib/types";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, X } from "lucide-react";

interface InvoiceFormProps {
  initialCustomerId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface BookingForInvoice extends Booking {
  customer_name?: string;
}

export function InvoiceModal({ initialCustomerId, onClose, onSuccess }: InvoiceFormProps) {
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<BookingForInvoice[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || "");
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Invoice form data
  const [invoiceData, setInvoiceData] = useState({
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    due_date: "",
    notes: "",
    terms_and_conditions: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchBookings(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  // Auto-calculate totals when bookings change
  useEffect(() => {
    calculateTotals();
  }, [selectedBookingIds]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setMessage({ type: "error", text: "Kunde inte ladda kunder" });
    }
  };

  const fetchBookings = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_id", customerId)
        .eq("status", "completed")
        .order("event_date", { ascending: false });
      if (error) throw error;
      setBookings(data || []);
      setSelectedBookingIds([]); // Reset selected bookings
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setMessage({ type: "error", text: "Kunde inte ladda bokningar" });
    }
  };

  const calculateTotals = () => {
    if (selectedBookingIds.length === 0) {
      setInvoiceData((prev) => ({
        ...prev,
        subtotal: 0,
        total_amount: 0,
      }));
      return;
    }

    const selectedBookings = bookings.filter((b) => selectedBookingIds.includes(b.id));
    const subtotal = selectedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const taxAmount = Math.round(subtotal * 0.25 * 100) / 100; // 25% VAT
    const total = subtotal + taxAmount;

    setInvoiceData((prev) => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
    }));
  };

  const toggleBooking = (bookingId: string) => {
    setSelectedBookingIds((prev) =>
      prev.includes(bookingId) ? prev.filter((id) => id !== bookingId) : [...prev, bookingId]
    );
  };

  const handleSaveInvoice = async () => {
    if (!selectedCustomerId || selectedBookingIds.length === 0) {
      setMessage({ type: "error", text: "Välj kund och minst en bokning" });
      return;
    }

    try {
      setLoading(true);

      // Generate invoice number
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`;

      // Get customer data
      const customer = customers.find((c) => c.id === selectedCustomerId);
      if (!customer) throw new Error("Kund inte hittat");

      // Get booking data for items
      const selectedBookings = bookings.filter((b) => selectedBookingIds.includes(b.id));
      const items = selectedBookings.map((b) => ({
        name: `Bokning ${b.booking_number}`,
        quantity: 1,
        unit_price: b.total_amount || 0,
        total_price: b.total_amount || 0,
      }));

      // Create invoice
      const { error } = await supabase.from("invoices").insert([
        {
          booking_id: selectedBookingIds[0], // Link to first booking
          invoice_number: invoiceNumber,
          customer_id: selectedCustomerId,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_street_address: customer.street_address,
          customer_postal_code: customer.postal_code,
          customer_city: customer.city,
          customer_country: customer.country,
          customer_org_number: customer.org_number,
          subtotal: invoiceData.subtotal,
          tax_amount: invoiceData.tax_amount,
          total_amount: invoiceData.total_amount,
          items: items,
          status: "draft",
          due_date: invoiceData.due_date ? new Date(invoiceData.due_date).toISOString() : null,
          notes: invoiceData.notes,
          terms_and_conditions: invoiceData.terms_and_conditions,
        },
      ]);

      if (error) throw error;

      setMessage({ type: "success", text: "Faktura skapad!" });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error creating invoice:", error);
      setMessage({ type: "error", text: "Kunde inte skapa faktura" });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedBookingInfo = () => {
    if (selectedBookingIds.length === 0) return "";
    const booking = bookings.find((b) => b.id === selectedBookingIds[0]);
    if (!booking) return "";
    const count = selectedBookingIds.length > 1 ? ` + ${selectedBookingIds.length - 1} till` : "";
    return `${booking.booking_number}${count}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Skapa Faktura</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mx-6 mt-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            {message.text}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step Indicator */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition ${
                  s <= step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Select Customer */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Välj Kund *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Välj kund --</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.company_name || "Privat"})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomerId && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600">
                    <strong>Kund:</strong> {customers.find((c) => c.id === selectedCustomerId)?.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Email:</strong> {customers.find((c) => c.id === selectedCustomerId)?.email}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Bookings */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Välj Bokning(ar) *
                </label>
                {bookings.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <p className="text-gray-500">Inga slutförda bokningar för denna kund</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {bookings.map((booking) => (
                      <label
                        key={booking.id}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBookingIds.includes(booking.id)}
                          onChange={() => toggleBooking(booking.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{booking.booking_number}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.event_date).toLocaleDateString("sv-SE")} • {booking.location}
                          </p>
                          <p className="text-sm text-gray-700 font-medium">
                            {booking.total_amount?.toLocaleString("sv-SE")} SEK
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {selectedBookingIds.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">
                    <strong>Valda bokningar:</strong> {selectedBookingIds.length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Totalt belopp:</strong> {invoiceData.total_amount.toLocaleString("sv-SE")} SEK
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Edit Invoice Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Bokning(ar):</strong> {getSelectedBookingInfo()}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-600">Subtotal</p>
                    <p className="text-lg font-bold text-gray-900">
                      {invoiceData.subtotal.toLocaleString("sv-SE")} SEK
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Moms (25%)</p>
                    <p className="text-lg font-bold text-gray-900">
                      {invoiceData.tax_amount.toLocaleString("sv-SE")} SEK
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <p className="text-xs text-gray-600">TOTALT</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {invoiceData.total_amount.toLocaleString("sv-SE")} SEK
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Förfallodatum</label>
                <input
                  type="date"
                  value={invoiceData.due_date}
                  onChange={(e) =>
                    setInvoiceData({ ...invoiceData, due_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Anteckningar</label>
                <textarea
                  value={invoiceData.notes}
                  onChange={(e) =>
                    setInvoiceData({ ...invoiceData, notes: e.target.value })
                  }
                  rows={3}
                  placeholder="Lägg till anteckningar för fakturan..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Villkor</label>
                <textarea
                  value={invoiceData.terms_and_conditions}
                  onChange={(e) =>
                    setInvoiceData({ ...invoiceData, terms_and_conditions: e.target.value })
                  }
                  rows={2}
                  placeholder="Betalningsvillkor, leveransvillkor, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition disabled:opacity-50"
              >
                <ChevronLeft size={18} />
                Tillbaka
              </button>
            )}

            {step < 3 && (
              <button
                onClick={() => {
                  if (step === 1 && !selectedCustomerId) {
                    setMessage({ type: "error", text: "Välj en kund" });
                    return;
                  }
                  if (step === 2 && selectedBookingIds.length === 0) {
                    setMessage({ type: "error", text: "Välj minst en bokning" });
                    return;
                  }
                  setStep(step + 1);
                }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition disabled:opacity-50"
              >
                Nästa
                <ChevronRight size={18} />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleSaveInvoice}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition disabled:opacity-50"
              >
                {loading ? "Sparar..." : "Spara Faktura"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
