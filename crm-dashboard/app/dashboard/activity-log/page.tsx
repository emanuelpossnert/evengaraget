"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Filter, Download } from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  user_email: string;
  details: string;
  timestamp: string;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchActivityLog();
  }, []);

  const fetchActivityLog = async () => {
    try {
      setLoading(true);

      // Fetch quotations as sample activity
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(50);

      if (bookings) {
        const activities: ActivityLog[] = bookings.map((b: any, idx: number) => ({
          id: `${idx}`,
          action: "updated",
          entity_type: "booking",
          entity_id: b.id,
          entity_name: b.booking_number,
          user_email: "system@eventgaraget.se",
          details: `Status ändrad till ${b.status}`,
          timestamp: b.updated_at,
        }));

        setLogs(activities);
      }
    } catch (error) {
      console.error("Error fetching activity log:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (typeFilter !== "all" && log.entity_type !== typeFilter) return false;
    return true;
  });

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: "Skapad",
      updated: "Uppdaterad",
      deleted: "Borttagen",
      signed: "Signerad",
      sent: "Skickad",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-green-100 text-green-700";
      case "updated":
        return "bg-blue-100 text-blue-700";
      case "deleted":
        return "bg-red-100 text-red-700";
      case "signed":
        return "bg-purple-100 text-purple-700";
      case "sent":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      booking: "Bokning",
      quotation: "Offert",
      invoice: "Faktura",
      customer: "Kund",
      product: "Produkt",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aktivitetslogg</h1>
          <p className="text-gray-500 mt-1">Översikt över alla ändringar i systemet</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-50 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors font-semibold">
          <Download size={18} />
          Exportera
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} />
          <h2 className="font-bold text-gray-900">Filter</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Åtgärd</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            >
              <option value="all">Alla</option>
              <option value="created">Skapad</option>
              <option value="updated">Uppdaterad</option>
              <option value="deleted">Borttagen</option>
              <option value="signed">Signerad</option>
              <option value="sent">Skickad</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Typ</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            >
              <option value="all">Alla</option>
              <option value="booking">Bokning</option>
              <option value="quotation">Offert</option>
              <option value="invoice">Faktura</option>
              <option value="customer">Kund</option>
              <option value="product">Produkt</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Resultat</label>
            <p className="text-sm text-gray-600">{filteredLogs.length} aktiviteter hittades</p>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Laddar aktivitetslogg...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Ingen aktivitet hittad</div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={log.id} className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-start gap-4">
                {/* Timeline dot */}
                <div className="flex flex-col items-center pt-1">
                  <div className="w-4 h-4 rounded-full bg-red-600"></div>
                  {idx !== filteredLogs.length - 1 && <div className="w-1 h-12 bg-gray-200 my-2"></div>}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {getTypeLabel(log.entity_type)}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-gray-900">
                    {log.entity_name}
                  </p>
                  {log.details && (
                    <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>👤 {log.user_email}</span>
                    <span>📅 {new Date(log.timestamp).toLocaleDateString("sv-SE")} {new Date(log.timestamp).toLocaleTimeString("sv-SE")}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

