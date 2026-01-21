"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Plus, Search, FileText, Download, Eye, Trash2, Mail, DollarSign,
  CheckCircle2, Clock, AlertCircle, ChevronDown, Archive
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Invoice, SystemSetting } from "@/lib/types";
import { exportInvoiceToPDF, exportMultipleInvoicesPDF } from "@/lib/pdf-utils";
import { InvoiceModal } from "@/components/InvoiceModal";

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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [settings, setSettings] = useState<SystemSetting | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [exportingBatch, setExportingBatch] = useState(false);

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
    fetchSettings();
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

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("*")
        .limit(1)
        .single();
      if (data) setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

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
      await exportInvoiceToPDF(invoice, settings || undefined);
      setMessage({ type: "success", text: "PDF hämtad!" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setMessage({ type: "error", text: "Kunde inte generera PDF" });
    }
  };

  const handleBatchExport = async () => {
    if (selectedInvoices.size === 0) {
      setMessage({ type: "error", text: "Välj minst en faktura" });
      return;
    }

    try {
      setExportingBatch(true);
      const selectedList = filteredInvoices.filter((inv) => selectedInvoices.has(inv.id));
      await exportMultipleInvoicesPDF(selectedList, settings || undefined);
      setMessage({ type: "success", text: "PDFs exporterade!" });
      setSelectedInvoices(new Set());
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error exporting batch:", error);
      setMessage({ type: "error", text: "Kunde inte exportera PDFs" });
    } finally {
      setExportingBatch(false);
    }
  };

  const toggleSelectInvoice = (id: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedInvoices(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map((inv) => inv.id)));
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
          onClick={() => setShowInvoiceModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
        >
          <Plus size={20} />
          Skapa Faktura
        </button>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <InvoiceModal
          onClose={() => setShowInvoiceModal(false)}
          onSuccess={() => {
            fetchInvoices();
            setMessage({ type: "success", text: "Faktura skapad!" });
            setTimeout(() => setMessage(null), 3000);
          }}
        />
      )}

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
        {/* Batch Export Toolbar */}
        {selectedInvoices.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-900">
              {selectedInvoices.size} faktura{selectedInvoices.size !== 1 ? "or" : ""} vald{selectedInvoices.size !== 1 ? "a" : ""}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleBatchExport}
                disabled={exportingBatch}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition disabled:opacity-50"
              >
                <Archive size={16} />
                {exportingBatch ? "Exporterar..." : `Exportera ${selectedInvoices.size} som ZIP`}
              </button>
              <button
                onClick={() => setSelectedInvoices(new Set())}
                className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition"
              >
                Avbryt urval
              </button>
            </div>
          </div>
        )}
        
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
              <div className="flex items-start gap-3 p-4 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedInvoices.has(invoice.id)}
                  onChange={() => toggleSelectInvoice(invoice.id)}
                  className="mt-1 w-5 h-5 rounded border-gray-300"
                />
                <button
                  onClick={() => setExpandedId(expandedId === invoice.id ? null : invoice.id)}
                  className="flex-1 text-left"
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
              </div>

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
