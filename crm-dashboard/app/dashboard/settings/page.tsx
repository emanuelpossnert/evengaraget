"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Percent, Save } from "lucide-react";

interface SystemSetting {
  key: string;
  value: string;
  value_type: "string" | "number" | "boolean" | "json";
  description: string;
  category: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inställningar</h1>
          <p className="text-gray-500 mt-1">Hantera systemet och behörigheter</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/dashboard/settings/email-templates" className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200 hover:border-purple-300 transition-all cursor-pointer">
          <h3 className="font-bold text-purple-900 mb-2">📧 E-postmallar</h3>
          <p className="text-sm text-purple-700">Anpassa e-postmeddelanden</p>
        </a>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-2">🔐 Säkerhet</h3>
          <p className="text-sm text-gray-700">RLS-policies & säkerhetsinställningar (Coming soon)</p>
        </div>
      </div>

      {/* System Settings Sections */}
      <div className="grid grid-cols-1 gap-6">
        {/* Tax & Discounts */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Percent className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Moms & Rabatter</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard momssats (%)</label>
              <input
                type="number"
                step="0.01"
                defaultValue="25"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lojalitetsrabatt (%)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

      </div>

      {/* General Terms & Policies */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Villkor & Regler</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Användarvillkor</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 h-24"
              placeholder="Skriv användarvillkoren här..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Returpolicy</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 h-24"
              placeholder="Skriv returpolicyn här..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Betalningsvillkor</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 h-24"
              placeholder="Skriv betalningsvillkoren här..."
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
      >
        <Save size={20} />
        Spara Alla Inställningar
      </button>
    </div>
  );
}

