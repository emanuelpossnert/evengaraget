"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Percent, Save, Building2, Mail } from "lucide-react";
import { SystemSetting } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    company_org_number: "",
    company_address: "",
    company_postal_code: "",
    company_city: "",
    company_country: "",
    company_bank_account: "",
    company_postgiro: "",
    company_website: "",
    tax_rate: 25,
    currency: "SEK",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Fetch error:", error);
      }

      if (data) {
        setSettings(data);
        setFormData({
          company_name: data.company_name || "",
          company_org_number: data.company_org_number || "",
          company_address: data.company_address || "",
          company_postal_code: data.company_postal_code || "",
          company_city: data.company_city || "",
          company_country: data.company_country || "",
          company_bank_account: data.company_bank_account || "",
          company_postgiro: data.company_postgiro || "",
          company_website: data.company_website || "",
          tax_rate: data.tax_rate || 25,
          currency: data.currency || "SEK",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (settings?.id) {
        // Update existing
        const { error } = await supabase
          .from("system_settings")
          .update(formData)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from("system_settings").insert([formData]);

        if (error) throw error;
      }

      setMessage({ type: "success", text: "Inställningar sparade!" });
      setTimeout(() => setMessage(null), 3000);
      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Kunde inte spara inställningar" });
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
          <h1 className="text-4xl font-bold text-gray-900">⚙️ Inställningar</h1>
          <p className="text-gray-500 mt-2">Hantera systemet och behörigheter</p>
        </div>
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

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="/dashboard/settings/email-templates"
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200 hover:border-purple-300 transition-all cursor-pointer"
        >
          <h3 className="font-bold text-purple-900 mb-2">📧 E-postmallar</h3>
          <p className="text-sm text-purple-700">Anpassa e-postmeddelanden</p>
        </a>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-2">🔐 Säkerhet</h3>
          <p className="text-sm text-gray-700">RLS-policies & säkerhetsinställningar (Coming soon)</p>
        </div>
      </div>

      {/* Company/Invoice Settings */}
      <div className="bg-white rounded-lg p-8 border border-gray-200 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="text-red-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">Fakturainställningar</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Företagsnamn *</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Eventgaraget AB"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Organisationsnummer</label>
              <input
                type="text"
                value={formData.company_org_number}
                onChange={(e) => setFormData({ ...formData, company_org_number: e.target.value })}
                placeholder="559123-4567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Adress</label>
              <input
                type="text"
                value={formData.company_address}
                onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                placeholder="Huvudvägen 123"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Postnummer</label>
              <input
                type="text"
                value={formData.company_postal_code}
                onChange={(e) => setFormData({ ...formData, company_postal_code: e.target.value })}
                placeholder="118 20"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stad</label>
              <input
                type="text"
                value={formData.company_city}
                onChange={(e) => setFormData({ ...formData, company_city: e.target.value })}
                placeholder="Stockholm"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Land</label>
              <input
                type="text"
                value={formData.company_country}
                onChange={(e) => setFormData({ ...formData, company_country: e.target.value })}
                placeholder="Sverige"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Webbsida</label>
              <input
                type="text"
                value={formData.company_website}
                onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                placeholder="www.eventgaraget.se"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white rounded-lg p-8 border border-gray-200 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Mail className="text-blue-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">Betalningsuppgifter</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bankgiro</label>
            <input
              type="text"
              value={formData.company_bank_account}
              onChange={(e) => setFormData({ ...formData, company_bank_account: e.target.value })}
              placeholder="5000-1234"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Postgiro</label>
            <input
              type="text"
              value={formData.company_postgiro}
              onChange={(e) => setFormData({ ...formData, company_postgiro: e.target.value })}
              placeholder="123 45 67-8"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Momssats (%)</label>
            <input
              type="number"
              step="0.01"
              value={formData.tax_rate}
              onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Valuta</label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Tax & Discounts */}
      <div className="bg-white rounded-lg p-8 border border-gray-200 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="text-blue-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">Moms & Rabatter</h2>
        </div>
        <p className="text-sm text-gray-600">Momssatsen är redan inställd i Betalningsuppgifter-sektionen ovan.</p>
      </div>

      {/* General Terms & Policies */}
      <div className="bg-white rounded-lg p-8 border border-gray-200 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Villkor & Regler</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Användarvillkor</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 h-24"
              placeholder="Skriv användarvillkoren här..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Returpolicy</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 h-24"
              placeholder="Skriv returpolicyn här..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Betalningsvillkor</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 h-24"
              placeholder="Skriv betalningsvillkoren här..."
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveSettings}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 rounded-lg hover:shadow-lg transition-all font-bold text-lg"
      >
        <Save size={24} />
        Spara Alla Inställningar
      </button>
    </div>
  );
}

