"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Plus, Search, Mail, Phone, Building2, Download, LayoutGrid, List, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  company_name?: string;
  org_number?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  customer_type?: string;
  status: string;
  total_bookings?: number;
  total_revenue?: number;
  lifetime_value?: number;
  is_vip?: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_contact_at?: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "blocked">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "private" | "business" | "vip">("all");

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    // Filter customers based on search term and filters
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (typeFilter !== "all") {
      if (typeFilter === "vip") {
        // VIP: customers with total_revenue >= 100000
        filtered = filtered.filter((c) => c.is_vip === true);
      } else {
        filtered = filtered.filter((c) => c.customer_type === typeFilter);
      }
    }

    setFilteredCustomers(filtered);
  }, [searchTerm, customers, statusFilter, typeFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      [
        "Namn",
        "Email",
        "Telefon",
        "Företag",
        "Org.nr",
        "Adress",
        "Postnummer",
        "Stad",
        "Kundtyp",
        "Status",
        "Bokningar",
        "Total intäkt",
        "Livstidsvärde",
        "Skapad",
      ],
      ...filteredCustomers.map((c) => [
        c.name,
        c.email,
        c.phone || "",
        c.company_name || "",
        c.org_number || "",
        c.address || "",
        c.postal_code || "",
        c.city || "",
        c.customer_type || "",
        c.status,
        c.total_bookings || 0,
        c.total_revenue || 0,
        c.lifetime_value || 0,
        format(new Date(c.created_at), "yyyy-MM-dd", { locale: sv }),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `kunder-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kunder</h1>
          <p className="text-gray-500 mt-1">Hantera alla dina kunder på ett ställe</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
          >
            <Download size={18} />
            CSV
          </button>
          <button
            onClick={() => router.push("/dashboard/customers/new")}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            <Plus size={20} />
            Ny Kund
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 bg-white rounded-lg p-6 border border-gray-200">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Sök efter namn, email, telefon eller företag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-red-500"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
            >
              <option value="all">Alla</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
              <option value="blocked">Blockerad</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kundtyp</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
            >
              <option value="all">Alla</option>
              <option value="private">Privatperson</option>
              <option value="business">Företag</option>
              <option value="vip">VIP</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "table" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "cards" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <LayoutGrid size={20} />
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          {filteredCustomers.length} av {customers.length} kunder
        </p>
      </div>

      {/* Customers View */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Laddar kunder...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
          <p className="text-gray-500 mb-4">
            {searchTerm ? "Inga kunder motsvarar din sökning" : "Inga kunder än"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => router.push("/dashboard/customers/new")}
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              Skapa första kund →
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Namn</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Telefon</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Företag</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Typ</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Bokningar</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Intäkt</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={16} />
                        {customer.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={16} />
                        {customer.phone || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 size={16} />
                        {customer.company_name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        customer.is_vip 
                          ? "bg-yellow-100 text-yellow-800 font-bold"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {customer.is_vip && "👑 VIP"}
                        {!customer.is_vip && customer.customer_type === "private" && "Privatperson"}
                        {!customer.is_vip && customer.customer_type === "business" && "Företag"}
                        {!customer.is_vip && customer.customer_type === "vip" && "VIP"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          customer.status === "active"
                            ? "bg-green-100 text-green-700"
                            : customer.status === "inactive"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {customer.status === "active" && "Aktiv"}
                        {customer.status === "inactive" && "Inaktiv"}
                        {customer.status === "blocked" && "Blockerad"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-semibold text-gray-900">{customer.total_bookings || 0}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {(customer.total_revenue || 0).toLocaleString("sv-SE")} SEK
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{customer.company_name || "Privatperson"}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    customer.status === "active"
                      ? "bg-green-100 text-green-700"
                      : customer.status === "inactive"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {customer.status === "active" && "Aktiv"}
                  {customer.status === "inactive" && "Inaktiv"}
                  {customer.status === "blocked" && "Blockerad"}
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={16} />
                  <span className="truncate">{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} />
                    {customer.phone}
                  </div>
                )}
                {customer.address && (
                  <div className="text-xs text-gray-600">
                    {customer.address}, {customer.postal_code} {customer.city}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium">Bokningar</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">{customer.total_bookings || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-700 font-medium">Total intäkt</p>
                  <p className="text-lg font-bold text-green-900 mt-1">
                    {((customer.total_revenue || 0) / 1000).toFixed(0)}k SEK
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-xs text-gray-500 pt-3 border-t border-gray-200">
                <p>Skapad: {format(new Date(customer.created_at), "d MMM yyyy", { locale: sv })}</p>
                {customer.last_contact_at && (
                  <p>Senast kontaktad: {format(new Date(customer.last_contact_at), "d MMM yyyy", { locale: sv })}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
