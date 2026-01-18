"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Building2, Mail, Phone, Globe, Save } from "lucide-react";

interface CompanyInfo {
  id: string;
  company_name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  postal_code: string;
  city: string;
  org_number: string;
  vat_number: string;
  invoice_prefix: string;
  terms_and_conditions: string;
  logo_url: string;
  created_at: string;
}

export default function CompanySettingsPage() {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    postal_code: "",
    city: "",
    org_number: "",
    vat_number: "",
    invoice_prefix: "",
    terms_and_conditions: "",
  });

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);

      // In a real app, you'd fetch from a company_info table
      // For now, we'll create dummy data
      const dummyCompany: CompanyInfo = {
        id: "1",
        company_name: "EventGaraget AB",
        email: "admin@eventgaraget.se",
        phone: "+46 (0)8 123 45 67",
        website: "www.eventgaraget.se",
        address: "Eventvägen 1",
        postal_code: "123 45",
        city: "Stockholm",
        org_number: "123456-7890",
        vat_number: "SE123456789012",
        invoice_prefix: "INV",
        terms_and_conditions: "Kostnadsfri avbokning fram till 48 timmar före leverans.",
        logo_url: "/logo.png",
        created_at: new Date().toISOString(),
      };

      setCompany(dummyCompany);
      setFormData({
        company_name: dummyCompany.company_name,
        email: dummyCompany.email,
        phone: dummyCompany.phone,
        website: dummyCompany.website,
        address: dummyCompany.address,
        postal_code: dummyCompany.postal_code,
        city: dummyCompany.city,
        org_number: dummyCompany.org_number,
        vat_number: dummyCompany.vat_number,
        invoice_prefix: dummyCompany.invoice_prefix,
        terms_and_conditions: dummyCompany.terms_and_conditions,
      });
    } catch (error) {
      console.error("Error fetching company info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      // In a real app, you'd save to Supabase
      // For now, just show success
      alert("Företagsinformation sparad!");
      setSaving(false);
    } catch (error) {
      console.error("Error saving company info:", error);
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Laddar företagsinformation...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Företagsinformation</h1>
        <p className="text-gray-500 mt-1">Hantera din EventGaraget-baskundinformation</p>
      </div>

      {/* Company Info Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 size={20} />
            Grundläggande Information
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Företagsnamn *</label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Organisationsnummer *</label>
              <input
                type="text"
                required
                value={formData.org_number}
                onChange={(e) => setFormData({ ...formData, org_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                placeholder="123456-7890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Momsnummer</label>
              <input
                type="text"
                value={formData.vat_number}
                onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                placeholder="SE123456789012"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fakturaprefix</label>
              <input
                type="text"
                value={formData.invoice_prefix}
                onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                placeholder="INV"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail size={20} />
            Kontaktinformation
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefon *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webbplats</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Address Info */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Adress</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Gatuadress *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postnummer *</label>
              <input
                type="text"
                required
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stad *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Villkor & Villkor</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Villkor för hyra</label>
            <textarea
              value={formData.terms_and_conditions}
              onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 h-40"
              placeholder="Skriv dina hyrevillkor här..."
            />
            <p className="text-xs text-gray-500 mt-2">Dessa villkor kommer att visas på alla offerta</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Sparar..." : "Spara Ändringar"}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ Användning</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✓ Denna information användsautomatiskt på alla offerta och fakturor</li>
          <li>✓ Villkoren visas för kunder när de undertecknar offerta</li>
          <li>✓ Företagsnamn och kontaktuppgifter visas i CRM-systemet</li>
        </ul>
      </div>
    </div>
  );
}

