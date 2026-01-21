"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Plus, Search, FileText, Download, Eye, Trash2, Mail, DollarSign,
  CheckCircle2, Clock, AlertCircle, ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Invoice } from "@/lib/types";
import jsPDF from "jspdf";

interface InvoiceWithBooking extends Invoice {
  booking_number?: string;
  event_date?: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceWithBooking[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const statusOptions = [
    { value: "all", label: "Alla" },
    { value: "draft", label: "Utkast" },
    { value: "sent", label: "Skickad" },
    { value: "paid", label: "Betald" },
    { value: "overdue", label: "Förfallen" },
    { value: "cancelled", label: "Avbruten" },
  ];

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(
        (i) =>
          i.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.booking_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());

    setFilteredInvoices(filtered);
  }, [searchTerm, statusFilter, invoices]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .order("invoice_date", { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch booking info for each invoice
      if (invoicesData) {
        const invoicesWithBookings = await Promise.all(
          invoicesData.map(async (invoice) => {
            const { data: booking } = await supabase
              .from("bookings")
              .select("booking_number, event_date")
              .eq("id", invoice.booking_id)
              .single();
            return { ...invoice, ...booking };
          })
        );
        setInvoices(invoicesWithBookings);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setMessage({ type: "error", text: "Kunde inte ladda fakturor" });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "sent":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "paid":
        return "bg-green-100 text-green-700 border-green-300";
      case "overdue":
        return "bg-red-100 text-red-700 border-red-300";
      case "cancelled":
        return "bg-gray-300 text-gray-700 border-gray-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "📝 Utkast";
      case "sent":
        return "📧 Skickad";
      case "paid":
        return "✅ Betald";
      case "overdue":
        return "⚠️ Förfallen";
      case "cancelled":
        return "❌ Avbruten";
      default:
        return status;
    }
  };

  const downloadPDF = async (invoice: InvoiceWithBooking) => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 20;

      // Header
      pdf.setFontSize(24);
      pdf.text("FAKTURA", pageWidth / 2, y, { align: "center" });
      y += 15;

      // Invoice info
      pdf.setFontSize(11);
      pdf.text(`Fakturanummer: ${invoice.invoice_number}`, 20, y);
      y += 6;
      pdf.text(`Datum: ${format(new Date(invoice.invoice_date), "d MMMM yyyy", { locale: sv })}`, 20, y);
      y += 6;
      if (invoice.due_date) {
        pdf.text(`Förfallodatum: ${format(new Date(invoice.due_date), "d MMMM yyyy", { locale: sv })}`, 20, y);
        y += 6;
      }

      y += 8;

      // Customer info
      pdf.setFontSize(12);
      pdf.text("Till:", 20, y);
      y += 6;
      pdf.setFontSize(11);
      pdf.text(invoice.customer_name, 20, y);
      y += 5;
      if (invoice.customer_org_number) {
        pdf.text(`Org-nr: ${invoice.customer_org_number}`, 20, y);
        y += 5;
      }
      if (invoice.customer_street_address) {
        pdf.text(`${invoice.customer_street_address}`, 20, y);
        y += 5;
      }
      if (invoice.customer_postal_code) {
        pdf.text(`${invoice.customer_postal_code} ${invoice.customer_city}`, 20, y);
        y += 5;
      }

      y += 8;

      // Items table
      pdf.setFontSize(11);
      const headers = ["Beskrivning", "Antal", "Pris", "Totalt"];
      const itemRows = (invoice.items || []).map((item: any) => [
        item.name,
        item.quantity.toString(),
        `${item.unit_price.toLocaleString("sv-SE")} SEK`,
        `${item.total_price.toLocaleString("sv-SE")} SEK`,
      ]);

      // Simple table
      pdf.text(headers[0], 20, y);
      pdf.text(headers[1], 100, y);
      pdf.text(headers[2], 130, y);
      pdf.text(headers[3], 160, y);
      y += 8;

      itemRows.forEach((row: string[]) => {
        pdf.text(row[0], 20, y);
        pdf.text(row[1], 100, y);
        pdf.text(row[2], 130, y);
        pdf.text(row[3], 160, y);
        y += 6;
      });

      y += 8;

      // Totals
      pdf.setFontSize(12);
      pdf.text(`Subtotal: ${invoice.subtotal.toLocaleString("sv-SE")} SEK`, 130, y);
      y += 6;
      if (invoice.tax_amount > 0) {
        pdf.text(`Moms: ${invoice.tax_amount.toLocaleString("sv-SE")} SEK`, 130, y);
        y += 6;
      }
      pdf.setFont("helvetica", "bold");
      pdf.text(`TOTALT: ${invoice.total_amount.toLocaleString("sv-SE")} SEK`, 130, y);

      pdf.save(`${invoice.invoice_number}.pdf`);
      setMessage({ type: "success", text: "PDF hämtad!" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setMessage({ type: "error", text: "Kunde inte generera PDF" });
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!window.confirm("Är du säker på att du vill ta bort denna faktura?")) return;

    try {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
      setInvoices(invoices.filter((i) => i.id !== id));
      setMessage({ type: "success", text: "Faktura borttagen" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      setMessage({ type: "error", text: "Kunde inte ta bort faktura" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">📋 Fakturor</h1>
          <p className="text-gray-500 mt-2">Hantera och visa alla fakturor</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
        >
          <Plus size={20} />
          Ny Faktura (från bokning)
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <input
            type="text"
            placeholder="Sök fakturanummer, kund..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg">
            <p className="text-sm text-gray-600">Totalt belopp</p>
            <p className="text-2xl font-bold text-gray-900">
              {filteredInvoices.reduce((sum, i) => sum + i.total_amount, 0).toLocaleString("sv-SE")} SEK
            </p>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-semibold">Inga fakturor</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition"
            >
              <button
                onClick={() => setExpandedId(expandedId === invoice.id ? null : invoice.id)}
                className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{invoice.invoice_number}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>{invoice.customer_name}</span>
                    <span>•</span>
                    <span>{invoice.booking_number}</span>
                    <span>•</span>
                    <span>{format(new Date(invoice.invoice_date), "d MMM yyyy", { locale: sv })}</span>
                  </div>
                </div>
                <div className="text-right mr-4">
                  <p className="text-2xl font-bold text-gray-900">{invoice.total_amount.toLocaleString("sv-SE")} SEK</p>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition ${expandedId === invoice.id ? "rotate-180" : ""}`}
                />
              </button>

              {/* Expanded Details */}
              {expandedId === invoice.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Kundadress</p>
                      <p className="text-gray-900 font-medium mt-1">
                        {invoice.customer_street_address || "-"}
                      </p>
                      <p className="text-gray-900">
                        {invoice.customer_postal_code} {invoice.customer_city}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Belopp</p>
                      <p className="text-gray-900 font-medium mt-1">
                        Subtotal: {invoice.subtotal.toLocaleString("sv-SE")} SEK
                      </p>
                      {invoice.tax_amount > 0 && (
                        <p className="text-gray-900">
                          Moms: {invoice.tax_amount.toLocaleString("sv-SE")} SEK
                        </p>
                      )}
                      <p className="text-gray-900 font-bold">
                        Totalt: {invoice.total_amount.toLocaleString("sv-SE")} SEK
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Datum</p>
                      <p className="text-gray-900 font-medium mt-1">
                        {format(new Date(invoice.invoice_date), "d MMMM yyyy", { locale: sv })}
                      </p>
                      {invoice.due_date && (
                        <>
                          <p className="text-xs text-gray-600 uppercase mt-2">Förfallodatum</p>
                          <p className="text-gray-900">
                            {format(new Date(invoice.due_date), "d MMMM yyyy", { locale: sv })}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => downloadPDF(invoice)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                    >
                      <Download size={16} />
                      Ladda ner PDF
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition"
                    >
                      <Eye size={16} />
                      Visa
                    </button>
                    <button
                      onClick={() => deleteInvoice(invoice.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-semibold transition"
                    >
                      <Trash2 size={16} />
                      Ta bort
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
