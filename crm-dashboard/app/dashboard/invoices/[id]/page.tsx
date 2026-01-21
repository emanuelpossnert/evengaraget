"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Invoice, SystemSetting } from "@/lib/types";
import { ArrowLeft, Download, Edit2, Check, X } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { exportInvoiceToPDF, generateSEBReferenceNumber } from "@/lib/pdf-utils";

interface InvoiceDetail extends Invoice {
  booking_number?: string;
  event_date?: string;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [settings, setSettings] = useState<SystemSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    status: "draft" as "draft" | "sent" | "paid" | "overdue" | "cancelled",
    due_date: "",
    payment_terms: "",
    notes: "",
  });

  useEffect(() => {
    fetchInvoiceAndSettings();
  }, []);

  const fetchInvoiceAndSettings = async () => {
    try {
      setLoading(true);

      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (invoiceError) {
        throw new Error("Faktura kunde inte hittas");
      }

      // Fetch booking info
      if (invoiceData) {
        const { data: booking } = await supabase
          .from("bookings")
          .select("booking_number, event_date")
          .eq("id", invoiceData.booking_id)
          .single();

        const fullInvoice = { ...invoiceData, ...booking };
        setInvoice(fullInvoice);
        setFormData({
          status: fullInvoice.status,
          due_date: fullInvoice.due_date || "",
          payment_terms: fullInvoice.payment_terms || "",
          notes: fullInvoice.notes || "",
        });
      }

      // Fetch settings
      const { data: settingsData } = await supabase
        .from("system_settings")
        .select("*")
        .limit(1)
        .single();

      if (settingsData) {
        setSettings(settingsData);
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      setMessage({ type: "error", text: "Kunde inte ladda faktura" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({
          status: formData.status,
          due_date: formData.due_date,
          payment_terms: formData.payment_terms,
          notes: formData.notes,
        })
        .eq("id", invoiceId);

      if (error) throw error;

      setInvoice((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: formData.status,
          due_date: formData.due_date,
          payment_terms: formData.payment_terms,
          notes: formData.notes,
        };
      });

      setEditing(false);
      setMessage({ type: "success", text: "Faktura uppdaterad!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating invoice:", error);
      setMessage({ type: "error", text: "Kunde inte uppdatera faktura" });
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "paid", payment_date: format(new Date(), "yyyy-MM-dd") })
        .eq("id", invoiceId);

      if (error) throw error;

      setInvoice((prev) => {
        if (!prev) return null;
        return { ...prev, status: "paid" };
      });

      setMessage({ type: "success", text: "Markerad som betald!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: "Kunde inte uppdatera" });
    }
  };

  const handleMarkAsSent = async () => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", invoiceId);

      if (error) throw error;

      setInvoice((prev) => {
        if (!prev) return null;
        return { ...prev, status: "sent" };
      });

      setMessage({ type: "success", text: "Markerad som skickad!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: "Kunde inte uppdatera" });
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice || !settings) return;
    try {
      await exportInvoiceToPDF(invoice, settings);
      setMessage({ type: "success", text: "PDF hämtad!" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: "Kunde inte generera PDF" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Faktura inte funnen</h2>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Tillbaka
        </button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-gray-300 text-gray-700",
  };

  const statusLabels: Record<string, string> = {
    draft: "📝 Utkast",
    sent: "📧 Skickad",
    paid: "✅ Betald",
    overdue: "⚠️ Förfallen",
    cancelled: "❌ Avbruten",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold"
        >
          <ArrowLeft size={20} />
          Tillbaka
        </button>
        <h1 className="text-4xl font-bold text-gray-900">{invoice.invoice_number}</h1>
        <div></div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{invoice.invoice_number}</h2>
                <p className="text-gray-600">
                  {format(new Date(invoice.invoice_date), "d MMMM yyyy", { locale: sv })}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[invoice.status]}`}>
                {statusLabels[invoice.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Bokningsnummer</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{invoice.booking_number || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Evemang</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {invoice.event_date ? format(new Date(invoice.event_date), "d MMM yyyy", { locale: sv }) : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Kund</h3>
            <div className="space-y-2 text-gray-700">
              <p className="font-semibold">{invoice.customer_name}</p>
              {invoice.customer_org_number && <p>Org-nr: {invoice.customer_org_number}</p>}
              {invoice.customer_street_address && <p>{invoice.customer_street_address}</p>}
              {invoice.customer_postal_code && (
                <p>
                  {invoice.customer_postal_code} {invoice.customer_city}
                </p>
              )}
              {invoice.customer_email && <p>{invoice.customer_email}</p>}
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Fakturaöversikt</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Beskrivning</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Antal</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Pris</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Totalt</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-3">{item.name}</td>
                    <td className="py-3 px-3 text-center">{item.quantity}</td>
                    <td className="py-3 px-3 text-right">{item.unit_price.toLocaleString("sv-SE")} SEK</td>
                    <td className="py-3 px-3 text-right font-semibold">{item.total_price.toLocaleString("sv-SE")} SEK</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2 text-right">
              <div className="flex justify-end gap-4 text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900 w-24">{invoice.subtotal.toLocaleString("sv-SE")} SEK</span>
              </div>
              {invoice.tax_amount > 0 && (
                <div className="flex justify-end gap-4 text-sm">
                  <span className="text-gray-600">Moms (25%):</span>
                  <span className="font-semibold text-gray-900 w-24">{invoice.tax_amount.toLocaleString("sv-SE")} SEK</span>
                </div>
              )}
              <div className="flex justify-end gap-4 pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">TOTALT:</span>
                <span className="font-bold text-gray-900 text-lg w-24">{invoice.total_amount.toLocaleString("sv-SE")} SEK</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Betalningsinformation</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600 uppercase font-semibold">Referensnummer</p>
                <p className="text-lg font-mono font-semibold text-gray-900 mt-1">
                  {generateSEBReferenceNumber(invoice.invoice_number)}
                </p>
              </div>
              {settings?.company_bank_account && (
                <div>
                  <p className="text-gray-600 uppercase font-semibold">Bankgiro</p>
                  <p className="text-gray-900">{settings.company_bank_account}</p>
                </div>
              )}
              {settings?.company_postgiro && (
                <div>
                  <p className="text-gray-600 uppercase font-semibold">Postgiro</p>
                  <p className="text-gray-900">{settings.company_postgiro}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Noteringar</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar - Edit & Actions */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
            <button
              onClick={handleDownloadPDF}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              <Download size={18} />
              Ladda ner PDF
            </button>

            {invoice.status !== "paid" && (
              <button
                onClick={handleMarkAsPaid}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
              >
                <Check size={18} />
                Markera som betald
              </button>
            )}

            {invoice.status !== "sent" && invoice.status !== "paid" && (
              <button
                onClick={handleMarkAsSent}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition"
              >
                <Check size={18} />
                Markera som skickad
              </button>
            )}

            <button
              onClick={() => setEditing(!editing)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition"
            >
              <Edit2 size={18} />
              {editing ? "Avbryt" : "Redigera"}
            </button>
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                >
                  <option value="draft">Utkast</option>
                  <option value="sent">Skickad</option>
                  <option value="paid">Betald</option>
                  <option value="overdue">Förfallen</option>
                  <option value="cancelled">Avbruten</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Förfallodatum</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Betalningsvillkor</label>
                <input
                  type="text"
                  placeholder="t.ex. 30 dagar netto"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Noteringar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
                >
                  <Check size={18} />
                  Spara
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition"
                >
                  <X size={18} />
                  Avbryt
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
